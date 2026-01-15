import axios from "axios";

interface MarketData {
  value: number;
  change: number;
  timestamp: Date;
}

interface CachedData {
  data: any;
  timestamp: number;
  ttl: number;
}

// 簡單的內存緩存
const cache = new Map<string, CachedData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * 使用 axios 從 Yahoo Finance 獲取股票數據
 */
async function fetchYahooFinanceData(symbol: string): Promise<any> {
  const cacheKey = `yahoo:${symbol}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Yahoo Finance API 端點
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail`;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.data || !response.data.quoteSummary) {
      throw new Error("Invalid response format");
    }

    const priceData = response.data.quoteSummary.result[0].price;
    const summaryData = response.data.quoteSummary.result[0].summaryDetail;

    const currentPrice = priceData.regularMarketPrice?.raw || priceData.currentPrice?.raw || 0;
    const previousClose = priceData.regularMarketPreviousClose?.raw || currentPrice;
    const change = ((currentPrice - previousClose) / previousClose) * 100;

    // 生成歷史數據（模擬）
    const history = generateHistoricalData(currentPrice, Math.abs(change) * 0.5, 90);

    const result = {
      value: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      high: summaryData?.fiftyTwoWeekHigh?.raw || currentPrice,
      low: summaryData?.fiftyTwoWeekLow?.raw || currentPrice,
      history: history,
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[Yahoo Finance] Error fetching ${symbol}:`, error);
    throw error;
  }
}

/**
 * 生成模擬歷史數據
 */
function generateHistoricalData(baseValue: number, volatility: number, days: number): any[] {
  const data = [];
  let value = baseValue;

  for (let i = days - 1; i >= 0; i--) {
    const change = (Math.random() - 0.5) * volatility;
    value = Math.max(baseValue * 0.8, value + change);
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      day: (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0"),
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
}

/**
 * 獲取台灣證交所融資餘額數據
 */
async function fetchTWSEMarginData(): Promise<any> {
  const cacheKey = "twse:margin";
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get("https://openapi.twse.com.tw/v1/exchangeReport/MI_MARGN", {
      timeout: 10000,
    });

    if (!response.data || !response.data.data || response.data.data.length === 0) {
      throw new Error("No TWSE margin data available");
    }

    // 取最新的一筆資料
    const latestData = response.data.data[response.data.data.length - 1];
    const previousData = response.data.data[response.data.data.length - 2] || latestData;

    // 解析數據格式：[日期, 融資(交易單位), 融資(金額), 融券(交易單位), 融券(金額), ...]
    const marginBalance = parseInt(latestData[2]) / 1000; // 轉換為億元
    const previousMarginBalance = parseInt(previousData[2]) / 1000;
    const marginChange = marginBalance - previousMarginBalance;

    const result = {
      marginBalance: Math.round(marginBalance * 100) / 100,
      marginChange: Math.round(marginChange * 100) / 100,
      timestamp: new Date(),
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[TWSE] Error fetching margin data:", error);
    throw error;
  }
}

/**
 * 獲取台灣加權指數
 */
export async function getTaiwanWeightedIndex(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("^TWII");
    return {
      name: "台灣加權指數",
      symbol: "^TWII",
      value: data.value,
      change: data.change,
      history: data.history,
      monthlyMA: data.history.length >= 20 ? calculateMA(data.history, 20) : data.value,
      quarterlyMA: data.history.length >= 60 ? calculateMA(data.history, 60) : data.value,
    };
  } catch (error) {
    console.error("[Data] Error fetching Taiwan Weighted Index:", error);
    throw error;
  }
}

/**
 * 獲取 VIX 指數
 */
export async function getVIXIndex(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("^VIX");
    return {
      name: "VIX 指數",
      symbol: "^VIX",
      value: data.value,
      change: data.change,
      history: data.history,
    };
  } catch (error) {
    console.error("[Data] Error fetching VIX:", error);
    throw error;
  }
}

/**
 * 獲取原油價格
 */
export async function getCrudeOilPrice(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("CL=F");
    return {
      name: "原油",
      symbol: "CL=F",
      value: data.value,
      change: data.change,
      unit: "USD/桶",
      history: data.history,
    };
  } catch (error) {
    console.error("[Data] Error fetching crude oil:", error);
    throw error;
  }
}

/**
 * 獲取黃金價格
 */
export async function getGoldPrice(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("GC=F");
    return {
      name: "黃金",
      symbol: "GC=F",
      value: data.value,
      change: data.change,
      unit: "USD/盎司",
      history: data.history,
    };
  } catch (error) {
    console.error("[Data] Error fetching gold:", error);
    throw error;
  }
}

/**
 * 獲取美元指數
 */
export async function getDollarIndex(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("DXY");
    return {
      name: "美元指數",
      symbol: "DXY",
      value: data.value,
      change: data.change,
      history: data.history,
    };
  } catch (error) {
    console.error("[Data] Error fetching dollar index:", error);
    throw error;
  }
}

/**
 * 獲取 10 年期公債殖利率
 */
export async function getUSTenYearBond(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("^TNX");
    return {
      name: "10年期公債",
      symbol: "^TNX",
      value: data.value,
      change: data.change,
      unit: "%",
      history: data.history,
    };
  } catch (error) {
    console.error("[Data] Error fetching US 10-year bond:", error);
    throw error;
  }
}

/**
 * 獲取台幣匯率
 */
export async function getTWDUSDRate(): Promise<any> {
  try {
    const data = await fetchYahooFinanceData("TWDUSD=X");
    return {
      name: "台幣匯率",
      symbol: "TWDUSD=X",
      value: data.value,
      change: data.change,
      unit: "TWD/USD",
      history: data.history,
    };
  } catch (error) {
    console.error("[Data] Error fetching TWD/USD rate:", error);
    throw error;
  }
}

/**
 * 獲取台灣融資餘額
 */
export async function getTaiwanMarginBalance(): Promise<any> {
  try {
    const data = await fetchTWSEMarginData();
    return {
      name: "融資餘額",
      symbol: "MARGIN_BALANCE",
      value: data.marginBalance,
      change: data.marginChange,
      unit: "億",
      history: generateHistoricalData(data.marginBalance, 50, 90),
    };
  } catch (error) {
    console.error("[Data] Error fetching Taiwan margin balance:", error);
    throw error;
  }
}

/**
 * 計算移動平均線
 */
function calculateMA(history: any[], period: number): number {
  if (history.length < period) {
    return history.reduce((sum, item) => sum + item.value, 0) / history.length;
  }
  const slice = history.slice(-period);
  return slice.reduce((sum, item) => sum + item.value, 0) / period;
}

/**
 * 計算 10 日均線
 */
export function calculateMA10(history: any[]): any[] {
  return history.map((point, index) => {
    const start = Math.max(0, index - 9);
    const slice = history.slice(start, index + 1);
    const ma10 = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
    return { ...point, ma10: Math.round(ma10 * 100) / 100 };
  });
}

/**
 * 清除所有緩存
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * 獲取緩存統計
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
