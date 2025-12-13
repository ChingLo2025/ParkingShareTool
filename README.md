# 車位協調小工具（前端）

這是一個純靜態（GitHub Pages 可用）的前端，搭配你已完成的 Google Apps Script Web App 當後端。

## 使用方式

1. 打開 `app.js`，把下面這行改成你的 Web App URL：
   ```js
   const API_BASE = 'https://script.google.com/macros/s/XXXXX/exec';
   ```

2. 把 `index.html`, `style.css`, `app.js` 放到 GitHub repository root（或 docs/，看你的 Pages 設定）。
3. 開啟 GitHub Pages。

## 功能
- 免責聲明（localStorage 記錄同意）
- 三選一：釋出 / 候補 / 查詢
- 釋出：日期 + 名字（王大明～王六明）→ 釋出
- 候補：日期 → 可用車位下拉 → 填 部門/姓名/分機/車號 → 使用
- 查詢：日期 → 1～6 號車位狀態表格

> 重要：目前不提供取消/修改功能，送出即寫入。
