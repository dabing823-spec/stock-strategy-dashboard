# Railway 部署指南

## 快速開始

1. **訪問 Railway：** https://railway.app

2. **連接 GitHub 倉庫：**
   - 點擊「New Project」
   - 選擇「Deploy from GitHub repo」
   - 選擇 `dabing823-spec/stock-strategy-dashboard`

3. **配置環境變數：**
   
   在 Railway 的「Variables」中添加以下環境變數：

   ```
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your-secret-key
   VITE_APP_ID=your-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   OWNER_OPEN_ID=your-owner-id
   OWNER_NAME=Your Name
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=your-api-key
   VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
   FINNHUB_API_KEY=your-finnhub-api-key
   ```

4. **獲取 Finnhub API 密鑰：**
   - 訪問 https://finnhub.io
   - 免費註冊並獲取 API 密鑰
   - 將密鑰添加到 Railway 環境變數中

5. **部署：**
   - Railway 會自動檢測 `package.json` 和 `railway.json`
   - 自動運行 `npm run build` 和 `npm run start`
   - 部署完成後會生成公開 URL

## 數據庫設置

如果使用 MySQL 數據庫：

1. 在 Railway 中添加 MySQL 服務
2. 複製連接字符串到 `DATABASE_URL`
3. 運行 `pnpm db:push` 初始化數據庫

## 監控和日誌

- 在 Railway 儀表板中查看實時日誌
- 檢查 API 調用是否成功
- 驗證 Finnhub API 是否返回實時數據

## 故障排除

**問題：API 返回舊數據**
- 檢查 Finnhub API 密鑰是否有效
- 驗證 API 調用是否成功（查看日誌）
- 確認快取 TTL 設置（默認 5 分鐘）

**問題：數據庫連接失敗**
- 驗證 `DATABASE_URL` 格式
- 檢查數據庫是否可訪問
- 確認防火牆規則

## 性能優化

- 儀表板實現了 5 分鐘的數據快取
- API 調用限制：Finnhub 免費層級 60 次/分鐘
- 建議設置自動刷新間隔為 5 分鐘或更長
