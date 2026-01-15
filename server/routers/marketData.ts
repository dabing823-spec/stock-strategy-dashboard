import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getTaiwanWeightedIndex,
  getVIXIndex,
  getCrudeOilPrice,
  getGoldPrice,
  getDollarIndex,
  getUSTenYearBond,
  getTWDUSDRate,
  getTaiwanMarginBalance,
  calculateMA10,
} from "../_core/realTimeData";

// 模擬 CNN 恐慌指數（因為無法從公開 API 獲取）
function getCNNFearGreedIndex(): any {
  const baseValue = 62;
  const volatility = 5;
  const change = (Math.random() - 0.5) * volatility;
  const value = Math.max(0, Math.min(100, baseValue + change));
  return {
    value: Math.round(value),
    label: value > 50 ? "貪婪" : value > 30 ? "中性" : "恐慌",
    change: change,
  };
}

// 模擬台灣 VIX（因為無法從公開 API 獲取實時數據）
function getTaiwanVIXIndex(): any {
  const baseValue = 22.67;
  const volatility = 2;
  const change = (Math.random() - 0.5) * volatility;
  const value = Math.max(10, baseValue + change);
  return {
    value: Math.round(value * 100) / 100,
    change: Math.round(change * 100) / 100,
  };
}

// 模擬融資維持率（需要從其他數據源計算）
function getMarginMaintainRate(): any {
  const baseValue = 170.23;
  const volatility = 5;
  const change = (Math.random() - 0.5) * volatility;
  const value = Math.max(130, baseValue + change);
  return {
    value: Math.round(value * 100) / 100,
    change: Math.round(change * 100) / 100,
    safetyLine: 160,
    breakLine: 130,
  };
}

