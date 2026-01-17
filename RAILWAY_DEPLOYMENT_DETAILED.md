# Railway 部署詳細指南

## 第一步：準備工作

### 1.1 創建 Railway 帳戶
- 訪問 https://railway.app
- 使用 GitHub 帳戶登錄（推薦）
- 驗證郵箱

### 1.2 確認 GitHub 倉庫
- 倉庫地址：https://github.com/dabing823-spec/stock-strategy-dashboard
- 確保代碼已推送到 `main` 分支
- 驗證 `package.json` 和 `railway.json` 存在

---

## 第二步：在 Railway 上創建新項目

### 2.1 創建項目
1. 登錄 Railway 儀表板
2. 點擊「+ New Project」按鈕
3. 選擇「Deploy from GitHub repo」
4. 授權 Railway 訪問您的 GitHub 帳戶
5. 從列表中選擇 `stock-strategy-dashboard` 倉庫

### 2.2 Railway 自動檢測
- Railway 會自動識別 Node.js 項目
- 自動檢測 `package.json` 中的構建和啟動命令
- 使用 Nixpacks 構建環境

**預期行為：**
```
✓ Detected Node.js project
✓ Build command: npm run build
✓ Start command: npm run start
```

---

## 第三步：配置環境變數（最關鍵）

### 3.1 訪問環境變數設置
1. 在 Railway 項目頁面，點擊「Variables」標籤
2. 點擊「+ Add Variable」添加新變數

### 3.2 必需的環境變數

#### A. 數據庫配置（可選，如果使用 MySQL）
```
DATABASE_URL=mysql://username:password@host:port/database_name
```
**示例：**
```
DATABASE_URL=mysql://root:mypassword@localhost:3306/stock_dashboard
```

#### B. 認證配置
```
JWT_SECRET=your-random-secret-key-at-least-32-characters
```
**生成方法：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### C. Finnhub API 配置（最重要）
```
FINNHUB_API_KEY=your-finnhub-api-key
```

**如何獲取 Finnhub API 密鑰：**
1. 訪問 https://finnhub.io
2. 點擊「Sign Up」
3. 使用郵箱或 GitHub 註冊
4. 登錄後，進入「Dashboard」
5. 複製您的 API 密鑰（格式如：`c123456789abcdef`）
6. 粘貼到 Railway 的 `FINNHUB_API_KEY` 變數

#### D. Manus OAuth 配置（如果使用認證）
```
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### 3.3 驗證環境變數
- 確保所有必需變數都已添加
- 檢查沒有多餘的空格或換行符
- 特別注意 `FINNHUB_API_KEY` 的正確性

---

## 第四步：部署

### 4.1 開始部署
1. 所有環境變數配置完成後
2. Railway 會自動開始構建
3. 或點擊「Deploy」按鈕手動觸發

### 4.2 監控構建過程
1. 點擊「Deployments」標籤
2. 查看實時構建日誌
3. 等待構建完成（通常 3-5 分鐘）

**正常的構建日誌應該包含：**
```
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking packages...
[4/4] Building packages...
✓ Build successful
✓ Starting application...
✓ Application is running
```

### 4.3 獲取公開 URL
- 構建完成後，Railway 會生成公開 URL
- 格式：`https://your-app-name-production.up.railway.app`
- 複製此 URL 在瀏覽器中訪問

---

## 常見問題和解決方案

### 問題 1：構建失敗 - "npm ERR! code ERESOLVE"

**原因：** 依賴版本衝突

**解決方案：**
```bash
# 在本地運行以驗證
npm ci
npm run build

# 如果成功，推送到 GitHub
git push github main
```

**或者在 Railway 中添加環境變數：**
```
NODE_OPTIONS=--legacy-peer-deps
```

---

### 問題 2：應用啟動失敗 - "Cannot find module"

**原因：** 依賴未正確安裝

**解決方案：**
1. 檢查 `package.json` 是否正確
2. 確認所有依賴都已列出
3. 在 Railway 日誌中查看具體錯誤
4. 本地重新安裝依賴：`npm install`
5. 推送到 GitHub 重新部署

---

### 問題 3：數據仍然是舊的 - "API 返回備用數據"

**原因：** Finnhub API 密鑰無效或 API 調用失敗

**解決方案：**

**步驟 1：驗證 API 密鑰**
```bash
# 在本地測試 API 密鑰
curl "https://finnhub.io/api/v1/quote?symbol=^VIX&token=YOUR_API_KEY"
```

應該返回類似：
```json
{
  "c": 15.39,
  "h": 16.20,
  "l": 14.80,
  "o": 15.10,
  "pc": 15.20,
  "t": 1705420800
}
```

