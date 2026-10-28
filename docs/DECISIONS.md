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

## 2026-10-28 application-pass decisions
- **Exactly-once exam finalization** is enforced twice: a ref guard in the screen and a conditional `UPDATE ... WHERE status='active'` inside a transaction in `finalizeExamSession`. Selections are refused in SQL once the deadline has passed, so late taps can never change a result.
- **Deadlines are absolute wall-clock times** (stored in SQLite for exams); `useNow` re-reads the clock on foreground, so backgrounding cannot extend time. Flash restarts a question's timer after the feedback screen so reading feedback is not charged.
- **No score without a rule**: with an unconfigured rule results show counts and accuracy only. Illustrative rules are labelled "not official" everywhere.
- **Practice pools exclude questions without a verified answer** instead of showing them unscored; the UI explains why.
- **Flash finishing**: the unresolved on-screen question is not counted; leaving the screen by any route closes the session (idempotent).
- **State for controllers**: the Flash controller is held in React state (mutated only in event handlers, with a revision counter) to satisfy the React compiler lint rules.
- **Android export**: hermesc crashes with SIGILL on this host, so `expo export --no-bytecode` is used as the bundle validation here; release bytecode export must be built elsewhere.
