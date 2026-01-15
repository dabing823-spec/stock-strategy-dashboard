import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

// 模擬市場數據 - 實際應用中應連接真實 API
const mockMarketData = {
  taiexIndex: {
    value: 30810.58,
    change: -0.42,
    monthlyMA: 29335,
    quarterlyMA: 28244,
    history: generateHistoricalData(30810, 500, 30),
  },
  vixIndex: {
    value: 15.39,
    change: -8.11,
    history: generateHistoricalData(15.39, 3, 30),
  },
  cnnFearGreedIndex: {
    value: 62,
    label: "貪婪",
    history: generateHistoricalData(62, 15, 30),
  },
  taiwanVixIndex: {
    value: 22.67,
    change: 0.18,
    history: generateHistoricalData(22.67, 2, 30),
  },
  marginBalance: {
    value: 3593,
    change: 8.5,
    unit: "億",
    history: generateHistoricalData(3593, 50, 30),
  },
  marginMaintainRate: {
    value: 170.23,
    change: 0,
    safetyLine: 160,
    breakLine: 130,
    history: generateHistoricalData(170.23, 8, 30),
  },
};

function generateHistoricalData(baseValue: number, volatility: number, days: number) {
  const data = [];
  let value = baseValue;
  for (let i = days - 1; i >= 0; i--) {
    const change = (Math.random() - 0.5) * volatility;
    value = Math.max(baseValue * 0.7, value + change);
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      day: (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0"),
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

export const marketDataRouter = router({
  /**
   * 獲取所有市場指標
   */
  getAllIndicators: publicProcedure.query(async () => {
    // 實際應用中，這裡應該調用真實的 API
    // 例如：Yahoo Finance API, Alpha Vantage, 台灣證交所 API 等
    return {
      taiexIndex: mockMarketData.taiexIndex,
      vixIndex: mockMarketData.vixIndex,
      cnnFearGreedIndex: mockMarketData.cnnFearGreedIndex,
      taiwanVixIndex: mockMarketData.taiwanVixIndex,
      marginBalance: mockMarketData.marginBalance,
      marginMaintainRate: mockMarketData.marginMaintainRate,
      lastUpdated: new Date(),
    };
  }),

  /**
   * 獲取單個指標的詳細數據
   */
  getIndicator: publicProcedure
    .input(
      z.enum([
        "taiexIndex",
        "vixIndex",
        "cnnFearGreedIndex",
        "taiwanVixIndex",
        "marginBalance",
        "marginMaintainRate",
      ])
    )
    .query(({ input }) => {
      const indicator = mockMarketData[input as keyof typeof mockMarketData];
      if (!indicator) {
        throw new Error(`Indicator ${input} not found`);
      }
      return {
        name: input,
        data: indicator,
        lastUpdated: new Date(),
      };
    }),

  /**
   * 獲取歷史數據用於圖表
   */
  getHistoricalData: publicProcedure
    .input(
      z.object({
        indicator: z.enum([
          "taiexIndex",
          "vixIndex",
          "cnnFearGreedIndex",
          "taiwanVixIndex",
          "marginBalance",
          "marginMaintainRate",
        ]),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(({ input }) => {
      const indicator = mockMarketData[input.indicator as keyof typeof mockMarketData];
      if (!indicator || !("history" in indicator)) {
        throw new Error(`Indicator ${input.indicator} not found`);
      }
      const history = (indicator as any).history;
      return history.slice(-input.days);
    }),

  /**
   * 獲取市場狀態分析
   */
  getMarketStatus: publicProcedure.query(async () => {
    const data = mockMarketData;

    // 分析正面信號
    const bullishSignals = [];
    if (data.taiexIndex.value > data.taiexIndex.monthlyMA) {
      bullishSignals.push("台股位階在月線以上");
    }
    if (data.taiexIndex.value > data.taiexIndex.quarterlyMA) {
      bullishSignals.push("台股位階在季線以上");
    }
    if (data.vixIndex.value < 20) {
      bullishSignals.push("VIX 指數低於 20，市場風險情緒穩定");
    }
    if (data.cnnFearGreedIndex.value > 50) {
      bullishSignals.push("CNN 恐慌指數顯示樂觀情緒");
    }
    if (data.marginMaintainRate.value > data.marginMaintainRate.safetyLine) {
      bullishSignals.push("融資維持率遠高於安全線");
    }

    // 分析風險信號
    const riskSignals = [];
    if (data.taiwanVixIndex.value > 20) {
      riskSignals.push("台灣 VIX 處於中性偏高");
    }
    if (data.marginMaintainRate.value < data.marginMaintainRate.safetyLine + 10) {
      riskSignals.push("融資維持率接近安全線");
    }
    if (data.marginBalance.value > 3500) {
      riskSignals.push("融資餘額處於高位");
    }

    return {
      bullishSignals,
      riskSignals,
      overallSentiment: bullishSignals.length > riskSignals.length ? "positive" : "cautious",
      lastUpdated: new Date(),
    };
  }),
});
