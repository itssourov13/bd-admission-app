# Architecture and product decisions

## ADR-001 — Independent workspace
Status: accepted, 2026-10-28.
The app lives in /home/kali/gpt-workspace/bd-admission-app with its own Git repository. ScholarHub is a read-only source for selective code reuse. Rationale: avoid damaging the source and avoid carrying unrelated scholarship business logic.

## ADR-002 — Reuse source mobile foundations
Status: accepted.
Reuse/adapt compatible typography, Button, Card, Chip, Screen, design tokens, Expo/NativeWind/Babel/Metro setup and language-provider pattern. Build a fresh admission-specific logo and translation dictionary. Rationale: reduce implementation time while keeping the user experience independent.

## ADR-003 — Offline-first single-device initial release
Status: accepted.
Expo SQLite is planned as the authoritative store for question content and practice records. No account, hosted database, API or cloud sync is required for core features. Rationale: reliable practice without a network.

## ADR-004 — Separate question content from source appearances
Status: accepted.
Store the question itself separately from each paper/year/unit/source appearance. Do not automatically merge records based only on similar wording. Rationale: preserve traceability and repeated appearances.

## ADR-005 — Unknown answers and rules stay unknown
Status: accepted.
Answer keys and exam scoring rules have explicit verification status. Unknown answers must not be inferred; illustrative rules cannot be labelled official. Rationale: exam preparation requires trustable correctness and scoring.

## ADR-006 — Idempotent, transaction-based content import
Status: accepted.
Validate packs before import, use stable IDs and transactions, and preserve attempts/bookmarks. Re-importing the same batch must not duplicate records or erase user data. Rationale: repeated PDF updates are expected.

## ADR-007 — Practice logic independent of UI
Status: accepted.
Timer calculations, Flash cycling, answer states, Standard Exam submission and scoring belong in testable services. Rationale: reduce UI race conditions and make business rules verifiable.

## ADR-008 — Node and SDK alignment
Status: accepted.
Keep the source mobile project's compatible Expo SDK 57 / React Native 0.86 baseline initially. Use Node 22.23.1 via .nvmrc. Do not upgrade the stack while establishing the first foundation without a specific reason.

## ADR-009 — Preserve the Android/Termux pnpm configuration
Status: accepted.
Carry forward the source mobile pnpm workspace settings, including hoisted node linking and copied package imports, because they were added to address file metadata behavior in the user's Termux/F2FS environment.

## ADR-010 — Give the app its own visual identity
Status: accepted, 2026-10-28.
The app has its own provisional name, navy/emerald/gold palette, open-book/progress mark, local icon/adaptive/splash assets and central brand.config.json. app.config.js, theme.ts and Tailwind read the same config. Rationale: avoid inherited visual identity and keep future naming changes straightforward.

## ADR-011 — Source reuse is provenance, not a dependency
Status: accepted, 2026-10-28.
Reused files live locally in this repository. App code, app configuration, package.json and pnpm configuration must not import or link to the source checkout. Source details remain only in the reuse inventory for provenance. Rationale: the original source repository must not be needed for future install, build or implementation.

## ADR-012 — Demo data is never historical data
Status: accepted.
Synthetic fixtures are isolated from real question packs and explicitly labelled. No historical questions are bundled until supplied and checked.

## ADR-013 — Exam pattern is institution- and paper-specific
Status: accepted, 2026-10-28.
Question count, duration, subject/section distribution and marking rules must be configured from the verified pattern for the exact institution, academic year/session, unit and paper (and shift where applicable). There is no assumed all-university format: RU may have a 100-question pattern while other exams may contain 80 or 60 questions. These figures are examples, not defaults to copy blindly. The general all-catalogue Standard Exam may use a 100-question/60-minute fallback, but exact-paper sessions must consume their own question count, duration, marking and any section-selection configuration. Unknown pattern fields remain unconfigured, never guessed; scan-derived or mismatched patterns remain illustrative, not official.

## 2026-10-28 application-pass decisions
- **Exactly-once exam finalization** is enforced twice: a ref guard in the screen and a conditional `UPDATE ... WHERE status='active'` inside a transaction in `finalizeExamSession`. Selections are refused in SQL once the deadline has passed, so late taps can never change a result.
- **Deadlines are absolute wall-clock times** (stored in SQLite for exams); `useNow` re-reads the clock on foreground, so backgrounding cannot extend time. Flash restarts a question's timer after the feedback screen so reading feedback is not charged.
- **No score without a rule**: with an unconfigured rule results show counts and accuracy only. Illustrative rules are labelled "not official" everywhere.
- **Practice pools exclude questions without a verified answer** instead of showing them unscored; the UI explains why.
- **Flash finishing**: the unresolved on-screen question is not counted; leaving the screen by any route closes the session (idempotent).
- **State for controllers**: the Flash controller is held in React state (mutated only in event handlers, with a revision counter) to satisfy the React compiler lint rules.
- **Android export**: hermesc crashes with SIGILL on this host, so `expo export --no-bytecode` is used as the bundle validation here; release bytecode export must be built elsewhere.

