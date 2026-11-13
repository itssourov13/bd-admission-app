# Phase 11 — Home UX polish, dark-mode contrast and university-aware exam pattern

Started: 2026-11-13. Branch: `feat/import-hstu-verified-answers-2026-11-12`. Node 22.23.1 (`.nvmrc`).
Status: **Implemented — Pending Owner Verification** (local working tree, uncommitted until the final commit step; statuses: Not Started → In Progress → Implemented → Pending Owner Verification).

## 1. Objective and scope
Owner real-device feedback on v0.1.5 preview (EAS build `41bd1c7e-9376-41a7-abb0-860ab8031273`, untouched):
A. Home hierarchy/CTA polish (the Hero "Or take a mock exam" text link must become a real secondary button).
B. Hero redesign following the supplied BD Admission banner direction (navy + green + gold, cap motif, honest imagery).
C. Dark-mode readability fix + broader contrast audit + automated contrast regression tests.
D. University-aware Mock/Standard Exam (stop institution scopes inheriting generic 100q/60min; remove fixed `>= 100` UI gates).
Out of scope: version/versionCode, app id/EAS/signing, EAS builds, pushing, emulator campaigns, question/answer data edits.

## 2. Initial repository state (verified)
- Branch `feat/import-hstu-verified-answers-2026-11-12`, working tree clean, HEAD `2a458ac docs: record v0.1.5 EAS preview submission`.
- AGENTS.md read: generic exam = 100q/60min only for all-catalogue scope; exact paper uses only its own source-backed pattern; Custom Practice is unscored/unofficial; no fabricated rules.

## 3. Confirmed root causes
| # | Finding | Evidence |
|---|---|---|
| RC1 | Hero eyebrow/context line use `text-brand-200`; dark `brand200 = #1F5E4D` on the always-dark navy hero gradient → unreadable. Hero is dark in both themes, so its foreground must be theme-independent light tokens. | `palettes.ts` darkColors.brand200, `HomeHero.tsx` L76/L84. Existing `settings-theme.test.ts` only checks ink-on-surface. |
| RC2 | Hero secondary action is an underlined `Txt` link (`home.heroExamLink`), not a button. | `HomeHero.tsx` last Pressable |
| RC3 | Institution/multi-institution scopes (no `paperId`) fall into `planExam` generic branch → 100q/60min, and `startStandardExam` nulls the rule (marks/count) — so a university mock exam silently used generic defaults. | `exam.ts planExam`, `practiceService.ts` L41/L97, `app/exam/setup.tsx` L60 |
| RC4 | Fixed `>= 100` visibility gates: `app/institution/[id].tsx` L46, `VarsityScreen.tsx` L76. | grep |
| RC5 | Home repeats Flash/Mock actions: hero CTAs + two "Flash/Mock" tiles + Varsity/Medical/Library cards. | `app/(tabs)/index.tsx` |

## 4. Canonical rule data (re-verified from `data/question-packs/*.json`, 219 files)
| Institution | Stored exam-rule state |
|---|---|
| DU (A, 2024-25, 2025-26) | 2 papers, **illustrative** 60q/2700s, select 4 of 6 subjects ×15 (publisher pattern, not official) |
| JU (A/D, 2024-25) | 3 papers **verified** 80q/3300s/80 marks (units A set02, D set12, D set13); every other JU paper `unconfigured` |
| HSTU 2024-25 A/B | 5 papers verified `totalMarks=100` only (no count/duration) → incomplete; all others unconfigured |
| RU / RU-V | no `examRules` at all. Source note: RU 2024-25 circular = 100 marks, **80 MCQs/unit**, 1 hour — but not attached (no exact official paper). Product assumption "RU = 100 questions" is **not** source-backed. |

