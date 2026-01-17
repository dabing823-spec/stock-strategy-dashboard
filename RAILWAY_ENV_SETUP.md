# Railway 環境變數配置 - 逐步指南

## 什麼是環境變數？

環境變數是應用程序運行時需要的配置信息，例如 API 密鑰、數據庫連接等。在 Railway 中設置環境變數後，應用會自動讀取這些值。

---

## 第一步：登錄 Railway 並進入項目

1. **訪問 Railway：** https://railway.app
2. **登錄您的帳戶**
3. **點擊您的項目：** `stock-strategy-dashboard`

---

## 第二步：找到環境變數設置

### 方法 1：通過項目儀表板

1. 在項目頁面，您會看到以下標籤：
   - `Overview`（概覽）
   - `Deployments`（部署）
   - `Variables`（環境變數）← **點擊這個**
   - `Settings`（設置）

2. **點擊「Variables」標籤**

### 方法 2：通過服務設置

1. 在左側邊欄找到您的服務（通常名為 `stock-strategy-dashboard`）
2. 點擊服務名稱
3. 在右側面板中找到「Variables」
4. 點擊「Add Variable」

---

## 第三步：添加環境變數

### 3.1 添加第一個變數：FINNHUB_API_KEY

**這是最重要的一個！**

#### 步驟：

1. **點擊「+ Add Variable」按鈕**

2. **在「Key」欄位輸入：**
   ```
   FINNHUB_API_KEY
   ```

3. **在「Value」欄位輸入您的 Finnhub API 密鑰**

   **如何獲取 Finnhub API 密鑰：**
   
   a. 訪問 https://finnhub.io
   
   b. 點擊「Sign Up」（右上角）
   
   c. 選擇「Sign up with Email」或「Sign up with GitHub」
   
   d. 完成註冊和郵箱驗證
   
   e. 登錄後，進入 Dashboard
   
   f. 您會看到您的 API 密鑰（格式如：`c123456789abcdef`）
   
   g. **複製這個密鑰**

4. **粘貼到 Railway 的「Value」欄位**

5. **點擊「Add」或「Save」按鈕**

**示例：**
```
Key:   FINNHUB_API_KEY
Value: c123456789abcdef
```

---

### 3.2 添加第二個變數：JWT_SECRET

1. **點擊「+ Add Variable」按鈕**

2. **在「Key」欄位輸入：**
   ```
   JWT_SECRET
   ```

3. **在「Value」欄位輸入一個隨機密鑰**

   **生成方法（選擇一個）：**
   
   **方法 A：使用在線工具**
   - 訪問 https://www.uuidgenerator.net/
   - 複製生成的 UUID
   
   **方法 B：使用命令行（在您的電腦上）**
   ```bash
   openssl rand -hex 32
   ```
   
   **方法 C：簡單的隨機字符串**
   ```
   my-super-secret-key-12345678901234567890
   ```

4. **粘貼到 Railway 的「Value」欄位**

5. **點擊「Add」或「Save」按鈕**

**示例：**
```
Key:   JWT_SECRET
Value: 550e8400e29b41d4a716446655440000
```

---

### 3.3 添加第三個變數：DATABASE_URL（可選）

**只有在使用數據庫時才需要添加。**

#### 如果使用 Railway MySQL 服務：

1. **在 Railway 項目中添加 MySQL 服務**
   - 點擊「+ Add Service」
   - 選擇「MySQL」
   - Railway 會自動創建數據庫

2. **Railway 會自動生成 DATABASE_URL**
   - 在 MySQL 服務的「Variables」中查看
   - 複製 `DATABASE_URL` 的值

3. **在主應用服務中添加此變數**
   - 點擊「+ Add Variable」
   - Key: `DATABASE_URL`
   - Value: 粘貼從 MySQL 服務複製的值

**示例：**
```
Key:   DATABASE_URL
Value: mysql://root:password123@mysql.railway.internal:3306/railway
```

---

## 第四步：驗證環境變數

### 4.1 檢查變數是否正確保存

1. 在「Variables」頁面，您應該看到已添加的變數列表
2. 確認所有變數都顯示正確的 Key 名稱
3. Value 通常被隱藏（出於安全考慮），但應該顯示為「●●●●●」

### 4.2 查看當前配置

您應該看到類似的列表：
```
FINNHUB_API_KEY    ●●●●●●●●●●●●●●●●
JWT_SECRET         ●●●●●●●●●●●●●●●●
DATABASE_URL       ●●●●●●●●●●●●●●●●（如果添加了）
```

---

## 第五步：重新部署應用

環境變數添加後，需要重新部署應用才能生效。

### 5.1 手動重新部署