## 2026-10-28 — Do not present publisher question-bank pattern as official DU exam
- Evidence: the supplied scanned question-bank pages describe a 60-question MCQ practice set, 45 minutes, and choosing four of six 15-question subjects. The official DU 2025–2026 notice ([primary source](https://www.du.ac.bd/du_post_details/news/25400), 13 October 2025) describes 60 marks of MCQ plus 40 marks of written questions, with 45 minutes for each.
- Decision: keep the scan-derived marking/pattern metadata `illustrative`; UI labels this paper-specific mode as question-bank practice. Never treat it as a complete official DU admission simulation.
- General all-catalogue practice retains 100 questions/60 minutes; future university/session packs must store the exact primary-source rules for their paper.

## ADR-014 — Stage RU Unit A research separately before importing
Status: accepted, 2026-10-29; scope clarified 2026-10-29.

RU research is now Unit A only and lives at `/home/kali/gpt-workspace/bd-admission-app-data/ru/`, outside the app bundle. The folder contains a year coverage ledger, source register, answer audit and eight review-only sample packs (21 questions). Secondary question-bank pages and restricted Drive links are discovery leads, not proof of an official, complete paper or correct answer key. The 2010-2012 archives need historical A1-A6 mapping. Keep `answerVerificationStatus` separate from paper authenticity and keep unverified/unknown answers out of scored practice. Do not add an `examRule` until the exact session/paper's official pattern is checked. Rationale: avoid false coverage claims or treating third-party material as official content.

## ADR-008 — Keep verified and provisional practice pools separate
Status: accepted (2026-10-29).

The verified pool continues to require verified question content and answer keys. When a selected scope has no verified-eligible questions, the app may offer a visibly labelled provisional pool for structurally safe third-party candidates (single-choice, 2+ options, one source key, no duplicate normalized option text). Provisional feedback is explicitly tied to the unverified source key, candidate metadata remains `unverified`, and no official score or paper-specific rule is invented. This restores question practice while preserving an honest verification boundary; source review is still required before promotion to verified practice.


## ADR-015 — Keep the old RU candidate bank and new verified-source bank separate
Status: accepted, 2026-10-29.

The existing `ru` institution and its 4,009 candidate questions remain intact and visibly begin with `UNVERIFIED —`. The user-supplied verified-source PDF is imported under a distinct institution ID (`ru-verified-bank`, code `RU-V`) with separate pack/paper/question IDs and page provenance. Do not merge or replace old questions because a source PDF overlaps in year; older questions without matching source coverage must be preserved. Per user instruction, the new source question content is marked verified, but source answer markers that are absent or could not be mapped remain `unknown` rather than being invented. Do not infer RU official scoring/time rules from the question bank.


## ADR-016 — Use EAS cloud builds and GitHub Actions CI for Android delivery
Status: accepted, 2026-10-31.

Use Expo Application Services for native Android builds because the current ARM/NetHunter host has a known Hermes bytecode SIGILL during normal export. The preview profile produces an internal-distribution APK for physical-device QA; the production profile produces an AAB for Google Play. Keep the signing keystore in EAS-managed credentials, not in Git. Use GitHub Actions for deterministic repository checks (tests, types, lint, Expo config and no-bytecode bundle export); CI does not need an Expo token and does not perform native builds. Use GitHub Releases for APK/AAB binary downloads, not GitHub Packages. Rationale: separate source verification, native build, physical-device QA and public distribution gates.

## ADR-017 — Preserve Muse per-question states and scope source IDs per import batch
Status: accepted, 2026-11-01.
Import the user-designated Muse AI archive without repeating question-by-question factual verification. Treat `contentVerificationStatus` and `answerVerificationStatus` on each record as authoritative; a batch-level `verified` label does not promote an individual `unverified` or `unknown` answer. Source-document IDs must be globally unique for the SQLite importer: when a source ID is reused by independent packs, namespace the affected IDs by stable batch ID and update every reference, leaving question text, options, keys, hashes and source metadata unchanged. Exam rules stay `unconfigured` until the exact paper/session pattern is approved; descriptive source notes alone do not activate a rule.

## ADR-018 — Keep JU/HSTU unverified candidate banks separate from verified banks
Status: accepted, 2026-11-01.
The supplied JU/HSTU unverified archive is stored under separate institution IDs (`ju-unverified-bank` / `JU-U`, `hstu-unverified-bank` / `HSTU-U`) and dedicated batch, paper, question and rule IDs. The existing `ju` / `JU` and `hstu` / `HSTU` verified-source entries must remain untouched. Per-question content/answer states are preserved; unknown keys are never guessed; only the existing structural provisional filter may admit safe candidates, and those sessions/results remain explicitly provisional. All incoming rules stay unconfigured. Similar-looking or even exact text/option overlaps are retained as separate source appearances, not auto-merged. The distinct GST_CLUSTER dataset is out of scope for this batch and will be imported separately.

## ADR-019 — Show startup progress before evaluating the bundled question library
Status: accepted, 2026-11-01.
Render a branded Bangla/English setup screen while SQLite initialization and the existing sequential content-sync lifecycle run. Wait until that screen has completed its first layout before dynamically loading/evaluating the generated bundled-pack module. Report real pack/question processing progress, stage-level indicators for work without measured subtasks, a retry state for first-run total failure, and a warning/usable-existing-content path for returning sync failures. Keep database schema, question-pack contract, transactional importer and user-owned data unchanged. The screen may also describe returning-launch synchronization; it is not restricted to a cold install. This decision improves feedback and defers large module evaluation until UI is visible; it does not implement background sync, eliminate the import work, or claim that Android produces separately split JS chunks. Physical-device first-install and upgrade QA is required before release.


## ADR-020 — Increment Android build identity without changing app identity
Status: accepted, 2026-11-01.

For the next internal preview, bump the user-facing app version from `0.1.0` to `0.1.1` and Android `versionCode` from `1` to `2`, while retaining package ID `com.admissionbd.app`, the linked EAS project and the existing EAS-managed signing keystore. The Android version code must increase for an upgrade install; the package/signing identity must remain stable so an existing install can be updated without uninstalling and deleting local app data. Preview delivery remains internal through the EAS build page; do not publish a GitHub or Play Store release implicitly.
