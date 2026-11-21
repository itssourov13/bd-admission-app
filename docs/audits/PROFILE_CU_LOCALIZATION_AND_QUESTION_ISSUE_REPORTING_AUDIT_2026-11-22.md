# Profile actions, CU localization & question issue reporting — audit

**Date:** 2026-11-22
**Repository:** `/home/kali/gpt-workspace/bd-admission-app`
**Branch / audited HEAD:** `feat/import-hstu-verified-answers-2026-11-12` / `a636fb8`
**App:** `0.1.11` · Android `versionCode 11` · Expo SDK 57 · SQLite schema v12
**Status:** Read-only audit and design recommendation. No app source, question data, assets, schema, dependency, release metadata, or runtime behavior changed.

## Executive summary

All three requests are feasible and fit the existing app architecture. The first two are tiny presentation-only changes. The third is a worthwhile offline-first feature, but the app already has an important Standard Exam **Flag for review** control. That existing control must remain unchanged and must not be repurposed for content-issue reporting. A new report feature needs its own wording, icon, UI placement, storage and lifecycle.

**Recommended order:** implement CU's Bengali display mapping and reorder the Profile actions first; then implement a distinct question-issue report flow; finally add JSON export and Android share-sheet delivery. Keep issue reports separate from bookmarks and exam-session flags; do not add a server/account requirement.

## 1. Chattogram University Bengali name is missing

### Confirmed cause

- CU's institution code is already normalized correctly: `universityKeyOf("CU")` returns `cu`.
- `src/features/catalog/universities.ts` has explicit bilingual metadata for DU, RU, JU and HSTU, but has no `cu` entry in `KNOWN_UNIVERSITIES`.
- `universityDisplayName()` returns the stored/cleaned institution name when the key is not in that list. CU's stored name is `University of Chittagong`, so the English text is displayed even when `lang === "bn"`.
- I reproduced this with the current source: `{ key: "cu", bn: "University of Chittagong", en: "University of Chittagong" }`.
- CU's original PNG logo is already registered at `src/features/catalog/universityLogos.ts`; the logo is not the cause.

### Minimal fix recommendation

Add CU to the same bilingual university metadata map, for example:

```ts
{
  key: "cu",
  shortName: "CU",
  name: {
    en: "University of Chittagong",
    bn: "চট্টগ্রাম বিশ্ববিদ্যালয়"
  }
}
```

This uses the existing language-aware display path. It should translate the university's main catalogue card/title only; do not rewrite question-pack institution metadata, paper titles, source names, question text, or other CU content. Keep the English label unchanged in English mode.

**Regression checks:** Bengali mode shows `চট্টগ্রাম বিশ্ববিদ্যালয়`; English mode shows `University of Chittagong`; CU remains one parent group with short code `CU`; the existing logo and question/paper IDs remain unchanged.

## 2. Profile action order

### Current order confirmed in `app/(tabs)/profile.tsx`

1. View bookmarks
2. Practice history
3. Settings
4. Marking rules

### Requested order

1. View bookmarks
2. Practice history
3. Marking rules
4. Settings

### Recommendation

Swap only the two existing JSX button blocks. Keep their labels, icons, destinations and styling unchanged. No database, navigation, translation or preference behavior needs to change.

## 3. Existing Standard Exam review flag — confirmed separation requirement

The app already implements a complete exam-specific **Flag for review** feature. This is not a content defect report.

### Confirmed behavior and data path

- The feature was introduced by SQLite migration **v7** (`exam_answer_review_flag`), which adds `flagged INTEGER NOT NULL DEFAULT 0` to `session_answers`.
- Its storage is **per exam attempt and question**: `session_answers(session_id, question_id, flagged)`. It is not a global question-level flag.
- During an active, unexpired Standard Exam, `persistFlag()` / `setExamFlag()` updates the current session's flag. The write is guarded by the session being active and its deadline not having passed. The flag is independent of saved answer selection and does not change the answer or score.
- The active Exam UI already uses the flag marker `⚑`, the labels “Flag for review” / “Remove flag”, flagged counters in the progress/submission summary, and the question palette state.
- When the exam is completed, the stored flags remain available in Result review: the result screen shows the marker and provides a separate “Flagged” filter. Further flag writes are rejected after completion.
- Existing regression coverage in `tests/exam-review.test.ts` verifies toggle/un-toggle, persistence across reload (crash recovery), answer independence, flags surviving finalization, and post-finalization writes being rejected.

I re-ran this focused suite during the follow-up audit: **7/7 passed** under Node 22.23.1.

### Conflict assessment

There is **no underlying database or state conflict** when content reports use their own global table and repository. There **is a real UX collision risk** if the new report action also uses a flag icon, “Flag” wording, the same gold marker, or is placed beside the existing Exam “Flag for review” button. Reusing `session_answers.flagged` would be semantically wrong: it is scoped to one exam attempt, is designed for personal revision, and is already consumed by exam progress and Result filters.

### Required separation

