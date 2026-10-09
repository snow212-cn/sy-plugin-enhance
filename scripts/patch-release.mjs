import fs from "node:fs";
import path from "node:path";

const [packageDir, upstreamTag] = process.argv.slice(2);
if (!packageDir || !upstreamTag) {
  console.error("Usage: node scripts/patch-release.mjs <package-directory> <upstream-tag>");
  process.exit(2);
}
if (!/^v\\d+\\.\\d+\\.\\d+$/.test(upstreamTag)) {
  throw new Error(`Refusing unexpected upstream tag format: ${upstreamTag}`);
}

const expectedVersion = upstreamTag.slice(1);
const pluginPath = path.join(packageDir, "plugin.json");
const indexPath = path.join(packageDir, "index.js");
if (!fs.existsSync(pluginPath) || !fs.existsSync(indexPath)) {
  throw new Error("Upstream package.zip layout changed: expected plugin.json and index.js at ZIP root.");
}

const plugin = JSON.parse(fs.readFileSync(pluginPath, "utf8"));
if (plugin.version !== expectedVersion) {
  throw new Error(`Version mismatch: release tag is ${upstreamTag}, but plugin.json says ${plugin.version}. No release will be published.`);
}

const source = fs.readFileSync(indexPath, "utf8");
if (!/\\bux\\(\\(\\)=>/.test(source) || !/\\bux,\\(\\)=>/.test(source)) {
  throw new Error("Could not verify the expected computed-ref helper `ux`; upstream bundle may have changed. No release will be published.");
}

const authContext = /([A-Za-z_$][\\w$]*\\[[A-Za-z_$][\\w$]*\\(\\d+\\)\\]\\()([A-Za-z_$][\\w$]*),\\{isFree:([A-Za-z_$][\\w$]*),isNotFree:([A-Za-z_$][\\w$]*),isPro:([A-Za-z_$][\\w$]*),isVip:([A-Za-z_$][\\w$]*),isPermanent:([A-Za-z_$][\\w$]*),levelLabel:([A-Za-z_$][\\w$]*),levelIcon:([A-Za-z_$][\\w$]*),computedLevel:([A-Za-z_$][\\w$]*)\\}\\)/g;
let matches = 0;
const patched = source.replace(authContext, (_full, callee, component, _free, _notFree, _pro, _vip, _permanent, label, icon) => {
  matches += 1;
  return `${callee}${component},{isFree:ux(()=>!1),isNotFree:ux(()=>!0),isPro:ux(()=>!0),isVip:ux(()=>!0),isPermanent:ux(()=>!0),levelLabel:${label},levelIcon:${icon},computedLevel:(i,f=!0)=>ux(()=>!0)})`;
});

if (matches !== 1) {
  throw new Error(`Expected exactly one shared authorization context initializer, found ${matches}. No release will be published.`);
}
if (patched === source) {
  throw new Error("Authorization patch unexpectedly made no changes.");
}

fs.writeFileSync(indexPath, patched, "utf8");
console.log(`Patched the shared Auth_Status context for upstream ${upstreamTag}.`);
console.log("Feature gates consuming isFree/isNotFree/isPro/isVip/isPermanent/computedLevel are overridden; the bundled source is not rebuilt.");
