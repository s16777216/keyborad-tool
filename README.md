# keyborad-tool

把文字檔的內容，用模擬鍵盤按鍵的方式逐字打進目前有焦點的視窗。

## 原理

- 使用 `koffi` 呼叫 Windows `user32.dll` 的 `SendInput`。
- 以 **scancode** 模式送出按鍵（不是 Unicode 字元），遠端工具會視為真實鍵盤輸入。
- 大寫字母與符號以「按下 Shift → 按鍵 → 放開 Shift」模擬。
- 使用 **US 鍵盤配置**的對照表（`src/keys.ts`）。

## 需求

- Windows
- Node.js 18 以上

## 安裝

```
npm install
cp input.example.txt input.txt   # 建立自己的輸入檔
```

## 使用方式

```
npm start                           # 打 input.txt，8 秒倒數
npm start -- my.txt                 # 指定檔案
npm start -- my.txt --delay 120     # 放慢按鍵速度
npm start -- --dry                  # 只列出內容，不送按鍵
npm start -- --symbols              # 打一行符號測試字串
npm start -- --help                 # 顯示說明
```

流程：

1. 執行指令，看到倒數提示。
2. 倒數期間，點一下目標視窗的編輯區。
3. 倒數結束後開始自動輸入。
4. 想停止，隨時按 **Esc**。

### 選項

| 選項 | 預設 | 說明 |
|---|---|---|
| `[檔案]` | `input.txt` | 要輸入的文字檔 |
| `--delay <ms>` | 60 | 每個按鍵之間的延遲 |
| `--line-delay <ms>` | 150 | 每行結束後的延遲 |
| `--countdown <s>` | 8 | 開始前的倒數秒數 |
| `--no-esc` | （關閉） | 每行結尾不先送 Esc |
| `--dry` | （關閉） | 只列出會輸入的內容 |
| `--symbols` | （關閉） | 改輸入符號測試字串 |

## 輸入檔格式

- 一行文字對應一次輸入，每行結尾都會換行。
- 空行會送出一次 Enter。
- 檔尾的最後一個換行不會多送一行。
- 支援 UTF-8（含 BOM）與 CRLF / LF。
- 只支援 US 鍵盤上能直接打出的 ASCII 字元（字母、數字、常見符號、空白、Tab）。
  其他字元（例如中文）會在開始前列出警告並略過。

## 每行結尾的 Esc

預設每行輸入完會先送一次 Esc 再送 Enter，用來關閉編輯器可能跳出的自動完成視窗
（例如 SQL Developer、IDE），避免 Enter 選到選單項目。

本工具不限定特定程式，可用於任何接受鍵盤輸入的視窗。如果目標程式不需要這個動作，
或 Esc 在該程式有其他作用（例如會關閉對話框、切換模式），請用 `--no-esc` 關閉。

程式自己送出的 Esc 不會被當成中止指令。

## 疑難排解

- **漏字**：遠端連線較慢，調大 `--delay`，例如 `--delay 150`。
- **完全沒反應**：目標視窗若以系統管理員身分執行，終端機也要用系統管理員身分開啟。
- **出現 `SendInput 失敗`**：同上，通常是權限不足。
- **符號打出來不對**：遠端鍵盤配置不是 US，需要修改 `src/keys.ts` 的對照表。
- **自動完成干擾**：確認沒有使用 `--no-esc`，或視情況調大 `--line-delay`。

## 專案結構

```
src/keys.ts    字元 → scancode / Shift 對照表（US 鍵盤）
src/send.ts    SendInput 與 GetAsyncKeyState 的封裝
src/main.ts    參數解析、讀檔、倒數、Esc 中止、主迴圈
input.txt      預設輸入檔（自行建立，不在 repo 內；可複製 input.example.txt 開始）
```

型別檢查：`npm run check`
