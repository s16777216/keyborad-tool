import { readFileSync } from 'node:fs';
import { lookup, SC } from './keys.js';
import { keyDown, keyUp, escPressed } from './send.js';

// ---------- 參數 ----------
const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string, def: number) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? Number(argv[i + 1]) : def;
};
if (flag('help')) {
  console.log(`用法: npm start -- [檔案] [選項]
  檔案            要打的文字檔（預設 input.txt）
  --delay <ms>    每個按鍵之間的延遲（預設 60）
  --line-delay <ms> 每行結束後的延遲（預設 150）
  --countdown <s> 開始前倒數秒數（預設 8）
  --no-esc        每行結尾不先送 Esc
  --dry           只列出會送什麼，不真的送
  --symbols       改打一行符號測試字串
執行中按 Esc 可中止。`);
  process.exit(0);
}
const file = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && /^--(delay|line-delay|countdown)$/.test(argv[i - 1]))) ?? 'input.txt';
const delay = opt('delay', 60);
const lineDelay = opt('line-delay', 150);
const countdown = opt('countdown', 8);
const useEsc = !flag('no-esc');
const dry = flag('dry');

// ---------- 讀取內容 ----------
const text = flag('symbols')
  ? `abcXYZ 0123456789 -=[];',./\`\\ !@#$%^&*()_+{}:"<>?|~`
  : readFileSync(file, 'utf8').replace(/^﻿/, '');
const lines = text.split(/\r?\n/);
if (lines.at(-1) === '') lines.pop(); // 檔尾換行不算一個空行

// ---------- 檢查不支援字元 ----------
const bad = new Map<string, number[]>();
lines.forEach((l, i) => { for (const ch of l) if (!lookup(ch)) (bad.get(ch) ?? bad.set(ch, []).get(ch)!).push(i + 1); });
if (bad.size) {
  console.warn('⚠ 以下字元不在鍵盤對照表內，會被略過：');
  for (const [ch, ls] of bad) console.warn(`   ${JSON.stringify(ch)} (U+${ch.codePointAt(0)!.toString(16)})  行 ${ls.slice(0, 10).join(',')}`);
}

// ---------- 工具 ----------
class Aborted extends Error {}
const sleep = async (ms: number) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (escPressed()) throw new Aborted();
    await new Promise(r => setTimeout(r, Math.min(30, Math.max(0, end - Date.now()))));
  }
};
const tap = async (sc: number, shift = false) => {
  if (shift) keyDown(SC.SHIFT);
  keyDown(sc); keyUp(sc);
  if (shift) keyUp(SC.SHIFT);
  await sleep(delay);
};

// ---------- 主流程 ----------
const total = lines.reduce((n, l) => n + l.length, 0);
console.log(`檔案: ${flag('symbols') ? '(符號測試)' : file}｜${lines.length} 行 ${total} 字｜delay=${delay}ms line-delay=${lineDelay}ms${dry ? '｜DRY' : ''}`);

if (dry) {
  lines.forEach((l, i) => console.log(`${String(i + 1).padStart(3)}: ${l}`));
  process.exit(0);
}

escPressed(); // 清掉舊旗標
for (let s = countdown; s > 0; s--) {
  process.stdout.write(`\r請點一下目標視窗的編輯區… ${s} 秒後開始（按 Esc 取消）  `);
  await sleep(1000).catch(() => { console.log('\n已取消'); process.exit(1); });
}
console.log('\n開始輸入');

let cur = 0;
try {
  for (let i = 0; i < lines.length; i++) {
    cur = i + 1;
    for (const ch of lines[i]) {
      const k = lookup(ch);
      if (k) await tap(k.sc, k.shift);
    }
    if (useEsc) { keyDown(SC.ESC); keyUp(SC.ESC); await new Promise(r => setTimeout(r, 80)); escPressed(); } // 自己送的 Esc 不算中止
    await tap(SC.ENTER);
    process.stdout.write(`\r進度 ${cur}/${lines.length}`);
    await sleep(lineDelay);
  }
  console.log('\n完成');
} catch (e) {
  if (e instanceof Aborted) { console.log(`\n已中止，停在第 ${cur} 行`); process.exit(1); }
  throw e;
}
