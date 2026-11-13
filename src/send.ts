import koffi from 'koffi';

const KEYBDINPUT = koffi.struct('KEYBDINPUT', {
  wVk: 'uint16', wScan: 'uint16', dwFlags: 'uint32', time: 'uint32', dwExtraInfo: 'uintptr_t',
});
// Windows x64 的 INPUT 為 40 bytes：type(4)+對齊(4)+union(32，由 MOUSEINPUT 撐大)
const INPUT = koffi.struct('INPUT', { type: 'uint32', ki: KEYBDINPUT, pad: koffi.array('uint8', 8) });

const user32 = koffi.load('user32.dll');
const SendInput = user32.func('uint32 __stdcall SendInput(uint32 n, INPUT *inputs, int size)');
const GetAsyncKeyState = user32.func('int16 __stdcall GetAsyncKeyState(int vk)');

const KEYEVENTF_SCANCODE = 0x0008;
const KEYEVENTF_KEYUP = 0x0002;
const SIZE = koffi.sizeof(INPUT);

function send(sc: number, up: boolean) {
  const n = SendInput(1, {
    type: 1, // INPUT_KEYBOARD
    ki: { wVk: 0, wScan: sc, dwFlags: KEYEVENTF_SCANCODE | (up ? KEYEVENTF_KEYUP : 0), time: 0, dwExtraInfo: 0 },
    pad: new Array(8).fill(0),
  }, SIZE);
  if (n !== 1) throw new Error('SendInput 失敗（目標視窗可能是較高權限的程式，請用系統管理員身分執行）');
}

export const keyDown = (sc: number) => send(sc, false);
export const keyUp = (sc: number) => send(sc, true);

/** Esc 是否被按過（含「自上次呼叫以來按過」的旗標） */
export function escPressed(): boolean {
  return (GetAsyncKeyState(0x1b) & 0x8001) !== 0;
}
