# Implementation Order — Google Play Launch

**Pitch (TEI):** April 29, 2026 ✅ Delivered  
**Public Web Launch:** May 6, 2026 ✅ Shipped  
**Pre-Google Play (code complete):** May 26, 2026 ✅ Done  
**Google Play Launch:** Target — TEA program (Technical Entrepreneurship Accelerator). Start date TBD.  
**Current date:** May 26, 2026

---

## Remaining Before TEA

### Deep Links — Release Loose Ends

- [ ] **⚠️ Add release fingerprint to `web/public/.well-known/assetlinks.json`** before Play Store release. Two options — pick one:
  - **Option A — Play App Signing (recommended):** Enroll in Google Play Console → Setup → App Integrity → Play App Signing. Google manages the release key. Copy the SHA-256 fingerprint shown there and add it as a second entry in the `sha256_cert_fingerprints` array alongside the debug fingerprint.
  - **Option B — Self-managed keystore:** Generate a release keystore (`keytool -genkey ...`), run `keytool -list -v -keystore release.keystore` to get the SHA-256, and add it to the array. Store the keystore file securely outside the repo.
- [ ] Test deep links on Android emulator via `adb shell am start` (see PR #deep-links description for commands)
- [ ] Test OG preview by pasting a share URL into Slack

### Android Release Build & Signing

- [ ] Generate a production release keystore and store it securely (not in repo)
- [ ] Configure `signingConfigs` in `build.gradle.kts` for release
- [ ] Build a signed AAB (`./gradlew bundleRelease`)
- [ ] Verify `minSdk`, `targetSdk`, and `versionCode`/`versionName` are set correctly
- [ ] Test the release build on a physical device before upload

### Google Play Store Listing

- [ ] Create Google Play Developer account (one-time $25 fee)
- [ ] App title, short description (80 chars), full description
- [ ] Feature graphic (1024×500 px) — use brand assets
- [ ] At least 2 phone screenshots per required screen size
- [ ] Content rating questionnaire (IARC)
- [ ] Privacy policy URL live and linked in the listing
- [ ] Target audience and content settings
- [ ] Release track: Internal Testing → Closed Testing → Production

---

*Last updated: May 26, 2026 — All pre-TEA code work complete. Remaining items are Play Store ops.*