- Preserve the existing exam flag behavior, label, gold `⚑` marker, palette, progress counts, submission warning and Result filter exactly as they are.
- Never write content reports into `session_answers.flagged`, and never let a report action toggle/clear an Exam review flag.
- Name the new action **“Report question issue” / “প্রশ্নে সমস্যা জানান”**. Use a distinct `alert-circle-outline` or `bug-outline` style icon; do not use a flag glyph or the same gold flagged treatment.
- Place the report action in a distinct section at the bottom of the question card, visually separate from the Exam action row that contains “Flag for review” and “Clear”. Do not place the content-report action in the same action row as exam review controls.
- If the report composer is opened during an active exam, clearly state that the exam timer continues. Saving a report must not pause, extend, finalize or otherwise mutate the active exam.

## 4. Question issue reporting — product and technical audit

### Current architecture

- The app is local-first: Profile copy says user information stays on the device and no account or internet is required.
- Bookmarks are stored in the local SQLite `bookmarks` table; the current row contains the question ID and creation timestamp.
- `QuestionCard` is the shared renderer and currently exposes a bookmark action through `onToggleBookmark`; it has no report/flag callback or issue composer.
- The shared question card is used in Browse, Bookmarks, Flash, active Exam and Result review. This gives a natural place for one consistent issue affordance, but it must be rendered in a separate content-report section and must not merge with the Exam-specific flag row.
- The latest database migration is v12. There is no issue-report table, repository, screen, export or feedback endpoint in the inspected app source.
- `expo-file-system` is already installed at the SDK 57-compatible version. `expo-sharing` is not currently in `package.json`.

### Recommended user experience

**A. Report from a question.** Add a clearly labelled **Report question issue / প্রশ্নে সমস্যা জানান** action in its own bottom section of the reusable question card. Do not use a flag icon or place it beside the bookmark icon or the Exam's “Flag for review” control. Use a distinct issue/bug icon (for example `alert-circle-outline`) and a neutral secondary treatment. Tapping it opens a compact Bangla/English form; question ID and source context are captured automatically. During an active exam, state clearly that the timer continues.

Suggested multi-select issue categories:

- Question text / spelling / formatting
- Missing or incorrect option
- Correct answer / answer key seems wrong
- Explanation is incorrect or unclear
- Figure / image / diagram problem
- Duplicate question
- Other

Add one optional note field for context such as the expected answer or what appears wrong. Make the note optional and impose a sensible length limit. Do not ask for the learner's name, phone number, or account.

**B. Keep reports separate from bookmarks.** Add a Profile action such as **Reported questions (N)**. Its list should show the question snippet, source/session context, selected issue tags and the learner's note. Let the learner open/edit a report and remove it. The count should be based on saved local reports, not exported reports.

**C. Prevent accidental duplicates.** Recommended v1 rule: one active issue report per canonical question ID. A later report for the same question opens the existing report for editing/adding issue tags rather than creating repeated rows. The snapshot should include all known appearances so one canonical question can still be traced to its source paper(s).

**D. Work offline.** Save immediately to SQLite and make the Profile list usable without connectivity. Do not add a backend, sign-in, analytics event, or network upload for this feature.

### Suggested data model

Add an **append-only migration v13**; do not edit the shipped v1–v12 migrations.

Suggested table: `question_issue_reports`

| Field | Purpose |
|---|---|
| `id` | Stable report UUID |
| `question_id` | FK to the app's canonical question row; unique for v1 deduplication |
| `issue_types_json` | JSON array of selected issue categories |
| `details` | Optional learner note |
| `question_snapshot_json` | Question text, option keys/text, current answer/content verification states, explanation and available source/appearance metadata captured when reported |
| `created_at`, `updated_at` | Local timestamps |

The snapshot is important: if a later app update corrects or changes the source question, the exported report must still show what the learner originally saw. Include asset/figure reference paths when available so the maintainer can identify a diagram issue; an attached screenshot can be a later enhancement rather than a permission-heavy v1 requirement.

### Suggested JSON export contract

Use a versioned envelope so a later report importer or desktop triage script can parse old exports:

```json
{
  "format": "bd-admission-question-issues",
  "schemaVersion": 1,
  "exportedAt": "ISO-8601 timestamp",
  "app": {
    "version": "0.1.11",
    "platform": "android",
    "language": "bn"
  },
  "reports": [
    {
      "reportId": "stable-id",
      "questionId": "question-id",
      "createdAt": "ISO-8601 timestamp",
      "issueTypes": ["answer_key", "question_text"],
      "details": "Optional note",
      "questionSnapshot": {
        "text": "Question as displayed",
        "options": [{"key": "A", "text": "Option text"}],
        "answerStatus": "verified",
        "contentStatus": "verified",
        "sources": []
      }
    }
  ]
}
```

The example is illustrative, not an existing app schema. The actual export should use the app's real `QuestionView`/repository fields and correct timestamp representation.

**Privacy boundary:** include only data needed to diagnose the content defect. Do not export the Profile display name, selected exam answers, attempt history, contacts, phone number, device ID, or unrelated bookmarks. The learner's free-text note is user-generated and should be visibly included in the export preview/confirmation.

### Export and send options

Recommended v1 actions:

