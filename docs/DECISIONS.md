## ADR-021 — Partial official facts do not imply complete scoring or an exact paper
Status: accepted, 2026-11-05.

Store only what a cited official source establishes. `totalMarks` represents a known exam component total, not per-question positive marks or unanswered marks. Numeric scoring is enabled only when all three scoring components are present. A paper-specific timed session requires that paper's own question count and duration; missing values are not borrowed from another unit/session and are not replaced with the generic 100/60 practice defaults. Where the pattern is unavailable, only an explicitly chosen and unscored Custom Practice mode may be offered. Preserve exact paper provenance; never sample an aggregate third-party bank and label it as a complete official paper.

## ADR-022 — Build bundled question content as a SQLite seed
Status: accepted, 2026-11-05.

Keep data/question-packs/*.json as the canonical, reviewable source. Generate a compact manifest and a SQLite seed using the app's current migrations/importer during local, CI and EAS builds. At runtime, lazily attach the seed only when batch signatures are pending and copy content rows using set-based SQL. Commit batch data and signature checkpoints atomically in bounded groups (maximum 1,500 questions), falling back to one-pack transactions after a group failure. Never replace the user's primary SQLite file or write seed content into profile/bookmark/session tables. Validate the seed database, metadata and row counts before accepting it. The generated .db remains ignored by Git and must be recreated by supported build hooks.

## ADR-023 — Prefer restart-safe foreground sync over background service for initial content import
Status: accepted provisionally, 2026-11-05; reassess after Android device measurements.

The import is a local bundled SQLite copy, optimized and benchmarked on the Node host but not yet measured on a release APK. Use bounded transactions, AppState-aware single-flight retry and next-launch recovery. Do not add WorkManager simply to keep a JavaScript Promise alive: a native worker would be required and scheduling may be deferred. Do not add a foreground service without a user-visible requirement; it requires an ongoing notification and brings Android-version-specific restrictions. Reconsider a native worker/service only if physical-device timings or explicit product requirements justify its added native database/lifecycle complexity. The current implementation does not guarantee that sync continues while Android backgrounds or kills the app.

## ADR-024 — Use core Animated native driver for the startup progress fill
Status: accepted, 2026-11-05.

Animate a transform (translateX) rather than layout width, using React Native Animated with the native driver. This is sufficient for the startup progress fill and avoids introducing Reanimated worklets/plugin wiring solely for one transform. Preserve Reduce Motion and accessibility semantics. Adopt Reanimated only when a broader UI requirement justifies shared values/worklets and after Expo SDK / New Architecture compatibility is rechecked.


## ADR-025 — Reserve branded startup UI for first-run and synchronize Home handoff
Status: accepted, 2026-11-11.

Show the existing branded five-stage setup UI for a first-run library setup and for actionable startup failures/retries. On returning cold launches, keep the native splash visible while SQLite migration and content reconciliation run, release the setup-screen sync gate once returning mode is known, and hide the native splash only after Home's first data-backed or actionable error view has laid out. On first-run, keep the branded overlay until startup and Home are both ready before fading out. Completed stage ticks receive a short staggered native-driver opacity/scale transition; respect Reduce Motion. Use the existing React Native Animated API, keep the current visual design/progress calculation, and add no dependency, artificial work delay, schema change or content change.

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

## ADR-023 — Promote accepted HSTU verification-ledger IDs into the normal HSTU catalogue
Status: accepted, 2026-11-12.

The initial JU/HSTU candidate-bank separation recorded in ADR-018 described the original import checkpoint, not an immutable prohibition on future promotion. After explicit user authorization, Claude's accepted HSTU verification ledger is the source of truth for 664 unique question IDs. Promote all 664 into the existing HSTU catalogue and set the existing answer/content status fields to verified; move 657 HSTU-U appearances to 15 HSTU papers and update the 7 IDs already attached to HSTU. Preserve stable batch/question IDs, question text, option text/order and source provenance. Leave the 116 baseline pending questions untouched. Do not change JU/RU/DU data, exam rules or runtime logic as part of this data-only import.

## ADR-024 — Startup UI thresholds live in a pure policy module; escalate instead of adding screens
Status: accepted, 2026-11-13.

Returning startups stay behind the native splash but escalate to the existing SetupScreen after `RETURNING_ESCALATION_MS` (1500 ms) when still syncing, because Android's splash cannot fade (`setOptions({fade})` is iOS-only) and a long silent splash looks frozen. The Home-ready gate has a `HOME_READY_TIMEOUT_MS` (4000 ms) fallback because Home is not guaranteed to be the first route. SetupScreen's first frame matches the flat splash colour with the brand mark visible, and the gradient/card fade in over it. Spinners are delayed by `LOADING_INDICATOR_DELAY_MS` (150 ms). Rejected: Reanimated animated splash, in-Home skeleton progress (revisit in Phase 9), splash asset changes (Phase 6, requires native rebuild).

## ADR-026 — Parent-university identity is derived, not stored; institutionIds scope
Status: accepted, 2026-11-13.

Parent universities are derived from institution codes at read time (`-U`/`-V` suffix stripped) rather than added to the schema, because content tables are importer/seed-owned. Practice scopes carry `PoolFilter.institutionIds` (optional, backward compatible with persisted session filters; validated when parsed from routes). Logos are raster-first via a static registry with a monogram fallback; the registry is empty until licensed artwork is supplied. Rejected: parent_code column, react-native-svg (native dep + rebuild) for logos.

## ADR-027 — Subject selection stored on existing PoolFilter fields
Status: accepted, 2026-11-13.

Decision: a single subject keeps using `PoolFilter.subject`; two or more use `PoolFilter.subjects`; the selection module never sets both. Reason: session filters are persisted as JSON and the SQL layer already honours both fields, so existing stored sessions, routes and history keep working with no migration. Rejected: always using `subjects` (changes stored shape). Combined counts are the sum of per-subject counts because each question has exactly one subject.

## ADR-028 — Marking profiles carry per-value provenance and never auto-score unscored practice
Status: accepted, 2026-11-13.

Context: scoring values come from sources of different strength, and AGENTS.md forbids presenting inferred marking as official and requires Custom Practice to be unscored.

Decision: every profile value has its own provenance; a profile's status is the weakest link (verified only if correct, wrong and unanswered values are all official). Sessions store an immutable snapshot. An automatic default fills gaps only: it never overrides a complete stored rule, never scores Custom Practice, and the generic fallback never scores a paper whose official rule is only partly known. Explicit choices and saved preferences are the user's decision and always apply.

Consequences: universities without a researched profile are unscored by default (as before Phase 4) unless the user selects a profile or sets a global default. Upgrading any provenance requires a documented official source.

## ADR-029 — Mark-for-review is persisted separately from answers; retry uses a session-scoped pool filter
Status: accepted, 2026-11-13.

Context: flags must survive crash recovery without risking the serialized selection writes or finalized results.

Decision: store `flagged` on `session_answers` and write it with its own guarded statement (active session, before deadline). Practice-from-missed is a PoolFilter field resolved by a subquery, so it reuses Flash setup/play and needs no copied question lists.

Consequences: flags never affect scoring; retry pools only contain currently eligible catalogue questions.


## ADR-024 — Theme via CSS-variable tokens and a single provider (Phase 6)
Status: accepted, 2026-11-13.

Tailwind colours resolve from `--c-*` variables set once on the root view by `AppearanceProvider`; style-prop colours come from `useTheme()`. Preferences (theme, motion, haptics, text size) live in AsyncStorage JSON because they are needed before SQLite is ready. Rejected: `dark:` variants everywhere (scattered conditionals) and per-row theme subscriptions in large lists.

## ADR-030 — Shared SVG logo pipeline and authentic brand assets (Phase 8)

Owner explicitly authorised authentic university/publisher logos. Decision: react-native-svg (SDK-pinned 15.15.4) + react-native-svg-transformer; one BrandLogo renderer; original files unmodified with source records; raster allowed only when no official vector exists (HSTU); missing assets show a monogram and are never redrawn.

## ADR-031 — Optional content management is injected and additive (Phase 9)

Network access, hashing and sources are injected interfaces; no catalogue endpoint, cloud DB or account is required, and none is faked. Removal is soft. Manifest signatures are reserved, not verified.


## ADR-032 — Publish only the 17 RU-V sets under ASPECT; archive RU Lokkho
Status: accepted, 2026-11-17.

After the full source audit, publish only the 17 distinct source sets from the RU-V verified-source bank as one book under Publications & Books → ASPECT. The current input is 15 JSON batches / 1,828 questions; two batches each combine two printed sets. Preserve the original Unit A labels on 2024–25 মহানন্দা and পদ্মা.

The separate RU Lokkho bank (44 packs / 4,009 unverified candidate questions and its 45 unique referenced assets) must remain in an external archive outside the ASPECT Library. Audit it only to determine whether selected records might be reused later; it may remain unused. The owner has separately tasked Muse with preparing a new pack; compare that output with the archived Lokkho material only when it is available. Do not create a second ASPECT book for Lokkho, merge Lokkho into RU-V, or treat archiving/auditing as verification. Preserve source provenance and the archive.

The current app bundle still contains the Lokkho candidate packs at this decision checkpoint; moving them into the external archive and retiring their active bundled/SQLite state is a separate future task. Do not delete question history or user data. The ASPECT conversion and cutover scope is RU-V only.

RU-V book-specific requirements are deterministic question-pack → LibraryPack conversion, 17 separate test units, source-page provenance, audited RU-V diagrams/assets, math/matrix corrections where required, and a safe RU-V-only catalogue cutover. Multi-select behavior, scoring/persistence, diagram rendering and offline asset indexing are app-wide platform requirements under ADR-033, not RU-V-only enhancements. Shared capability implementation is approved independently of RU-V content conversion; RU-V-specific transcription, pack conversion and catalogue cutover remain governed by the source audit and their own verification gates.

Detailed plan: docs/audits/RU_ASPECT_LIBRARY_INTEGRATION_PLAN_2026-11-17.md.

## ADR-034 — Scored eligibility is derived from correct-option cardinality
Status: accepted, 2026-11-17.

Context: multi-select is now app-wide (ADR-033). The `no_correct_option` disposition exists only in pack JSON; SQLite stores no disposition column.

Decision: `ELIGIBLE_SQL` admits a verified question only when its stored correct-option count matches its type (exactly 1 for single_choice, at least 2 for multiple_choice). This keeps `no_correct_option` records (0 correct options) out of scored pools and rejects structurally inconsistent rows without a schema change, seed-format change or backfill. Selections are always arrays of option keys in option order; scoring is exact-set unless a source-verified rule says otherwise.

Consequences: no migration risk for existing installs. A future need to display the disposition explicitly can be derived from the same data.

## ADR-035 — Externalize all RU question packs; defer Library import to owner
Status: accepted and implemented, 2026-11-17. This is the current execution decision and supersedes ADR-032's earlier instruction to implement the ASPECT import in the current task.

Context: the app currently bundles 44 RU Lokkho candidate packs (4,009 unverified questions) and 15 RU-V verified packs (1,828 questions representing 17 printed source sets). The owner wants the entire RU question-pack section removed from this app project and active bundle now, while retaining both sources for later owner-controlled Library import/review.

Decision:
- Move all 44 `ru-c-*.json` Lokkho packs and their 45 unique image assets to the existing external Lokkho archive at `/home/kali/gpt-workspace/bd-admission-app-data/ru/lokkho-archive/`; verify hashes before deleting app copies.
- Move all 15 `ru-vq-*.json` verified packs to a separate external archive at `/home/kali/gpt-workspace/bd-admission-app-data/ru/verified-pack-archive/`; create its own README, manifest, file sizes and SHA-256 records. Do not mix the two archives.
- Remove both RU pack families from active app source/catalogue/bundle and implement a safe existing-database retirement migration. Preserve historical question/source records and user-owned bookmarks, answers, active/completed sessions and results. The current seed sync is additive; simply removing JSON from the new seed is insufficient.
- Do not create, install or import any RU LibraryPack now. The owner will handle Library import later. The only future ASPECT content target is the 17 RU-V verified source sets. Lokkho remains unverified and must never be merged into RU-V or ASPECT.
- Do not move JU, HSTU, DU or any other university's packs, whether verified or unverified. Do not remove other universities' content. Retain general RU university branding/code; this decision concerns RU question-pack datasets.
- Preserve the existing external RU source PDF and `ruv-work` extraction/reconciliation material. Archive the pack JSON and its provenance; do not unnecessarily relocate external research workspace files.

Consequences: after this task, no RU question pack is active in Varsity or bundled app content. The two external archives remain separately verifiable and ready for future owner-led import/review. The future RU-V Library structure is one ASPECT RU Question Bank with 17 test units; this later import is explicitly outside the current task.

Evidence and current state: `docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md`.

## ADR-033 — Multi-select and visual-question support are app-wide capabilities
Status: accepted, 2026-11-17.

Context: the question model already represents multiple_choice answers and question-level assets, but shared Flash/Standard Exam interactions still behave as single-select, while the generated Metro asset registry is currently tied to one legacy asset directory. Treating these gaps as RU-only work would leave other universities, existing question packs and future Library books with inconsistent capabilities.

Decision: implement multi-select interaction, answer persistence/resume, scoring/review and visual-content rendering/indexing as shared app capabilities. They must work for every supported content origin: existing university/paper packs, all active bundled question packs, Publications & Books LibraryPacks, and future imported content. Question type drives radio vs checkbox semantics. Multi-select must support multiple toggles, explicit submission where needed (especially Flash), array-based persistence/resume, and correct answer comparison; exact-set scoring is the safe default unless a source-backed marking profile explicitly defines another rule. Diagram/image references must resolve through one validated offline-capable asset pipeline and render consistently in question stems, options and explanations wherever the content model places them. Preserve existing single-choice behavior.

Consequences: RU-V can be used as one acceptance-test dataset, but it does not own or delimit this feature. Tests must cover multiple content sources and existing single-choice regression paths. No pack may be enabled for multi-select scoring or depend on an image until its content and referenced assets validate. Content-specific diagrams are audited per source, but renderer and asset infrastructure are shared.

## ADR-036 — Structured math is a pure parser + View renderer; circuits/graphs stay source bitmaps
Status: accepted, 2026-11-17.

Context: surveying all 13,609 questions showed LaTeX markup almost only in RU Lokkho (being retired), while surviving packs contain linearised matrices/determinants, roots and powers; the 20 RU-V circuit/graph/vector questions exist only as PDF vector drawings.

Decision: (1) `mathLayout.ts` parses stored text into a tree and never rewrites it; `MathBlock` renders it with Views/Text (no WebView, bundled font or network). (2) Linearised matrices are detected conservatively (`;` rows, `,` cells, equal counts, >=2 columns, no labelled cells). (3) No bespoke circuit/graph DSL: source figures are cropped from the original PDF and carried as bitmaps through the shared asset pipeline, because redrawing would reinterpret verified questions. (4) RU-V figures live as an overlay in the external archive; archived pack JSON stays byte-identical.

Consequences: no new dependency; matrix layout is not yet device-verified; a figure missed by the stem-keyword scan would not be in the inventory.



## ADR-037 — Retire RU content with paper/batch tombstones, preserve historical records
Status: accepted and implemented, 2026-11-17.

Context: bundled content sync is additive. Removing RU JSON from a new seed cannot remove previously installed records, while deleting questions/appearances would break bookmarks, attempts, result review and source provenance.

Decision: schema v11 adds nullable retired_at columns to exam_papers and question_batches, and stamps only RU (ru) / RU-V (ru-verified-bank) paper identities and ru-c-* / ru-vq-* batches. Active catalogue and practice queries explicitly require non-retired paper/batch records. History-oriented question/source/by-ID queries remain able to resolve retained rows. Seed-sync writes do not modify retired_at; repeated sync or a re-delivered source row therefore does not clear retirement. The new bundled seed contains no RU packs.

Consequences: fresh installs contain only active non-RU content; v10 upgrades keep RU source/history rows but exclude them from new catalogue and practice flows. Validation covers v10 migration, bookmarks, active and completed sessions, multi-select saved answers, result/rule snapshots, history resolution, repeated/re-delivered seed sync, database reopen and fresh install. No destructive question/history cascade is used. Device visual QA remains a separate owner verification step.

Evidence: tests/ru-retirement-migration.test.ts, docs/QA_CHECKLIST.md, and docs/audits/RU_PACK_EXTERNAL_ARCHIVE_AND_APP_REMOVAL_HANDOFF_2026-11-17.md.
