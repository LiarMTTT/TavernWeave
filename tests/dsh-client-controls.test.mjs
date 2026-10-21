/**
 * 源码级契约测试：神之手（DSH 浏览器半侧）的轮盘显示/隐藏开关。
 *
 * 注意：这是源码级契约测试，不是浏览器验收。
 * 它只读 client.js 的源码，检查写法符合约定；不能证明轮盘在真实 DSH 里画得对、点得动、
 * localStorage 真的写进去了。真机验收由 Lead 在安装后的 DSH 里另行完成。
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientPath = "host-adapters/dsh/plugin/client.js";
const src = fs.readFileSync(path.join(root, clientPath), "utf8").replace(/\r\n?/g, "\n");

/** 截取源码中从 startMarker 到 endMarker（不含）之间的一段，找不到就失败。 */
function slice(startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  assert.notEqual(start, -1, `client.js 里找不到起点：${startMarker}`);
  if (endMarker === undefined) return src.slice(start);
  const end = src.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `client.js 里找不到终点：${endMarker}`);
  return src.slice(start, end);
}

const readUi = slice("function readUi()", "function writeUi(ui)");
const writeUi = slice("function writeUi(ui)", "/* ---------------- 共享状态");
const storeInit = slice("ui: readUi()", "sessionId: undefined,");
const toggle = slice("function WheelToggleButton()", "/* Soul 小浮窗 */");
const overlay = slice("function Overlay() {", "/* ---------------- 装配");
const headerSlot = slice("ctx.slots.inject('conversation.session.header.utilities'", "ctx.slots.inject('conversation.input.dock'");

test("轮盘开关：UI_KEY 不升版本，旧存储缺少 wheelOn 时按显示处理", () => {
  assert.match(src, /const UI_KEY = 'godhand\.ui\.v2';/u);
  assert.doesNotMatch(src, /godhand\.ui\.v3/u, "轮盘开关不该升级 UI_KEY 版本");
  assert.match(readUi, /wheelOn: raw\.wheelOn !== false,/u);
  assert.doesNotMatch(readUi, /wheelOn: raw\.wheelOn === true/u, "只能用 !== false 判定，旧存储缺字段时才按 true");
  assert.match(writeUi, /wheelOn: ui\.wheelOn !== false/u, "writeUi 必须把 wheelOn 写回本机");
});

test("轮盘开关：默认值存在且不是 false", () => {
  assert.match(storeInit, /wheelOn: true/u);
  assert.doesNotMatch(src, /wheelOn: false/u, "源码里不允许出现把 wheelOn 默认值写成 false 的写法");
});

test("轮盘开关：Overlay 只在 wheelOn 不为 false 时挂载轮盘，其他部件不受影响", () => {
  assert.match(overlay, /s\.ui\.wheelOn !== false \? h\(Wheel, \{ s \}\) : null/u);
  assert.doesNotMatch(overlay, /^\s+h\(Wheel, \{ s \}\),$/mu, "轮盘不能再无条件渲染");
  assert.match(overlay, /s\.ui\.mode === 'full' \? h\(FullWindow, \{ s \}\) : null/u);
  assert.match(overlay, /s\.ws\.managerOpen \? h\(ProjectOverlay/u);
  assert.match(overlay, /s\.lib\.open \? h\(LibraryOverlay/u);
});

test("轮盘开关：会话头 WheelToggleButton 用 data-gh=wheel-toggle，label 与 aria-pressed 跟着显示状态切换", () => {
  assert.match(toggle, /'data-gh': 'wheel-toggle'/u);
  assert.match(toggle, /const on = s\.ui\.wheelOn !== false;/u);
  assert.match(toggle, /label: on \? '隐藏轮盘' : '显示轮盘'/u);
  assert.match(toggle, /pressed: on/u, "aria-pressed 表示当前是否显示轮盘");
  assert.match(toggle, /onClick: \(\) => setUi\(\{ wheelOn: !on \}\)/u);
  assert.match(toggle, /h\(IconWheel, \{ off: !on \}\)/u);
  assert.doesNotMatch(toggle, /Logo/u, "开关不复用品牌 Logo");
  assert.match(src, /const IconWheel = \(\{ off \}\)/u, "轮盘开关要有独立的轮盘小图标");
});

test("轮盘开关：与神之手按钮注册在同一会话头席位，order 相邻、id 不冲突", () => {
  const rows = [...headerSlot.matchAll(/id: (PLUGIN_ID(?: \+ '-wheel')?), order: (-?\d+) \}, (\w+)\)/gu)]
    .map((m) => ({ id: m[1], order: Number(m[2]), component: m[3] }));
  assert.equal(rows.length, 2, "会话头席位要注册神之手按钮和轮盘开关两个部件");
  const brand = rows.find((row) => row.component === "HeaderButton");
  const wheel = rows.find((row) => row.component === "WheelToggleButton");
  assert.ok(brand, "HeaderButton 仍要注册");
  assert.ok(wheel, "WheelToggleButton 要注册");
  assert.notEqual(brand.id, wheel.id, "两个注册不能共用 id");
  assert.equal(Math.abs(brand.order - wheel.order), 1, "两个按钮的 order 必须相邻");
});

test("轮盘开关：收起回轮盘时会强制把轮盘打开，打开完整浮窗不改开关", () => {
  const compactWithWheel = [...src.matchAll(/setUi\(\{ mode: 'compact', wheelOn: true \}\)/gu)].length;
  assert.ok(compactWithWheel >= 2, "浮窗“收起到轮盘”和 Esc 收起都要带 wheelOn: true");
  assert.match(src, /label: '收起到轮盘', onClick: \(\) => setUi\(\{ mode: 'compact', wheelOn: true \}\)/u);
  assert.match(src, /if \(e\.key === 'Escape'\) \{ e\.stopPropagation\(\); setUi\(\{ mode: 'compact', wheelOn: true \}\); \}/u);
  assert.match(src, /onClick: \(\) => setUi\(full \? \{ mode: 'compact', wheelOn: true \} : \{ mode: 'full' \}\)/u);
  assert.doesNotMatch(src, /mode: 'full', wheelOn/u, "打开完整浮窗不强制改轮盘开关");
});

test("IconButton 会把 data 属性透传给宿主原生按钮和兜底按钮", () => {
  const iconButton = slice("function IconButton(", "function TextButton(");
  assert.match(iconButton, /className, children, \.\.\.rest \}\)/u);
  assert.equal((iconButton.match(/\.\.\.rest/gu) ?? []).length, 3, "签名收一次，两条渲染分支各透传一次");
});

test("客户端版本升到 1.1.0，顶部注释一起改", () => {
  assert.match(src, /^ \* 神之手 · 浏览器半侧（1\.1\.0）$/mu);
  assert.match(src, /window\.__GODHAND__ = \{ version: '1\.1\.0'/u);
  assert.doesNotMatch(src, /version: '1\.0\.0'/u);
  assert.match(src, /\* +旁边还有一个轮盘开关：显示\/隐藏左侧的 Skill 轮盘，状态存本机/u);
});
