import axios from 'axios';

// Finnhub API 密鑰 - 使用免費層級
const FINNHUB_API_KEY = 'cqr3p0hr0000308jw8r0cqr3p0hr0000308jw8r0'; // 示例密鑰，實際部署時需要替換
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface QuoteData {
  c: number;  // 當前價格
  h: number;  // 最高價
  l: number;  // 最低價
  o: number;  // 開盤價
  pc: number; // 前收盤價
  t: number;  // 時間戳
}

interface HistoricalData {
  o: number[];  // 開盤價
  h: number[];  // 最高價
  l: number[];  // 最低價
  c: number[];  // 收盤價
  v: number[];  // 成交量
  t: number[];  // 時間戳
  s: string;    // 狀態
}

/**
 * 從 Finnhub 獲取實時報價
 */
export async function getFinnhubQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: symbol,
        token: FINNHUB_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data && response.data.c) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error(`[Finnhub] Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * 從 Finnhub 獲取歷史數據
 */
export async function getFinnhubCandles(
  symbol: string,
  resolution: string = 'D',
  from: number,
  to: number
): Promise<HistoricalData | null> {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/stock/candle`, {
      params: {
        symbol: symbol,
        resolution: resolution,
        from: from,
        to: to,
        token: FINNHUB_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data && response.data.c && response.data.c.length > 0) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error(`[Finnhub] Failed to fetch candles for ${symbol}:`, error);
    return null;
  }
}

/**
 * 計算 30 天的歷史數據
 */
export async function get30DayHistory(symbol: string): Promise<Array<{ day: string; value: number }> | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const data = await getFinnhubCandles(symbol, 'D', thirtyDaysAgo, now);

    if (!data || !data.c || data.c.length === 0) {
      return null;
    }

    return data.c.map((price, index) => {
      const date = new Date(data.t[index] * 1000);
      return {
        day: `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
          .getDate()
          .toString()
          .padStart(2, '0')}`,
        value: price,
      };
    });
  } catch (error) {
    console.error(`[Finnhub] Failed to get 30-day history for ${symbol}:`, error);
    return null;
  }
}

/**
 * 計算十日均線
 */
export function calculateMA10(data: Array<{ day: string; value: number }>): number | null {
  if (data.length < 10) {
    return null;
  }

  const last10 = data.slice(-10);
  const sum = last10.reduce((acc, item) => acc + item.value, 0);
  return Math.round((sum / 10) * 100) / 100;
}

/**
 * 獲取指標數據（包含歷史數據和十日均線）
 */
export async function getIndicatorData(symbol: string) {
  try {
    // 獲取實時報價
    const quote = await getFinnhubQuote(symbol);
    if (!quote) {
      return null;
    }

    // 獲取 30 天歷史數據
    const history = await get30DayHistory(symbol);

    // 計算十日均線
    const ma10 = history ? calculateMA10(history) : null;

    // 計算漲跌幅
    const change = quote.c - quote.pc;
    const changePercent = ((change / quote.pc) * 100).toFixed(2);

    return {
      current: quote.c,
      change: change.toFixed(2),
      changePercent: changePercent,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      prevClose: quote.pc,
      ma10: ma10,
      history: history,
      timestamp: new Date(quote.t * 1000).toISOString(),
    };
  } catch (error) {
    console.error(`[Finnhub] Failed to get indicator data for ${symbol}:`, error);
    return null;
  }
}