1. 在 Railway 項目頁面，找到「Deployments」標籤
2. 點擊最新的部署
3. 點擊「Redeploy」按鈕
4. 等待新部署完成（通常 2-3 分鐘）

### 5.2 自動部署

- 如果您推送新代碼到 GitHub，Railway 會自動重新部署
- 環境變數更新後，也會自動觸發重新部署

### 5.3 監控部署過程

1. 點擊「Deployments」標籤
2. 查看實時部署日誌
3. 等待看到「✓ Deployment successful」或類似信息

---

## 第六步：驗證應用是否正常運行

### 6.1 訪問應用

1. 在 Railway 項目頁面，找到「Domains」或「URL」部分
2. 複製公開 URL（格式如：`https://stock-strategy-dashboard-production.up.railway.app`）
3. 在瀏覽器中打開此 URL

### 6.2 檢查應用是否正常加載

- 頁面應該正常顯示
- 沒有「502 Bad Gateway」或「500 Internal Server Error」錯誤

### 6.3 檢查數據是否實時更新

1. **打開瀏覽器開發者工具**
   - Windows/Linux：按 `F12`
   - Mac：按 `Cmd + Option + I`

2. **進入「Network」標籤**

3. **刷新頁面**

4. **查看 API 調用**
   - 查找名稱包含 `api` 或 `trpc` 的請求
   - 確認狀態碼為 `200`（成功）

5. **檢查響應數據**
   - 點擊請求
   - 進入「Response」標籤
   - 應該看到 JSON 格式的市場數據

### 6.4 查看應用日誌

1. 在 Railway 項目中點擊「Logs」標籤
2. 搜索以下信息確認 API 正常工作：

**成功的日誌示例：**
```
[Finnhub] Successfully fetched VIX data: 15.39
[Finnhub] Successfully fetched Taiwan margin data
[Cache] Hit for key: vix_index
```

**失敗的日誌示例：**
```
[Finnhub] Error: Invalid API key
[API] Error fetching VIX: 401 Unauthorized
[Data] Using fallback data for VIX
```

---

## 常見問題

### Q1：我在哪裡找到「Variables」按鈕？

**A：** 
- 方法 1：在項目主頁面，頂部標籤中
- 方法 2：點擊左側的服務名稱，然後在右側面板中

### Q2：我不確定我的 Finnhub API 密鑰是否正確

**A：**
1. 訪問 https://finnhub.io/dashboard
2. 登錄您的帳戶
3. 複製顯示的 API 密鑰
4. 確保沒有多餘的空格

### Q3：環境變數添加後需要多久才能生效？

**A：**
- 需要重新部署應用
- 重新部署通常需要 2-3 分鐘
- 部署完成後立即生效

### Q4：我可以在 Railway 中看到環境變數的值嗎？

**A：**
- 出於安全考慮，Railway 隱藏了環境變數的值
- 您只能看到「●●●●●」
- 如果需要修改，可以刪除並重新添加

### Q5：如果我添加了錯誤的環境變數怎麼辦？

**A：**
1. 在「Variables」頁面找到錯誤的變數
2. 點擊「Delete」或「Remove」按鈕
3. 添加正確的變數
4. 重新部署應用

---

## 環境變數參考表

| 變數名 | 必需 | 說明 | 示例 |
|-------|------|------|------|
| `FINNHUB_API_KEY` | ✅ 是 | Finnhub API 密鑰 | `c123456789abcdef` |
| `JWT_SECRET` | ✅ 是 | 認證密鑰 | `550e8400e29b41d4a716446655440000` |
| `DATABASE_URL` | ❌ 否 | 數據庫連接 | `mysql://root:pass@host:3306/db` |
| `NODE_ENV` | ❌ 否 | 環境類型 | `production` |

---

## 完整的配置流程總結

1. ✅ 訪問 Railway 項目
2. ✅ 點擊「Variables」標籤
3. ✅ 添加 `FINNHUB_API_KEY`
4. ✅ 添加 `JWT_SECRET`
5. ✅ 添加 `DATABASE_URL`（如果需要）
6. ✅ 點擊「Redeploy」重新部署
7. ✅ 等待部署完成
8. ✅ 訪問應用 URL 驗證
9. ✅ 檢查瀏覽器開發者工具確認 API 調用成功
10. ✅ 查看應用日誌確認沒有錯誤

---

## 需要幫助？

如果您在配置環境變數時遇到問題：

1. **檢查 Railway 日誌** - 最詳細的錯誤信息
2. **驗證 API 密鑰** - 確保 Finnhub 密鑰有效
3. **重新部署** - 有時重新部署可以解決問題
4. **聯繫 Railway 支持** - https://railway.app/support

祝您配置順利！
