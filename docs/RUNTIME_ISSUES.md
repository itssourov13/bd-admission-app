# Runtime Issues and Performance Observations

This is the canonical log for owner-observed runtime behavior that needs follow-up. Distinguish a reproducible defect from a perceived delay; do not change app code based on an unisolated observation alone.

## Open items

### RUNTIME-001 — Delay while WhatsApp prepares a shared question-report export

- **First reported:** 2026-11-22, during owner testing of Android preview v0.1.12 / versionCode 12.
- **Area:** Profile → Reported questions → JSON share → Android Sharesheet → WhatsApp.
- **Owner observation:** sharing works, but after selecting WhatsApp it appears to take a little time for WhatsApp to become ready / prepare the share. The owner described a short wait before the share is prepared. No exact elapsed time was measured.
- **Status:** Open — performance observation only; not yet a confirmed app defect.
- **Priority:** Low / investigate when practical. The report feature otherwise passed the owner's device check.
- **Evidence limits:** handset model, Android version, report count, JSON byte size, network state, exact tap sequence and duration were not recorded. No profiler trace or timestamp breakdown exists. There is no evidence yet identifying which component accounts for the delay.

**Do not assume the slow stage.** Possible stages include JSON serialization, writing the UTF-8 cache file, Android Sharesheet/intent hand-off, and WhatsApp's own receiving-activity preparation. A delay after the target opens may be outside this app's control.

**Suggested investigation before any code change:**

1. Reproduce on the same installed v0.1.12 APK and record a few timestamps: user taps Share; serialization begins/ends; cache write begins/completes; `Sharing.shareAsync` is invoked/returns; WhatsApp first appears; WhatsApp becomes ready for recipient selection.
2. Repeat with a small export and a larger report set; record JSON size and count without including report contents or personal data in shared logs.
3. Compare WhatsApp with one other compatible target such as Files/Drive. This helps distinguish app-side export work from target-app initialization.
4. If the pause is before the Sharesheet/WhatsApp launch, profile serialization and cache-file I/O. If it is after WhatsApp opens, check whether WhatsApp itself is still preparing/importing the attachment before changing this app.
5. Only open an implementation task after the slow phase is isolated and a reproducible timing baseline is available. Preserve the versioned JSON contract and privacy exclusions.

**Current decision:** no source, dependency, data, schema or UI change requested or made for this observation. Keep the report flow intact while measuring.

## Resolved / closed

No items have been moved to this section yet.

---

Last updated: 2026-11-22.
