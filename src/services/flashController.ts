import type { SqlDb } from "../db/types.ts";
import type { PoolFilter, QuestionView } from "../types/domain.ts";
import { eligibleQuestionIds, loadQuestions, resolveRuleForQuestions } from "../repositories/content.ts";
import { createSession, finishFlashSession, newSessionId, recordFlashResult } from "../repositories/sessions.ts";
import {
  applyFlashEvent, finishFlash, restartCurrentTimer, startFlash, summarizeFlash,
  type FlashRecord, type FlashState, type FlashSummary, type Rng
} from "./flash.ts";
import { flashAdvice, type AdviceKey } from "./advice.ts";
import { flashScore, isAnswerCorrect, type RuleStatus, type ScoringRule } from "./scoring.ts";
import { toScorable } from "./practiceService.ts";

export type FlashPhase = "asking" | "feedback" | "loading" | "finished";

export interface FlashResult {
  summary: FlashSummary;
  /** null when no marking rule applies; never invented. */
  score: number | null;
  ruleStatus: RuleStatus;
  rule: { correctMarks: number; incorrectPenalty: number; unansweredMarks: number } | null;
  advice: AdviceKey[];
  perQuestionSeconds: number;
  poolSize: number;
}

export interface FlashFeedback {
  question: QuestionView;
  record: FlashRecord;
  correctKeys: string[];
}

export interface FlashActionResult {
  applied: boolean;
  feedback?: FlashFeedback;
}

/**
 * Framework-independent Flash Question session. Every transition runs synchronously against `state`
 * before any await, so a tap and a timeout racing each other can score a question at most once
 * (the loser is rejected by the position/deadline guard in applyFlashEvent).
 * Persistence is queued per resolved question and is idempotent per (session, position).
 */
export class FlashController {
  readonly sessionId: string;
  readonly poolSize: number;
  readonly rule: ScoringRule;
  readonly perQuestionSeconds: number;
  phase: FlashPhase = "loading";
  state: FlashState;
  feedback: FlashFeedback | null = null;
  persistFailures = 0;
  private cache = new Map<string, QuestionView>();
  private persistChain: Promise<void> = Promise.resolve();
  private pendingLoad: Promise<void> = Promise.resolve();
  private loadError: unknown = null;
  private result: FlashResult | null = null;
  private rng: Rng;
  private clock: () => number;

  private db: SqlDb;

  private constructor(
    db: SqlDb, sessionId: string, state: FlashState, rule: ScoringRule, poolSize: number, perQuestionSeconds: number, rng: Rng, clock: () => number
  ) {
    this.db = db;
    this.sessionId = sessionId; this.state = state; this.rule = rule; this.poolSize = poolSize;
    this.perQuestionSeconds = perQuestionSeconds; this.rng = rng; this.clock = clock;
  }

  /** Returns null when the filter has no eligible question (the UI shows an empty state). */
  static async start(
    db: SqlDb, filter: PoolFilter, perQuestionSeconds: number,
    opts: { now?: number; rng?: Rng; clock?: () => number } = {}
  ): Promise<FlashController | null> {
    const clock = opts.clock ?? (() => Date.now());
    const now = opts.now ?? clock();
    const rng = opts.rng ?? Math.random;
    const pool = await eligibleQuestionIds(db, filter);
    const state = startFlash(pool, perQuestionSeconds, now, rng);
    if (!state) return null;
    const rule = await resolveRuleForQuestions(db, state.poolIds, filter);
    const id = newSessionId(now);
    await createSession(db, { id, mode: "flash", filter, startedAt: now, perQuestionSeconds, rule });
    const controller = new FlashController(db, id, state, rule, state.poolIds.length, perQuestionSeconds, rng, clock);
    await controller.load(state.currentQuestionId);
    controller.state = restartCurrentTimer(controller.state, clock());
    controller.phase = "asking";
    return controller;
  }

  get question(): QuestionView | null {
    return this.state.currentQuestionId ? this.cache.get(this.state.currentQuestionId) ?? null : null;
  }

  private async load(id: string | null): Promise<void> {
    if (!id || this.cache.has(id)) return;
    const [q] = await loadQuestions(this.db, [id]);
    if (!q) throw new Error(`Question ${id} is no longer available.`);
    this.cache.set(id, q);
  }

