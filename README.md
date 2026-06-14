# fizz-fbx-rig-normalizer

Fizz の **リグ正規化コア**。FBX 等の生ボーン名(Mixamo / Unity / Maya / Blender の
各命名)を VRM humanoid のボーンスロット(hips / leftUpperArm …)に対応付ける。

§6 のうちシーングラフ操作(Three.js)はブラウザ専用だが、**どの生ボーンがどの VRM
スロットか**という命名規約の知識(別名テーブル + 照合)はここに集約=単一の正本。
native と wasm の両方で同じ Almide コアを使う。移植元: openaituber
`src/fbx/loader.ts` `normalizeBoneName` + `src/fbx/toVrm.ts` の別名表。

照合: `name.replace(/^mixamorig[:_]?/i, "").toLowerCase()` の完全一致。

## ① native — CLI(ボーン名一覧 → VRM スロット)

```sh
almide build src/main.almd -o build/fizz-fbx-rig-normalizer
printf 'mixamorigLeftUpperArm\nHips\nUpperArm.R\n' | ./build/fizz-fbx-rig-normalizer
# mixamorigLeftUpperArm	leftUpperArm
# Hips	hips
# UpperArm.R	rightUpperArm
```

FBX のボーン一覧を流せば、どれがどの humanoid スロットに載るか一覧できる。

## ② wasm — ブラウザのリグ正規化(FBX ロード時)

```sh
almide build src/bridge.almd --target wasm -o build/rig.wasm
```

文字列の受け渡し: `rig_alloc(len)` でちょうど len バイトのバッファを線形メモリに確保し、
JS がそこにボーン名 UTF-8 を書いて `rig_match()` を呼ぶ。戻り値は **VRM ボーン index**
(Float、-1=未対応)。JS は index から自前の VRM ボーン名リストを引く(文字列出力
ブリッジ不要)。グルー例は [`browser/rig-driver.js`](./browser/rig-driver.js):

```js
const rig = await loadRig("/rig.wasm");
rig.match("mixamorigLeftUpperArm");  // → "leftUpperArm"
```

wasm が native と一致することを CI(`test/wasm-smoke.mjs`)で検証。

## 開発

```sh
almide check src/main.almd
almide test spec/rig_normalizer_test.almd
almide build src/main.almd -o build/fizz-fbx-rig-normalizer
almide build src/bridge.almd --target wasm -o build/rig.wasm
```

ツールチェーン: [almide](https://github.com/almide/almide) v0.27.6+。依存なし。

> 実装メモ: 別名走査は `list.contains` を使う(`list.any(al, (a) => a == norm)` だと
> closure の非 Copy キャプチャが native codegen を壊す — almide/almide#687。wasm は可)。
