# Automated free-edition releases

This fork downloads the latest stable release asset from `Wetoria/sy-plugin-enhance`, applies a guarded package-level patch, verifies it, and publishes a Release with the exact same version tag. The workflow checks every six hours and supports manual execution from Actions.

## Patch schema 4

Earlier patches modified the shared authorization context or forced every level check to return true. That approach was too broad and may enable tier-specific runtime paths simultaneously.

Schema 4 changes only the local bundled license/signature validator. It returns a successful result with a stable VIP-level payload (`lv: 99`, no expiration), then leaves the plugin's original activation flow, level computation, success callback, and persistence logic in place. It does not create or contact a licensing server.

This more closely follows the plugin's normal "activation successful" code path instead of forcing all feature checks independently. However, it is still an experimental patch to a minified bundle; CPU behavior and feature completeness require actual testing inside SiYuan.

## Safety checks

The workflow refuses to publish if the upstream version, ZIP layout, `plugin.json` version, or expected validator function no longer matches. If the same tag already exists with an older patch schema, it replaces that Release's `package.zip` rather than attempting to create a duplicate tag.

Workflow: `.github/workflows/sync-free-release.yml`
Patch script: `scripts/patch-release.mjs`