1. **Share JSON report** — serialize all saved issue reports, write a UTF-8 `.json` file into the app cache, then open the operating system share sheet. The learner can choose WhatsApp, Telegram, email, Files/Drive or another compatible target and then choose the recipient and press Send.
2. **Save JSON** — optionally expose a separate system folder/document picker so the learner can save a copy outside the app.

The app should never silently send a report or assume a particular contact. A generic Android Sharesheet is preferable to building and maintaining a custom list of WhatsApp/Telegram targets. Not every installed app necessarily accepts every file MIME type, so test common targets on a real Android device.

For the current Expo SDK 57 app, the documented route is `expo-file-system/legacy` to write the temporary file and SDK-57-compatible `expo-sharing` `shareAsync(localFileUri, options)` to share it. Add `expo-sharing` through `pnpm expo install expo-sharing` so Expo selects the compatible package version; this native dependency requires a new development/preview build for device QA. React Native's built-in `Share.share()` is a suitable fallback for sharing a short text summary, but its documented content contract is text/URL rather than a file attachment.

**Important delivery behavior:** keep all local reports after the share dialog closes. A share-sheet handoff is not proof that the recipient received or read the file. Do not auto-delete reports or automatically mark them as successfully delivered.

### Implementation phases

**Phase 1 — tiny presentation fixes**
- Add CU bilingual display metadata and a regression test.
- Reorder Profile buttons without changing behavior.
- Verify Bangla/English labels and Profile navigation.

**Phase 2 — local issue capture**
- Add migration v13 and an issue-report repository.
- Add the reusable QuestionCard issue-report action (never a flag action) and compact bilingual form. Keep the existing Standard Exam review-flag action and its session state untouched.
- Add Profile count/list/detail/edit/delete UI.
- Preserve reports across app restarts and content re-imports.
- Verify upgrade from schema v12 without losing bookmarks, attempts, sessions, results or profile data.

**Phase 3 — export and share**
- Add SDK 57-compatible `expo-sharing`.
- Generate and validate the versioned JSON export.
- Add share-sheet and, if requested, Save-to-folder behavior.
- Test cancellation, missing share targets, multiple reports and large exports on a physical Android device.
- Build a new preview APK; the already-installed v0.1.11 APK cannot contain these future changes.

## Acceptance / regression checklist

- [ ] CU name is Bengali only when app language is Bangla; English label is unchanged.
- [ ] CU remains grouped as `CU`; logo, question data, sources and exam rules are untouched.
- [ ] Profile order is Bookmarks → Practice history → Marking rules → Settings.
- [ ] A report can be created offline from each intended question surface and survives app restart.
- [ ] Re-reporting the same canonical question edits/updates its existing report rather than duplicating it.
- [ ] Exam “Flag for review” remains session-scoped and unchanged; reporting an issue neither sets nor clears the exam flag, and the exam palette/progress/result filter remain driven only by `session_answers.flagged`.
- [ ] The report action has distinct “Report question issue / প্রশ্নে সমস্যা জানান” wording and a non-flag icon; it is not adjacent to the exam review-flag control. The active exam timer continues while its composer is open.
- [ ] Report list supports view, edit and delete; empty state and count are correct in both languages.
- [ ] v12→v13 migration preserves existing profile, bookmarks and practice history.
- [ ] Export is valid UTF-8 JSON, versioned, includes the original question snapshot and source references, and excludes personal/attempt data.
- [ ] Cancelling the share sheet leaves reports intact; sharing does not claim recipient delivery.
- [ ] Android device testing verifies Files, WhatsApp and Telegram where installed; verify file name, MIME type, readable JSON and recipient-side attachment.

## Verification performed for this audit

- Original localization/Profile audit source baseline: branch `feat/import-hstu-verified-answers-2026-11-12`, source HEAD `a636fb8`; prior docs-only audit commit `3451639`. Follow-up exam-flag review inspected the same unchanged app source.
- Inspected Profile, university display/grouping, university logo registry, language provider/translations, QuestionCard call sites, bookmark repository/schema, migration list, Expo dependencies, Standard Exam flag state, Result review and exam-flag regression tests.
- Reproduced the CU Bangla fallback defect using the current source function.
- Localization/Profile + repository focused suites under Node 22.23.1: `tests/universities.test.ts` + `tests/repositories.test.ts` — **27/27 passed**.
- Follow-up exam-review suite: `tests/exam-review.test.ts` — **7/7 passed**, including flag toggle/un-toggle, persistence after reload, independence from answer selection, preservation after finalization and rejection of post-finalization writes.
- No app source changes, full suite, typecheck, lint, APK build or physical-device visual test was performed for either audit. The owner-reported v0.1.11 device check from 2026-11-19 remains the latest recorded device smoke test.

## References

- [Expo SDK 57 — Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/) — compatible package line and `Sharing.shareAsync(localFileUri, options)`.
- [Expo SDK 57 — FileSystem (legacy)](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem-legacy/) — app cache/document directories and `writeAsStringAsync`.
- [Android Developers — Send data to other apps](https://developer.android.com/develop/ui/compose/sharing/send) — Android Sharesheet, text/file intents and compatible targets.
- [React Native — Share API](https://reactnative.dev/docs/share) — built-in text/URL sharing API.
