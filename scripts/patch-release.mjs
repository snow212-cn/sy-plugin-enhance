import fs from "node:fs";
import path from "node:path";

const [packageDir, upstreamTag] = process.argv.slice(2);
if (!packageDir || !upstreamTag) {
  console.error("Usage: node scripts/patch-release.mjs <package-directory> <upstream-tag>");
  process.exit(2);
}
if (!/^v\d+\.\d+\.\d+$/.test(upstreamTag)) {
  throw new Error("Refusing unexpected upstream tag format: " + upstreamTag);
}

const expectedVersion = upstreamTag.slice(1);
const pluginPath = path.join(packageDir, "plugin.json");
const indexPath = path.join(packageDir, "index.js");
if (!fs.existsSync(pluginPath) || !fs.existsSync(indexPath)) {
  throw new Error("Upstream package.zip layout changed: expected plugin.json and index.js at ZIP root.");
}

const plugin = JSON.parse(fs.readFileSync(pluginPath, "utf8"));
if (plugin.version !== expectedVersion) {
  throw new Error("Version mismatch: release tag is " + upstreamTag + ", but plugin.json says " + plugin.version + ". No release will be published.");
}

let source = fs.readFileSync(indexPath, "utf8");
if (!/\bux\(\(\)=>/.test(source) || !/\bux,\(\)=>/.test(source)) {
  throw new Error("Could not verify the expected computed-ref helper ux; upstream bundle may have changed. No release will be published.");
}

// Keep the authorization provider and its side effects intact. Only make the
// free/non-free pair consistent and allow the shared numeric tier gate.
const authContext = /(Lgx,\{isFree:)[A-Za-z_$][\w$]*,isNotFree:[A-Za-z_$][\w$]*,isPro:([A-Za-z_$][\w$]*),isVip:([A-Za-z_$][\w$]*),isPermanent:([A-Za-z_$][\w$]*),levelLabel:([A-Za-z_$][\w$]*),levelIcon:([A-Za-z_$][\w$]*),computedLevel:([A-Za-z_$][\w$]*)\}/g;
let contextMatches = 0;
source = source.replace(authContext, (_full, prefix, isPro, isVip, isPermanent, levelLabel, levelIcon, computedLevel) => {
  contextMatches += 1;
  return prefix + "ux(()=>!1),isNotFree:ux(()=>!0),isPro:" + isPro +
    ",isVip:" + isVip + ",isPermanent:" + isPermanent +
    ",levelLabel:" + levelLabel + ",levelIcon:" + levelIcon +
    ",computedLevel:" + computedLevel + "}";
});
if (contextMatches !== 1) {
  throw new Error("Expected exactly one shared authorization context, found " + contextMatches + ". No release will be published.");
}

// Replace only the numeric predicate inside computedLevel(). This keeps the
// original computed ref, its default arguments, and the Mgx(y) side effect.
const tierPredicate = /return!i\|\|p\[E\(\d+\)\]\(t\[E\(\d+\)\]\.lv,p\[E\(\d+\)\]\(Number,i\)\)/g;
let tierMatches = 0;
source = source.replace(tierPredicate, () => {
  tierMatches += 1;
  return "return!0";
});
if (tierMatches !== 1) {
  throw new Error("Expected exactly one central numeric tier predicate, found " + tierMatches + ". No release will be published.");
}

fs.writeFileSync(indexPath, source, "utf8");
console.log("Applied free-access patch revision 2 for upstream " + upstreamTag + ".");
console.log("Kept provider registration and tier-specific Pro/VIP/permanent flags intact.");
