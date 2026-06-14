// wasm-smoke.mjs — rig の wasm (name→index ブリッジ) が native と一致するか検証。
import { readFileSync } from "node:fs";
const mod = await WebAssembly.compile(readFileSync(new URL("../build/rig.wasm", import.meta.url)));
const imports = {};
for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
const { exports: ex } = await WebAssembly.instantiate(mod, imports);
try { ex._start(); } catch {}

const enc = new TextEncoder();
function matchBone(name) {
  const bytes = enc.encode(name);
  const ptr = ex.rig_alloc(bytes.length);          // RawPtr = linear-mem offset
  new Uint8Array(ex.memory.buffer, Number(ptr), bytes.length).set(bytes);
  return ex.rig_match();                            // VRM bone index (Float)
}

let ok = true;
const check = (name, want) => {
  const got = matchBone(name);
  if (got !== want) { console.error(`FAIL ${name}: ${got} != ${want}`); ok = false; }
};
check("mixamorigLeftUpperArm", 7);
check("Hips", 0);
check("UpperArm.R", 11);
check("Thigh.L", 14);
check("Spine1", 2);
check("bogus", -1);

if (ok) console.log("wasm OK — name→index matches native");
else process.exit(1);