  private enqueue(record: FlashRecord): void {
    this.persistChain = this.persistChain
      .then(() => recordFlashResult(this.db, this.sessionId, record))
      .catch(() => { this.persistFailures += 1; });
  }

  private resolve(event: { type: "answer"; position: number; keys: string[] } | { type: "skip"; position: number } | { type: "timeout"; position: number }, now: number) {
    if (this.phase !== "asking") return null;
    const q = this.question;
    if (!q) return null;
    let applied;
    if (event.type === "answer") {
      if (event.keys.length === 0 || !q.options.some((o) => o.key === event.keys[0])) return null;
      const correct = isAnswerCorrect(toScorable(q), event.keys) === true;
      applied = applyFlashEvent(this.state, { type: "answer", position: event.position, selectedKeys: event.keys, correct }, now, this.rng);
    } else {
      applied = applyFlashEvent(this.state, event, now, this.rng);
    }
    if (!applied.applied || !applied.record) return null;
    this.state = applied.state;
    this.enqueue(applied.record);
    this.pendingLoad = this.load(this.state.currentQuestionId).catch((e: unknown) => { this.loadError = e; });
    return { record: applied.record, question: q };
  }

  /** Answer or timeout: show feedback until `next()`. */
  private showFeedback(r: { record: FlashRecord; question: QuestionView }): FlashActionResult {
    this.phase = "feedback";
    this.feedback = { question: r.question, record: r.record, correctKeys: r.question.options.filter((o) => o.isCorrect).map((o) => o.key) };
    return { applied: true, feedback: this.feedback };
  }

  async answer(position: number, keys: string[], now: number = this.clock()): Promise<FlashActionResult> {
    const r = this.resolve({ type: "answer", position, keys }, now);
    return r ? this.showFeedback(r) : { applied: false };
  }

  async timeout(position: number, now: number = this.clock()): Promise<FlashActionResult> {
    const r = this.resolve({ type: "timeout", position }, now);
    return r ? this.showFeedback(r) : { applied: false };
  }

  async skip(position: number, now: number = this.clock()): Promise<FlashActionResult> {
    const r = this.resolve({ type: "skip", position }, now);
    if (!r) return { applied: false };
    this.phase = "loading";
    await this.pendingLoad;
    this.throwIfLoadFailed();
    this.state = restartCurrentTimer(this.state, this.clock());
    this.phase = "asking";
    return { applied: true };
  }

  /** Leaves the feedback view and starts the next question's own timer. */
  async next(): Promise<void> {
    if (this.phase !== "feedback") return;
    this.phase = "loading";
    this.feedback = null;
    await this.pendingLoad;
    this.throwIfLoadFailed();
    this.state = restartCurrentTimer(this.state, this.clock());
    this.phase = "asking";
  }

  private throwIfLoadFailed(): void {
    if (this.loadError) {
      const e = this.loadError;
      this.loadError = null;
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  /** Remaining whole seconds for the question on screen; 0 outside the asking phase. */
  remainingSeconds(now: number): number {
    return this.phase === "asking" ? Math.max(0, Math.ceil((this.state.deadline - now) / 1000)) : 0;
  }

  /** Ends the session. The unresolved on-screen question is not counted. Idempotent. */
  async finish(now: number = this.clock()): Promise<FlashResult> {
    if (this.result) return this.result;
    this.state = finishFlash(this.state);
    this.phase = "finished";
    await this.persistChain;
    const summary = summarizeFlash(this.state.records, this.state.startedAt, now, this.poolSize);
    const rule = this.rule.status === "unconfigured" ? null
      : { correctMarks: this.rule.correctMarks, incorrectPenalty: this.rule.incorrectPenalty, unansweredMarks: this.rule.unansweredMarks };
    this.result = {
      summary,
      score: flashScore(summary, this.rule),
      ruleStatus: this.rule.status,
      rule,
      advice: flashAdvice(summary, this.perQuestionSeconds),
      perQuestionSeconds: this.perQuestionSeconds,
      poolSize: this.poolSize
    };
    await finishFlashSession(this.db, this.sessionId, now, JSON.stringify(this.result));
    return this.result;
  }
}
