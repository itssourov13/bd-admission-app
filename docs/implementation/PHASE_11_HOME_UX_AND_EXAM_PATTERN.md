# Phase 11 — Home UX polish, dark-mode contrast and university-aware exam pattern

Started: 2026-11-13. Branch: `feat/import-hstu-verified-answers-2026-11-12`. Node 22.23.1 (`.nvmrc`).
Status: **Implemented — Pending Owner Verification** (source, tests and docs committed locally; EAS preview build requested; no push).

## 1. Objective and scope
Owner real-device feedback on v0.1.5 preview (EAS build `41bd1c7e-9376-41a7-abb0-860ab8031273`, untouched):
A. Home hierarchy/CTA polish (the Hero "Or take a mock exam" text link must become a real secondary button).
B. Hero redesign following the supplied BD Admission banner direction (navy + green + gold, cap motif, honest imagery).
C. Dark-mode readability fix + broader contrast audit + automated contrast regression tests.
D. University-aware Mock/Standard Exam (stop institution scopes inheriting generic 100q/60min; remove fixed `>= 100` UI gates).
Preserved: application ID, EAS project ID, existing signing identity, question/answer data and scoring provenance. A separate owner-authorized preview release uses version 0.1.6 / Android versionCode 7; production publishing and Git push remain out of scope.

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
- D7: Hero evolved after runtime screenshots: compact composite layout with a decorative landscape campus photo + navy scrim for headline, then native app text and actual 48 dp Pressable actions below on the navy→green surface. It uses a small 782×382 owner-reference crop; it is not a bespoke generated 1024×500 cover and its public-distribution rights require confirmation. Buttons adapt to narrow widths/large font scale; resume mode retains a single Resume CTA.
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
- [x] Home: compact photographic cover, readable scrim, independent native CTA rail, responsive stacking and resume behavior.
- [x] Home Hero structure/contrast regression tests (`tests/home-hero-structure.test.ts`, `tests/hero-contrast.test.ts`).
- [x] Final checks (2026-11-13, Node 22.23.1): `pnpm test` 240/240, `pnpm typecheck`, `pnpm lint`, `pnpm content:check` (217 packs / 13,609 questions), Expo public config, Android no-bytecode Metro export and `git diff --check` pass.
- [x] Reconciled CURRENT_STATE, TASK_STATE, CHANGELOG, HANDOFF, QA_CHECKLIST, ANDROID_RELEASE, Phase 7, this Phase 11 note and cover provenance.
- [x] Prepared installable preview metadata 0.1.6 / Android versionCode 7; previous 0.1.5 / code 6 EAS build is finished and contains older source.

## 7. Files modified / schema changes / tests / commits
- No DB migration, question/answer data edits, scoring changes, dependency additions or schema changes. The preview version was incremented separately to 0.1.6 / Android versionCode 7 so the new APK can update the installed version 0.1.5 / code 6. No push.
- Post-audit fixes (2026-11-13), from `docs/audits/APP_WIDE_AUDIT.md` F1, F2, F4:
  - F1: `tests/repositories.test.ts` and `tests/ru-verified-bank-import.test.ts` now assert that a university scope without Custom Practice is refused (`reason: "rule_unavailable"`), then start a Custom Practice session (100 q / 3600 s) and keep the original assertions. App behaviour unchanged.
  - F2: `app/exam/setup.tsx` computes `institutionIdsKey`, `paperIdsKey`, `universityIdsKey` as plain strings above the hooks, so `react-hooks/use-memo` no longer fires.
  - F4: `app/exam/setup.tsx` has a `patternsPending` loading gate. The scope query returns early until the university patterns have loaded, so there is no "Custom practice" flash and no duplicate pool query.
- Deferred on purpose: F3 (Expo Go `copyAsync`, dev-workflow only; use the APK or a dev client), F6–F9 (Low), exam-timer re-render isolation, optional "100 q / 60 min, not official" preset (product decision U2).
- Environment note: the shell default Node was 24.x, which cannot load `.ts` tests; run checks with Node 22.23.1 (`.nvmrc`), e.g. `export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH`.

## 8. Owner verification (pending)
Real-device check of hero in light/dark, Bangla/English, large font; institution mock exam options for JU/DU/RU/HSTU; custom-practice fallback.


## Home Hero runtime follow-up and release readiness — 2026-11-13

The owner-provided runtime screenshots exposed the CTA styling regression and Profile metric foreground issue. The follow-up is documented in `docs/implementation/PHASE_07_HOME_HERO.md` and `docs/audits/HOME_HERO_RUNTIME_AUDIT.md`. The cover is a reference-derived temporary crop; a bespoke cover can replace it without changing the native CTA architecture.

Exam startup decision: the provisional-only branch previously executed an identical read-only subject-pool count twice. It now reuses the first result. The expected work of selecting among a large pack catalogue remains unchanged; no speculative indexing, caching, selection rewrite or database redesign was introduced.

Verification: 240/240 tests, typecheck, lint after removing the unused directive, content check, Expo public config and Android no-bytecode export pass on Node 22.23.1. Native build and physical-device QA remain distinct checks.