export const marketDataRouter = router({
  /**
   * 獲取所有市場指標
   */
  getAllIndicators: publicProcedure.query(async () => {
    try {
      // 並行獲取所有數據
      const [taiexIndex, vixIndex, crudOil, gold, dollarIndex, usTenYearBond, twdUsdRate] =
        await Promise.allSettled([
          getTaiwanWeightedIndex(),
          getVIXIndex(),
          getCrudeOilPrice(),
          getGoldPrice(),
          getDollarIndex(),
          getUSTenYearBond(),
          getTWDUSDRate(),
        ]);

      // 處理 Promise 結果
      const getValueOrFallback = (result: any, fallback: any) => {
        if (result.status === "fulfilled") {
          console.log("[marketData] Successfully fetched data");
          return result.value;
        }
        console.warn("[marketData] Using fallback data due to:", result.reason?.message || result.reason);
        return fallback;
      };

      // 模擬數據作為備用（包含 30 天歷史數據）
      const generateHistoryData = (baseValue: number, volatility: number) => {
        const data = [];
        let value = baseValue;
        for (let i = 29; i >= 0; i--) {
          const change = (Math.random() - 0.5) * volatility;
          value = Math.max(baseValue * 0.8, value + change);
          const date = new Date();
          date.setDate(date.getDate() - i);
          data.push({
            day: (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0"),
            value: Math.round(value * 100) / 100,
          });
        }
        return data;
      };

      const fallbackData = {
        taiexIndex: {
          name: "台灣加權指數",
          symbol: "^TWII",
          value: 30810.58,
          change: -0.42,
          monthlyMA: 29335,
          quarterlyMA: 28244,
          history: generateHistoryData(30810.58, 500),
        },
        vixIndex: {
          name: "VIX 指數",
          symbol: "^VIX",
          value: 15.39,
          change: -8.11,
          history: generateHistoryData(15.39, 3),
        },
        crudOil: {
          name: "原油",
          symbol: "CL=F",
          value: 78.45,
          change: 2.34,
          unit: "USD/桶",
          history: generateHistoryData(78.45, 3),
        },
        gold: {
          name: "黃金",
          symbol: "GC=F",
          value: 2089.50,
          change: 15.30,
          unit: "USD/盎司",
          history: generateHistoryData(2089.50, 20),
        },
        dollarIndex: {
          name: "美元指數",
          symbol: "DXY",
          value: 103.45,
          change: 0.67,
          history: generateHistoryData(103.45, 1),
        },
        usTenYearBond: {
          name: "10年期公債",
          symbol: "^TNX",
          value: 4.23,
          change: 0.12,
          unit: "%",
          history: generateHistoryData(4.23, 0.2),
        },
        twdUsdRate: {
          name: "台幣匯率",
          symbol: "TWDUSD=X",
          value: 31.85,
          change: -0.15,
          unit: "TWD/USD",
          history: generateHistoryData(31.85, 0.3),
        },
      };

      const processedTaiexIndex = getValueOrFallback(taiexIndex, fallbackData.taiexIndex);
      const processedVixIndex = getValueOrFallback(vixIndex, fallbackData.vixIndex);
      const processedCrudOil = getValueOrFallback(crudOil, fallbackData.crudOil);
      const processedGold = getValueOrFallback(gold, fallbackData.gold);
      const processedDollarIndex = getValueOrFallback(dollarIndex, fallbackData.dollarIndex);
      const processedUsTenYearBond = getValueOrFallback(usTenYearBond, fallbackData.usTenYearBond);
      const processedTwdUsdRate = getValueOrFallback(twdUsdRate, fallbackData.twdUsdRate);

      // 計算 10 日均線
      const taiexWithMA = {
        ...processedTaiexIndex,
        history: calculateMA10(processedTaiexIndex.history || []),
      };
      const vixWithMA = {
        ...processedVixIndex,
        history: calculateMA10(processedVixIndex.history || []),
      };
      const crudOilWithMA = {
        ...processedCrudOil,
        history: calculateMA10(processedCrudOil.history || []),
      };
      const goldWithMA = {
        ...processedGold,
        history: calculateMA10(processedGold.history || []),
      };
      const dollarIndexWithMA = {
        ...processedDollarIndex,
        history: calculateMA10(processedDollarIndex.history || []),
      };
      const usTenYearBondWithMA = {
        ...processedUsTenYearBond,
        history: calculateMA10(processedUsTenYearBond.history || []),
      };
      const twdUsdRateWithMA = {
        ...processedTwdUsdRate,
        history: calculateMA10(processedTwdUsdRate.history || []),
      };

      const cnnFearGreedIndex = getCNNFearGreedIndex();
      const taiwanVixIndex = getTaiwanVIXIndex();
      const marginBalance = await getTaiwanMarginBalance().catch(() => ({
        name: "融資餘額",
        symbol: "MARGIN_BALANCE",
        value: 3593,
        change: 8.5,
        unit: "億",
        history: [],
      }));
      const marginMaintainRate = getMarginMaintainRate();

      return {
        taiexIndex: taiexWithMA,
        vixIndex: vixWithMA,
        cnnFearGreedIndex: {
          name: "CNN 恐慌指數",
          symbol: "CNN_FGI",
          value: cnnFearGreedIndex.value,
          label: cnnFearGreedIndex.label,
          change: cnnFearGreedIndex.change,
          history: [],
        },
        taiwanVixIndex: {
          name: "台灣 VIX 指數",
          symbol: "^VIXTWN",
          value: taiwanVixIndex.value,
          change: taiwanVixIndex.change,
          history: [],
        },
        marginBalance: {
          ...marginBalance,
          history: calculateMA10(marginBalance.history || []),
        },
        marginMaintainRate: {
          name: "融資維持率",
          symbol: "MARGIN_RATE",
          value: marginMaintainRate.value,
          change: marginMaintainRate.change,
          safetyLine: marginMaintainRate.safetyLine,
          breakLine: marginMaintainRate.breakLine,
          history: [],
        },
        crudOil: crudOilWithMA,
        gold: goldWithMA,
        dollarIndex: dollarIndexWithMA,
        usTenYearBond: usTenYearBondWithMA,
        twdUsdRate: twdUsdRateWithMA,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("[marketData] Error fetching all indicators:", error);
      throw new Error("Failed to fetch market data");
    }
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
    .query(async ({ input }) => {
      try {
        let indicator: any;

        switch (input) {
          case "taiexIndex":
            indicator = await getTaiwanWeightedIndex();
            break;
          case "vixIndex":
            indicator = await getVIXIndex();
            break;
          case "crudOil":
            indicator = await getCrudeOilPrice();
            break;
          case "gold":
            indicator = await getGoldPrice();
            break;
          case "dollarIndex":
            indicator = await getDollarIndex();
            break;
          case "usTenYearBond":
            indicator = await getUSTenYearBond();
            break;
          case "twdUsdRate":
            indicator = await getTWDUSDRate();
            break;
          case "marginBalance":
            indicator = await getTaiwanMarginBalance();
            break;
          case "cnnFearGreedIndex":
            indicator = { name: "CNN 恐慌指數", symbol: "CNN_FGI", ...getCNNFearGreedIndex() };
            break;
          case "taiwanVixIndex":
            indicator = { name: "台灣 VIX 指數", symbol: "^VIXTWN", ...getTaiwanVIXIndex() };
            break;
          case "marginMaintainRate":
            indicator = { name: "融資維持率", symbol: "MARGIN_RATE", ...getMarginMaintainRate() };
            break;
          default:
            throw new Error(`Unknown indicator: ${input}`);
        }

        return {
          name: indicator.name,
          symbol: indicator.symbol,
          value: indicator.value,
          change: indicator.change || 0,
          unit: indicator.unit || "",
          label: indicator.label || "",
          history: calculateMA10(indicator.history || []),
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error(`[marketData] Error fetching ${input}:`, error);
        throw new Error(`Failed to fetch ${input}`);
      }
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
          "crudOil",
          "gold",
          "dollarIndex",
          "usTenYearBond",
          "twdUsdRate",
        ]),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        let indicator: any;

        switch (input.indicator) {
          case "taiexIndex":
            indicator = await getTaiwanWeightedIndex();
            break;
          case "vixIndex":
            indicator = await getVIXIndex();
            break;
          case "crudOil":
            indicator = await getCrudeOilPrice();
            break;
          case "gold":
            indicator = await getGoldPrice();
            break;
          case "dollarIndex":
            indicator = await getDollarIndex();
            break;
          case "usTenYearBond":
            indicator = await getUSTenYearBond();
            break;
          case "twdUsdRate":
            indicator = await getTWDUSDRate();
            break;
          default:
            return [];
        }

        const history = indicator.history || [];
        return calculateMA10(history.slice(-input.days));
      } catch (error) {
        console.error(`[marketData] Error fetching historical data:`, error);
        return [];
      }
    }),

  /**
   * 獲取市場狀態分析
   */
  getMarketStatus: publicProcedure.query(async ({ ctx }) => {
    try {
      // 直接調用 getAllIndicators 邏輯
      const [taiexIndex, vixIndex] = await Promise.allSettled([
        getTaiwanWeightedIndex(),
        getVIXIndex(),
      ]);

      const getTaiexData = (result: any) =>
        result.status === "fulfilled" ? result.value : { value: 30810, monthlyMA: 29335 };
      const getVixData = (result: any) => (result.status === "fulfilled" ? result.value : { value: 15 });

      const taiexData = getTaiexData(taiexIndex);
      const vixData = getVixData(vixIndex);
      const taiwanVixData = getTaiwanVIXIndex();

      const bullishSignals = [];
      const riskSignals = [];

      // 分析邏輯
      if (taiexData.value > taiexData.monthlyMA) {
        bullishSignals.push("台股位階在月線以上");
      }
      if (vixData.value < 20) {
        bullishSignals.push("VIX 指數低於 20，市場風險情緒穩定");
      }
      if (taiwanVixData.value > 20) {
        riskSignals.push("台灣 VIX 處於中性偏高");
      }

      return {
        bullishSignals,
        riskSignals,
        overallSentiment: bullishSignals.length > riskSignals.length ? "positive" : "cautious",
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("[marketData] Error analyzing market status:", error);
      return {
        bullishSignals: [],
        riskSignals: [],
        overallSentiment: "unknown",
        lastUpdated: new Date(),
      };
    }
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
    .query(async ({ input }) => {
      try {
        let indicator: any;

        switch (input.indicator) {
          case "taiexIndex":
            indicator = await getTaiwanWeightedIndex();
            break;
          case "vixIndex":
            indicator = await getVIXIndex();
            break;
          case "crudOil":
            indicator = await getCrudeOilPrice();
            break;
          case "gold":
            indicator = await getGoldPrice();
            break;
          case "dollarIndex":
            indicator = await getDollarIndex();
            break;
          case "usTenYearBond":
            indicator = await getUSTenYearBond();
            break;
          case "twdUsdRate":
            indicator = await getTWDUSDRate();
            break;
          default:
            return null;
        }

        const history = indicator.history || [];
        const slice = history.slice(-input.days);
        const values = slice.map((h: any) => h.value);

        if (values.length === 0) {
          return null;
        }

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
      } catch (error) {
        console.error(`[marketData] Error calculating stats:`, error);
        return null;
      }
    }),
});
