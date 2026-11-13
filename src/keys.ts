// US 鍵盤配置、scancode set 1。每個字元 → { sc: 掃描碼, shift: 是否需要 Shift }
export interface KeyStroke { sc: number; shift: boolean }

export const SC = { ESC: 0x01, ENTER: 0x1c, SHIFT: 0x2a, TAB: 0x0f } as const;

const map = new Map<string, KeyStroke>();
const add = (ch: string, sc: number, shift = false) => map.set(ch, { sc, shift });

const letters = ['1E','30','2E','20','12','21','22','23','17','24','25','26','32','31','18','19','10','13','1F','14','16','2F','11','2D','15','2C'];
letters.forEach((hex, i) => {
  const sc = parseInt(hex, 16);
  add(String.fromCharCode(97 + i), sc);
  add(String.fromCharCode(65 + i), sc, true);
});

const digitSc = [0x0b, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a]; // 0..9
const digitShift = ')!@#$%^&*(';
digitSc.forEach((sc, d) => { add(String(d), sc); add(digitShift[d], sc, true); });

// [不按Shift, 按Shift, scancode]
const pairs: [string, string, number][] = [
  ['-', '_', 0x0c], ['=', '+', 0x0d], ['[', '{', 0x1a], [']', '}', 0x1b],
  [';', ':', 0x27], ["'", '"', 0x28], ['`', '~', 0x29], ['\\', '|', 0x2b],
  [',', '<', 0x33], ['.', '>', 0x34], ['/', '?', 0x35],
];
for (const [a, b, sc] of pairs) { add(a, sc); add(b, sc, true); }
add(' ', 0x39);
add('\t', SC.TAB);

export function lookup(ch: string): KeyStroke | undefined { return map.get(ch); }
