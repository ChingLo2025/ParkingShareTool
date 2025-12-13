# 車位協調小工具（前端）

這是一個純靜態（GitHub Pages 可用）的前端，搭配你已完成的 Google Apps Script Web App 當後端。

## ⚠️ 使用前請注意（Important）

本專案為「前端範例 + 輕量內部工具」，**未包含任何身分驗證或安全防護機制**。

如果你 fork / clone 本專案自行使用，請務必：

1. **修改 `app.js` 中的 `API_BASE`**
   ```js
   const API_BASE = 'https://script.google.com/macros/s/你的WebAppID/exec';


## 使用方式

1. 打開 `app.js`，把下面這行改成你的 Web App URL：
   ```js
   const API_BASE = 'https://script.google.com/macros/s/你的WebAppID/exec';
   ```
3. 開啟 GitHub Pages。

## 功能
- 免責聲明（localStorage 記錄同意）
- 三選一：釋出 / 候補 / 查詢
- 釋出：日期 + 名字 → 釋出
- 候補：日期 → 可用車位下拉 → 填 部門/姓名/分機/車號 → 使用
- 查詢：日期 → 1～6 號車位狀態表格

> 重要：目前不提供取消/修改功能，送出即寫入。

## ⚠️ Important Notice

This project is a lightweight internal tool / frontend example
and does NOT include authentication or security mechanisms.

If you fork or clone this repository for your own use, make sure to:

Update API_BASE in app.js

const API_BASE = 'https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec';


Ensure the Google Apps Script and Google Sheet belong to your own account

Be aware of the following limitations:
No cancel or edit functionality
No user authentication
