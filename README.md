<div align="center">
  <img src="docs/assets/brand/readme-banner.png" alt="BD Admission — Prepare smarter. Move forward." width="100%" />
  <p><strong>Offline-first admission preparation for Bangladesh.</strong><br />Practice university and medical admission questions in Bangla or English, with or without an internet connection.</p>
  <p><a href="https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c">Android preview APK</a> · <a href="docs/APP_OVERVIEW.md">Product overview</a> · <a href="docs/ANDROID_RELEASE.md">Release details</a></p>
</div>

## App preview

<p align="center">
  <img src="docs/assets/showcase/01-home-screen.jpg" alt="BD Admission home screen and offline question catalogue" width="24%" />
  <img src="docs/assets/showcase/02-varsity-screen.jpg" alt="University question-bank catalogue including Rajshahi University" width="24%" />
  <img src="docs/assets/showcase/03-flash-screen.jpg" alt="Timed Flash Question practice screen" width="24%" />
  <img src="docs/assets/showcase/04-custom-practice-screen.jpg" alt="Scrollable subject-based Custom Practice screen" width="24%" />
</p>

## Highlights

- **Offline-first:** question banks, practice, bookmarks, profile and history are stored locally.
- **University + Medical:** browse institution-based question banks, papers and subjects.
- **Flexible practice:** Flash Questions, paper-specific exam patterns where configured, and Custom Practice for other scopes.
- **Bilingual experience:** Bangla and English interface with support for mathematical notation and question figures.
- **Question issue reporting:** save content corrections locally, review/edit reports in Profile, and share a privacy-bounded JSON export.

## Current Android preview

**v0.1.11** · Android `versionCode 11` · `com.admissionbd.app` · EAS `preview` (internal APK). EAS build `8aa4643c-e312-4a0b-af08-9b3f7779b68c` is complete; the owner installed the APK on Android and reports that the checks performed work normally. [Open the EAS build page / APK](https://expo.dev/accounts/sk_king13/projects/bd-admission-app/builds/8aa4643c-e312-4a0b-af08-9b3f7779b68c). This build includes CU A Unit. The owner did not provide handset/OS details or an exhaustive test log, so this is a successful manual smoke check. Some answer explanations have formatting issues; further examples are being collected for a grouped fix. This is a preview, not a Google Play release. The current local source additionally includes CU Bangla localization, the reordered Profile shortcuts and question issue reporting (SQLite v13); these changes are not in the v0.1.11 APK. A new preview build is required for device QA and distribution.

## License

Original application source code and project-authored materials are licensed under [Apache-2.0](LICENSE). Admission question content, institutional marks and other third-party materials retain their own rights; see [NOTICE](NOTICE) and [licensing notes](docs/LICENSING.md).

## Documentation

- [Product overview and content coverage](docs/APP_OVERVIEW.md)
- [Current implementation state](docs/CURRENT_STATE.md) · [Architecture](docs/ARCHITECTURE.md)
- [Question data schema](docs/QUESTION_DATA_SCHEMA.md) · [Import workflow](docs/QUESTION_IMPORT_WORKFLOW.md)
- [Exam-rule research](docs/EXAM_RULE_RESEARCH.md) · [QA checklist](docs/QA_CHECKLIST.md)
- [Android build and release guide](docs/ANDROID_RELEASE.md) · [Development preview guide](docs/EXPO_LOCAL_PREVIEW.md)

## Development

Use Node.js **22.23.1** and pnpm from the project root:

```sh
nvm use 22.23.1
pnpm install
pnpm start
```

Run the automated checks with `pnpm test`, `pnpm typecheck`, and `pnpm lint`. See the [development and verification notes](docs/APP_OVERVIEW.md) before preparing content or a release.