**步驟 2：檢查 Railway 日誌**
1. 在 Railway 項目中點擊「Logs」
2. 搜索 `[Finnhub]` 或 `[API]`
3. 查看是否有錯誤信息

**典型的成功日誌：**
```
[Finnhub] Successfully fetched VIX data: 15.39
[Finnhub] Successfully fetched Taiwan margin data
[Cache] Hit for key: vix_index
```

**典型的失敗日誌：**
```
[Finnhub] Error: Invalid API key
[API] Error fetching VIX: 401 Unauthorized
[Data] Using fallback data for VIX
```

**步驟 3：更新 API 密鑰**
1. 確認 Finnhub 密鑰有效
2. 在 Railway Variables 中更新 `FINNHUB_API_KEY`
3. 點擊「Redeploy」重新部署

---

### 問題 4：數據庫連接失敗

**原因：** `DATABASE_URL` 格式錯誤或數據庫不可訪問

**解決方案：**

**驗證 DATABASE_URL 格式：**
```
mysql://username:password@host:port/database_name
```

**常見錯誤：**
- ❌ `mysql://username:password@localhost:3306/db` （localhost 在 Railway 中無效）
- ✅ `mysql://username:password@mysql-service:3306/db` （使用 Railway 服務名）

**如果使用 Railway MySQL 服務：**
1. 在 Railway 項目中添加 MySQL 服務
2. Railway 會自動生成 `DATABASE_URL`
3. 複製並粘貼到環境變數中

**測試數據庫連接：**
```bash
# 在本地測試
mysql -h host -u username -p database_name
```

---

### 問題 5：應用無法訪問 - "502 Bad Gateway"

**原因：** 應用未正確啟動或端口配置錯誤

**解決方案：**

**步驟 1：檢查應用日誌**
1. 在 Railway 項目中點擊「Logs」
2. 查看是否有啟動錯誤

**步驟 2：驗證啟動命令**
確認 `package.json` 中的啟動命令：
```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

**步驟 3：檢查端口配置**
應用應該監聽 Railway 提供的端口：
```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**步驟 4：重新部署**
1. 在 Railway 項目中點擊「Redeploy」
2. 等待新部署完成

---

### 問題 6：CORS 錯誤 - "Access-Control-Allow-Origin"

**原因：** 前端和後端域名不匹配

**解決方案：**

在 `server/_core/index.ts` 中配置 CORS：
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

在 Railway 環境變數中添加：
```
FRONTEND_URL=https://your-app-name-production.up.railway.app
```

---

## 部署後的驗證步驟

### 1. 訪問儀表板
- 打開 Railway 提供的 URL
- 確認頁面正常加載

### 2. 檢查數據更新
- 打開瀏覽器開發者工具（F12）
- 進入「Network」標籤
- 刷新頁面
- 查看 API 調用是否成功（狀態碼 200）

### 3. 驗證實時數據
- 檢查 VIX 指數是否顯示最新值
- 檢查台灣加權指數是否顯示最新值
- 檢查 CNN 恐慌指數是否更新

### 4. 查看應用日誌
- 在 Railway 中點擊「Logs」
- 確認沒有錯誤信息
- 確認 API 調用成功

---

## 性能優化建議

### 1. 啟用快取
- 儀表板已實現 5 分鐘快取
- 減少 API 調用頻率

### 2. 設置自動刷新
- 建議刷新間隔：5-10 分鐘
- 避免超過 Finnhub 免費層級限制（60 次/分鐘）

### 3. 監控 API 配額
- Finnhub 免費層級：60 次 API 調用/分鐘
- 付費層級：更高的配額

---

## 支持和故障排除

**如果遇到問題：**

1. **查看 Railway 日誌**
   - 最詳細的錯誤信息來自日誌

2. **檢查環境變數**
   - 確保所有必需變數都已設置
   - 檢查沒有拼寫錯誤

3. **本地測試**
   - 在本地運行 `npm run dev`
   - 驗證代碼是否正常工作

4. **聯繫支持**
   - Railway 官方文檔：https://docs.railway.app
   - Finnhub 官方文檔：https://finnhub.io/docs/api

---

## 總結

**部署的關鍵步驟：**
1. ✅ 創建 Railway 帳戶
2. ✅ 連接 GitHub 倉庫
3. ✅ 配置環境變數（特別是 `FINNHUB_API_KEY`）
4. ✅ 等待構建完成
5. ✅ 驗證應用正常運行
6. ✅ 檢查數據是否實時更新

**最常見的問題：**
- Finnhub API 密鑰無效 → 驗證並更新
- 環境變數缺失 → 添加所有必需變數
- 構建失敗 → 檢查本地依賴

祝您部署順利！
