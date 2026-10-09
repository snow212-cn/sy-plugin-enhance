# Automated release workflow

This fork does not contain the full upstream source tree. Releases are produced by applying a narrow patch to the upstream prebuilt `package.zip`.

## Automation

- Checks the latest stable release of `Wetoria/sy-plugin-enhance` every six hours.
- Downloads and verifies `package.zip`; the manifest version must match the upstream tag.
- Applies a narrowly matched patch. It changes only the shared free/paid gate state and the result of the level comparison inside the existing `computedLevel` closure.
- Preserves the original `isPro`, `isVip`, and `isPermanent` state, plus the original `computedLevel` function and its side effects.
- Checks JavaScript syntax and ZIP integrity before publishing.
- Uses the upstream tag verbatim. Release titles use the format `叶归 v1.12.6（免费版）`.
- Existing releases are skipped when their notes contain the current patch marker. If a release lacks that marker, its asset and title are repaired in place.

## Runtime caution

A syntax check does not prove that the plugin behaves correctly in SiYuan. CPU usage and feature behavior must be tested after installation. The earlier broad patch that forced all Pro/VIP/Permanent flags to true was withdrawn because it altered more runtime state than necessary.

The patcher deliberately fails when the expected minified expressions do not match exactly once. If the upstream bundle changes, review the new package and update the patch logic rather than publishing an unverified build.