## 5. Design decisions
- D1: Institution scope is **never generic**. `planExam` gets `institutionScoped`; without a resolved pattern it is `unavailable` (→ explicit Custom Practice). Category/all-catalogue scope keeps generic 100/60 (intentional).
- D2: New concept **exam pattern option** = group of papers of one parent university sharing session+unit and one identical *complete* stored pattern (q>0, s>0, status ≠ unconfigured). Pure grouping function in `src/services/exam.ts` (testable without DB); data via a repository query over `exam_papers`+`exam_rules` (no migration needed).
- D3: Pattern scope uses a new `PoolFilter.paperIds` (pool = only those papers' questions; rule resolved from the same papers). A single-paper option with `selectionConfig` (DU) routes to the existing exact-paper `paperId` path.
- D4: Setup UI for institution scope: pattern options (labelled Official / Source-pattern practice) + Custom Practice; eligibility computed from the chosen pattern and its real pool.
- D5: Entry-button visibility (`institution/[id]`, `VarsityScreen`) computed from patterns + pool via one helper (`examEntryAvailable`), no universal threshold.
- D6: Session count/duration frozen at creation (already stored in session: `durationSeconds`, `deadlineAt`, rule snapshot) — unchanged.
- D7: Hero: native RN hero (no new heavy asset): navy→green gradient, gold accents, cap motif, mini phone-frame composition built from Views (honest, non-screenshot), theme-independent light foreground tokens; primary = filled "Start practising", secondary = outlined/translucent button "Take a mock exam" with icon; resume mode shows a single Resume CTA. No Google Play claim.
- D8: Contrast: add `heroForeground` tokens (not theme-flipped), fix RC1, add tests that compute contrast for every Hero text/background pair in both themes plus buttons/chips/selected states; audit hardcoded hex usages.

## 6. Progress checklist
- [x] Inspect repo, AGENTS.md, exam flow, rule data
- [x] Write this plan
- [x] Exam: `planExam` institution scope + pattern grouping + `paperIds` filter
- [x] Exam: repository query for pattern options
- [x] Exam: setup screen pattern picker + custom fallback
- [x] Exam: remove `>= 100` gates (`examEntryAvailable`; no `>= 100` left in `app/` or `src/**/*.tsx`)
- [x] Exam tests (`tests/exam-pattern.test.ts`; two stale expectations updated, see section 7)
- [x] Contrast: tokens + tests (`tests/hero-contrast.test.ts`)
- [x] Home: hero redesign + CTA hierarchy (in working tree; needs real-device look)
- [ ] Home tests (pure logic: CTA targets/mode) — not added
- [x] Checks (2026-11-13, Node 22.23.1): `pnpm test` 227/227, `pnpm typecheck`, `pnpm lint` (0 errors), `pnpm content:check` (217 packs, 13609 questions), `git diff --check` all clean. Metro export not run.
- [ ] Reconcile CURRENT_STATE/TASK_STATE/CHANGELOG/IMPLEMENTATION_LOG, commit

## 7. Files modified / schema changes / tests / commits
- No DB migration, no version bump, no push, no EAS build.
- Post-audit fixes (2026-11-13), from `docs/audits/APP_WIDE_AUDIT.md` F1, F2, F4:
  - F1: `tests/repositories.test.ts` and `tests/ru-verified-bank-import.test.ts` now assert that a university scope without Custom Practice is refused (`reason: "rule_unavailable"`), then start a Custom Practice session (100 q / 3600 s) and keep the original assertions. App behaviour unchanged.
  - F2: `app/exam/setup.tsx` computes `institutionIdsKey`, `paperIdsKey`, `universityIdsKey` as plain strings above the hooks, so `react-hooks/use-memo` no longer fires.
  - F4: `app/exam/setup.tsx` has a `patternsPending` loading gate. The scope query returns early until the university patterns have loaded, so there is no "Custom practice" flash and no duplicate pool query.
- Deferred on purpose: F3 (Expo Go `copyAsync`, dev-workflow only; use the APK or a dev client), F6–F9 (Low), exam-timer re-render isolation, optional "100 q / 60 min, not official" preset (product decision U2).
- Environment note: the shell default Node was 24.x, which cannot load `.ts` tests; run checks with Node 22.23.1 (`.nvmrc`), e.g. `export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH`.

## 8. Owner verification (pending)
Real-device check of hero in light/dark, Bangla/English, large font; institution mock exam options for JU/DU/RU/HSTU; custom-practice fallback.
