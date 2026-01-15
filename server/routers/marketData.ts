import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

interface HistoricalDataPoint {
  date: string;
  day: string;
  value: number;
  ma10?: number;
}

function calculateMA10(data: HistoricalDataPoint[]): HistoricalDataPoint[] {
  return data.map((point, index) => {
    const start = Math.max(0, index - 9);
    const slice = data.slice(start, index + 1);
    const ma10 = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
    return { ...point, ma10: Math.round(ma10 * 100) / 100 };
  });
}

function generateHistoricalData(baseValue: number, volatility: number, days: number): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
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
  return calculateMA10(data);
}

// 模擬市場數據 - 實際應用中應連接真實 API
const mockMarketData = {
  taiexIndex: {
    name: "台灣加權指數",
    symbol: "^TWII",
    value: 30810.58,
    change: -0.42,
    monthlyMA: 29335,
    quarterlyMA: 28244,
    history: generateHistoricalData(30810, 500, 90),
  },
  vixIndex: {
    name: "VIX 指數",
    symbol: "^VIX",
    value: 15.39,
    change: -8.11,
    history: generateHistoricalData(15.39, 3, 90),
  },
  cnnFearGreedIndex: {
    name: "CNN 恐慌指數",
    symbol: "CNN_FGI",
    value: 62,
    label: "貪婪",
    history: generateHistoricalData(62, 15, 90),
  },
  taiwanVixIndex: {
    name: "台灣 VIX 指數",
    symbol: "^VIXTWN",
    value: 22.67,
    change: 0.18,
    history: generateHistoricalData(22.67, 2, 90),
  },
  marginBalance: {
    name: "融資餘額",
    symbol: "MARGIN_BALANCE",
    value: 3593,
    change: 8.5,
    unit: "億",
    history: generateHistoricalData(3593, 50, 90),
  },
  marginMaintainRate: {
    name: "融資維持率",
    symbol: "MARGIN_RATE",
    value: 170.23,
    change: 0,
    safetyLine: 160,
    breakLine: 130,
    history: generateHistoricalData(170.23, 8, 90),
  },
  crudOil: {
    name: "原油",
    symbol: "CL=F",
    value: 78.45,
    change: 2.34,
    unit: "USD/桶",
    history: generateHistoricalData(78.45, 3, 90),
  },
  gold: {
    name: "黃金",
    symbol: "GC=F",
    value: 2089.50,
    change: 15.30,
    unit: "USD/盎司",
    history: generateHistoricalData(2089.50, 20, 90),
  },
  dollarIndex: {
    name: "美元指數",
    symbol: "DXY",
    value: 103.45,
    change: 0.67,
    history: generateHistoricalData(103.45, 1, 90),
  },
  usTenYearBond: {
    name: "10年期公債",
    symbol: "^TNX",
    value: 4.23,
    change: 0.12,
    unit: "%",
    history: generateHistoricalData(4.23, 0.2, 90),
  },
  twdUsdRate: {
    name: "台幣匯率",
    symbol: "TWDUSD",
    value: 31.85,
    change: -0.15,
    unit: "TWD/USD",
    history: generateHistoricalData(31.85, 0.3, 90),
  },
};

export const marketDataRouter = router({
  /**
   * 獲取所有市場指標
   */
  getAllIndicators: publicProcedure.query(async () => {
    return {
      taiexIndex: mockMarketData.taiexIndex,
      vixIndex: mockMarketData.vixIndex,
      cnnFearGreedIndex: mockMarketData.cnnFearGreedIndex,
      taiwanVixIndex: mockMarketData.taiwanVixIndex,
      marginBalance: mockMarketData.marginBalance,
      marginMaintainRate: mockMarketData.marginMaintainRate,
      crudOil: mockMarketData.crudOil,
      gold: mockMarketData.gold,
      dollarIndex: mockMarketData.dollarIndex,
      usTenYearBond: mockMarketData.usTenYearBond,
      twdUsdRate: mockMarketData.twdUsdRate,
      lastUpdated: new Date(),
    };
  }),

  /**
   * 獲取單個指標的詳細數據
   */
  getIndicatorDetail: publicProcedure
    .input(
      z.enum([
        "taiexIndex",
        "vixIndex",
        "cnnFearGreedIndex",
        "taiwanVixIndex",
        "marginBalance",
        "marginMaintainRate",
        "crudOil",
        "gold",
        "dollarIndex",
        "usTenYearBond",
        "twdUsdRate",
      ])
    )
    .query(({ input }) => {
      const indicator = mockMarketData[input as keyof typeof mockMarketData];
      if (!indicator) {
        throw new Error(`Indicator ${input} not found`);
      }
      return {
        name: (indicator as any).name,
        symbol: (indicator as any).symbol,
        value: (indicator as any).value,
        change: (indicator as any).change,
        unit: (indicator as any).unit || "",
        label: (indicator as any).label || "",
        history: (indicator as any).history,
        lastUpdated: new Date(),
      };
    }),

  /**
   * 獲取歷史數據用於圖表（支持不同時間範圍）
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
          "crudOil",
          "gold",
          "dollarIndex",
          "usTenYearBond",
          "twdUsdRate",
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
    if (data.gold.value > 2000) {
      bullishSignals.push("黃金價格處於高位，避險情緒提升");
    }

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
    if (data.dollarIndex.value > 103) {
      riskSignals.push("美元指數強勢，新興市場承壓");
    }

    return {
      bullishSignals,
      riskSignals,
      overallSentiment: bullishSignals.length > riskSignals.length ? "positive" : "cautious",
      lastUpdated: new Date(),
    };
  }),

  /**
   * 獲取指標統計數據
   */
  getIndicatorStats: publicProcedure
    .input(
      z.object({
        indicator: z.enum([
          "taiexIndex",
          "vixIndex",
          "cnnFearGreedIndex",
          "taiwanVixIndex",
          "marginBalance",
          "marginMaintainRate",
          "crudOil",
          "gold",
          "dollarIndex",
          "usTenYearBond",
          "twdUsdRate",
        ]),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(({ input }) => {
      const indicator = mockMarketData[input.indicator as keyof typeof mockMarketData];
      if (!indicator || !("history" in indicator)) {
        throw new Error(`Indicator ${input.indicator} not found`);
      }

      const history = (indicator as any).history.slice(-input.days);
      const values = history.map((h: any) => h.value);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      const latest = values[values.length - 1];
      const change = ((latest - values[0]) / values[0]) * 100;

      return {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        latest: Math.round(latest * 100) / 100,
        change: Math.round(change * 100) / 100,
        period: `${input.days}天`,
      };
    }),
});
