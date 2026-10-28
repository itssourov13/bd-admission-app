# QA checklist

## Foundation checks already provided
- [ ] Dependency install under Node 22.23.1.
- [ ] Expo config/doctor.
- [ ] TypeScript check.
- [ ] ESLint.
- [x] Question-pack validator unit tests added; run in the foundation verification.
- [ ] Android JavaScript export.

## Question data integrity
- [ ] Re-importing the identical pack does not duplicate records.
- [ ] Broken source/paper/option IDs block import.
- [ ] A failed import rolls back all writes.
- [ ] Correct-option IDs always refer to existing options.
- [ ] Original option order and Bengali Unicode survive database insert/read.
- [ ] Multiple paper appearances remain intact.
- [ ] Unknown answers remain unknown.
- [ ] Existing attempts/bookmarks survive question-pack updates.

## Offline behavior
- [ ] Launch and navigate after initialization in airplane mode.
- [ ] Browse local institution/paper metadata and questions.
- [ ] Search/filter does not require a network.
- [ ] Flash and Standard modes persist local state.
- [ ] App background/resume does not reset timer deadlines.
- [ ] Results/profile/bookmarks load after force-close and relaunch.
- [ ] Missing database and migration failure display recoverable states.

## Exam correctness
- [ ] Standard Exam starts only with 100 eligible questions.
- [ ] Timer defaults to 30 seconds per Flash question and 60 minutes for Standard.
- [ ] Flash cycle avoids repeats before pool exhaustion.
- [ ] Skip, timeout and answered states are distinct.
- [ ] Auto-submit and manual submission cannot finalize twice.
- [ ] Scoring reads applicable rules and deducts configured penalties correctly.
- [ ] Illustrative/unconfigured rules are not labelled official.
- [ ] Empty-answer accuracy avoids divide-by-zero.

## UI/device checks
- [ ] Long Bangla question text and formulas fit.
- [ ] Small-screen answer options and buttons remain usable.
- [ ] Tab labels/icons/safe area display correctly.
- [ ] Light/dark status/navigation bar does not hide content.
- [ ] Question lists render without loading the entire bank into memory.
- [ ] Real-device check after build; not completed by the initial workspace preparation.
