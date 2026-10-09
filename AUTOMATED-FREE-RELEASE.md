# Automated free-edition releases

This fork does not contain the full upstream source tree. Its release workflow therefore patches the upstream prebuilt `package.zip` instead of compiling the plugin.

## What the workflow does

- Checks the latest stable release of `Wetoria/sy-plugin-enhance` every six hours. It can also be started manually from the Actions tab.
- Checks whether the exact upstream tag already has a Release in this fork. If yes, it exits without publishing a duplicate.
- Downloads the upstream `package.zip`, verifies its ZIP structure and checks that `plugin.json` has the same version as the upstream tag.
- Rewrites one shared authorization context in `index.js`: `isFree=false`, `isNotFree=true`, `isPro/isVip/isPermanent=true`, and `computedLevel(...)=true` (provided as computed refs).
- Runs JavaScript syntax and ZIP integrity checks, then publishes `package.zip` as a GitHub Release with the exact same tag/version as upstream.

Example: upstream `v1.12.6` results in a fork Release tagged `v1.12.6`, and the attached plugin manifest remains version `1.12.6`.

## What this changes

The patch grants access through feature checks that consume this shared authorization context. It does not change the underlying feature implementations or require users to buy/import a license to pass those checks.

## Known limits and safe failure

This is a package-level patch, not a source rebuild. Old purchase/license screens, wording, tier labels, or code paths that bypass the shared authorization context may still exist. This setup should be treated as access-unlock automation, not proof that every UI trace of the paid model has been removed.

The patcher expects a known minified authorization initializer and the computed-ref helper `ux`. If upstream changes the bundle layout, helper name, initializer shape, or version metadata, the workflow fails before creating a release. It deliberately does not publish an unpatched artifact. The patch point must then be reviewed and updated for that upstream version.

## Workflow location

`.github/workflows/sync-free-release.yml`

To start an initial release immediately, open **Actions -> Sync upstream free release -> Run workflow**. A successful first run should publish the current latest upstream version. Subsequent runs skip versions that already have a release in this fork.
