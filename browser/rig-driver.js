// rig-driver.js — rig の wasm でFBXボーン名を VRM スロットに正規化するグルー例。
// マッピングの正本は Almide(wasm)、シーングラフ操作は Three.js(JS)。
//
//   const rig = await loadRig("/rig.wasm");
//   const slot = rig.match("mixamorigLeftUpperArm");   // → "leftUpperArm" or null

// bridge の index と同順 (mod.almd vrm_bones())。
const VRM_BONES = [
  "hips", "spine", "chest", "upperChest", "neck", "head",
  "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
  "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
  "leftUpperLeg", "leftLowerLeg", "leftFoot", "leftToes",
  "rightUpperLeg", "rightLowerLeg", "rightFoot", "rightToes",
];

export async function loadRig(wasmUrl) {
  const bytes = await (await fetch(wasmUrl)).arrayBuffer();
  const mod = await WebAssembly.compile(bytes);
  const imports = {};
  for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
  const { exports: ex } = await WebAssembly.instantiate(mod, imports);
  try { ex._start(); } catch {}
  const enc = new TextEncoder();

  return {
    // 生ボーン名 → VRM スロット名 (対応無しは null)。
    match(name) {
      const b = enc.encode(name);
      const ptr = ex.rig_alloc(b.length);              // 線形メモリにバッファ確保
      new Uint8Array(ex.memory.buffer, Number(ptr), b.length).set(b);
      const idx = ex.rig_match();                      // VRM bone index (-1=未対応)
      return idx < 0 ? null : VRM_BONES[idx];
    },
  };
}
