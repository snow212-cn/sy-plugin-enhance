import fs from "node:fs";
import path from "node:path";

const [dir, tag] = process.argv.slice(2);
if (!dir || !/^v\d+\.\d+\.\d+$/.test(tag || "")) {
  throw new Error("Expected package directory and stable tag vX.Y.Z");
}
const manifestPath = path.join(dir, "plugin.json");
const scriptPath = path.join(dir, "index.js");
if (!fs.existsSync(manifestPath) || !fs.existsSync(scriptPath)) {
  throw new Error("Upstream package layout changed; refusing to publish");
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.version !== tag.slice(1)) {
  throw new Error("Manifest version does not match upstream tag");
}

let source = fs.readFileSync(scriptPath, "utf8");
// Igx is the local license/signature validator. Return a stable VIP-level
// entitlement payload, then allow the plugin's original EL activation/state
// machine to update and persist the normal authorization state.
const validator = /function Igx\(a,e,x,n\)\{[\s\S]*?\}function M_\(a,e\)/g;
let matches = 0;
source = source.replace(validator, () => {
  matches++;
  return 'function Igx(a,e,x,n){return{code:fg[Al(141)],success:!0,message:"ok",msg:"ok",data:{lv:99,expiration:null}}}function M_(a,e)';
});
if (matches !== 1) {
  throw new Error("Expected exactly one local license validator Igx; found " + matches + ". Refusing to publish.");
}
if (!source.includes('data:{lv:99,expiration:null}')) {
  throw new Error("Could not verify generated entitlement payload");
}

fs.writeFileSync(scriptPath, source, "utf8");
console.log("Replaced the local signature validator with a stable VIP entitlement result.");
console.log("The original activation flow and computedLevel implementation remain intact.");
