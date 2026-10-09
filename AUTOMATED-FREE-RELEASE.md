# Automated free-edition releases

This fork does not contain the full upstream source tree. It modifies the upstream prebuilt `package.zip` instead of compiling the plugin.

## Workflow behavior

- Checks the latest stable release of `Wetoria/sy-plugin-enhance` every six hours, or manually from Actions.
- Downloads the upstream `package.zip` only when a new version is found or an existing release needs a patch revision update.
- Checks that `plugin.json` matches the upstream tag.
- Applies a guarded bundle patch, then checks JavaScript syntax and ZIP integrity.
- Creates a same-version release, or replaces the package asset if the current free release is an older patch revision.

## Free-access patch revision 2

The first experimental patch forced `isPro`, `isVip`, and `isPermanent` all to true and replaced the whole `computedLevel` function. This was too aggressive and could activate tier-specific paths simultaneously.

Revision 2 instead:
- keeps the existing computed-ref/provider registration and side effects;
- sets only the `isFree` / `isNotFree` pair consistently to `false` / `true`;
- changes the central numeric level predicate used by `computedLevel` to allow access;
- leaves the original `isPro`, `isVip`, and `isPermanent` indicators intact.

This is still a package-level patch, not a rebuild from source. It does not prove that every direct tier-specific check is removed; actual SiYuan runtime testing is required, especially for CPU usage and functionality.

## Fail-safe checks

The workflow refuses to publish if the tag format, ZIP layout, package version, shared authorization context, or numeric tier predicate differs from the expected structure. It intentionally stops rather than publishing a potentially unpatched artifact.

Workflow: `.github/workflows/sync-free-release.yml`
Patcher: `scripts/patch-release.mjs`
