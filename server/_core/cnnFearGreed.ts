import axios from "axios";

interface FearGreedData {
  value: number;
  sentiment: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  timestamp: string;
}

/**
 * 從 CNN Fear & Greed Index 頁面抓取最新數據
 * 使用簡單的 HTML 解析方式提取數值
 */
export async function fetchCNNFearGreed(): Promise<FearGreedData | null> {
  try {
    const response = await axios.get("https://www.cnn.com/markets/fear-and-greed", {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const html = response.data;

    // 使用正則表達式提取恐慌指數數值
    // CNN 頁面中的格式: "Fear & Greed Index 62 Greedis driving the US market"
    const valueMatch = html.match(/Fear & Greed Index\s+(\d+)\s+([A-Za-z\s]+)driving/);

    if (!valueMatch || !valueMatch[1]) {
      console.warn("[CNN Fear & Greed] Could not extract value from HTML");
      return null;
    }

    const value = parseInt(valueMatch[1], 10);

    // 根據數值判斷情緒
    let sentiment: FearGreedData["sentiment"];
    if (value <= 25) {
      sentiment = "Extreme Fear";
    } else if (value <= 45) {
      sentiment = "Fear";
    } else if (value <= 55) {
      sentiment = "Neutral";
    } else if (value <= 75) {
      sentiment = "Greed";
    } else {
      sentiment = "Extreme Greed";
    }

    return {
      value,
      sentiment,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[CNN Fear & Greed] Error fetching data:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * 獲取 CNN 恐慌指數，如果失敗則返回備用數據
 */
export async function getCNNFearGreedWithFallback(): Promise<FearGreedData> {
  const data = await fetchCNNFearGreed();

  if (data) {
    return data;
  }

  // 備用數據 - 使用合理的默認值
  console.warn("[CNN Fear & Greed] Using fallback data");
  return {
    value: 62,
    sentiment: "Greed",
    timestamp: new Date().toISOString(),
  };
}
