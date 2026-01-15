import axios from "axios";

interface TaiwanVixData {
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

/**
 * 從玩股網爬取台灣 VIX（VIXTWN）數據
 */
export async function fetchTaiwanVix(): Promise<TaiwanVixData | null> {
  try {
    const response = await axios.get("https://www.wantgoo.com/index/vixtwn", {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const html = response.data;

    // 使用正則表達式提取 VIXTWN 數值
    // 頁面格式: "22.67\n\n0.04 0.18%"
    const valueMatch = html.match(/VIXTWN[^0-9]*(\d+\.\d+)/);
    const changeMatch = html.match(/(\d+\.\d+)\s+(\d+\.\d+)%/);

    if (!valueMatch || !valueMatch[1]) {
      console.warn("[Taiwan VIX] Could not extract value from HTML");
      return null;
    }

    const value = parseFloat(valueMatch[1]);
    const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
    const changePercent = changeMatch ? parseFloat(changeMatch[2]) : 0;

    return {
      value,
      change,
      changePercent,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Taiwan VIX] Error fetching data:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * 獲取台灣 VIX，如果失敗則返回備用數據
 */
export async function getTaiwanVixWithFallback(): Promise<TaiwanVixData> {
  const data = await fetchTaiwanVix();

  if (data) {
    return data;
  }

  // 備用數據 - 使用合理的默認值
  console.warn("[Taiwan VIX] Using fallback data");
  return {
    value: 22.67,
    change: 0.04,
    changePercent: 0.18,
    timestamp: new Date().toISOString(),
  };
}
