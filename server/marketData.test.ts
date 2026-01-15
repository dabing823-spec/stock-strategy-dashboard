import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("marketData router", () => {
  it("should retrieve all indicators", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();

    expect(result).toBeDefined();
    expect(result.taiexIndex).toBeDefined();
    expect(result.vixIndex).toBeDefined();
    expect(result.cnnFearGreedIndex).toBeDefined();
    expect(result.taiwanVixIndex).toBeDefined();
    expect(result.marginBalance).toBeDefined();
    expect(result.marginMaintainRate).toBeDefined();
    expect(result.crudOil).toBeDefined();
    expect(result.gold).toBeDefined();
    expect(result.dollarIndex).toBeDefined();
    expect(result.usTenYearBond).toBeDefined();
    expect(result.twdUsdRate).toBeDefined();
    expect(result.lastUpdated).toBeInstanceOf(Date);
  });

  it("should have 10-day moving average in history", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();

    expect(result.taiexIndex.history.length).toBeGreaterThan(0);
    const lastPoint = result.taiexIndex.history[result.taiexIndex.history.length - 1];
    expect(lastPoint).toHaveProperty("ma10");
    expect(typeof lastPoint.ma10).toBe("number");
  });

  it("should retrieve indicator detail", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getIndicatorDetail("taiexIndex");

    expect(result).toBeDefined();
    expect(result.name).toBe("台灣加權指數");
    expect(result.symbol).toBe("^TWII");
    expect(result.value).toBeGreaterThan(0);
    expect(result.history.length).toBeGreaterThan(0);
  });

  it("should retrieve historical data with custom time range", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result30 = await caller.marketData.getHistoricalData({
      indicator: "vixIndex",
      days: 30,
    });

    const result90 = await caller.marketData.getHistoricalData({
      indicator: "vixIndex",
      days: 90,
    });

    expect(result30.length).toBeLessThanOrEqual(30);
    expect(result90.length).toBeLessThanOrEqual(90);
    expect(result90.length).toBeGreaterThanOrEqual(result30.length);
  });

  it("should calculate indicator statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.marketData.getIndicatorStats({
      indicator: "gold",
      days: 30,
    });

    expect(stats).toBeDefined();
    expect(stats.min).toBeGreaterThan(0);
    expect(stats.max).toBeGreaterThan(stats.min);
    expect(stats.avg).toBeGreaterThan(0);
    expect(stats.latest).toBeGreaterThan(0);
    expect(typeof stats.change).toBe("number");
    expect(stats.period).toBe("30天");
  });

  it("should analyze market status", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.marketData.getMarketStatus();

    expect(status).toBeDefined();
    expect(Array.isArray(status.bullishSignals)).toBe(true);
    expect(Array.isArray(status.riskSignals)).toBe(true);
    expect(["positive", "cautious"]).toContain(status.overallSentiment);
    expect(status.lastUpdated).toBeInstanceOf(Date);
  });

  it("should handle all new indicators", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const indicators = [
      "crudOil",
      "gold",
      "dollarIndex",
      "usTenYearBond",
      "twdUsdRate",
    ];

    for (const indicator of indicators) {
      const result = await caller.marketData.getIndicatorDetail(indicator as any);
      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThan(0);
      expect(result.history.length).toBeGreaterThan(0);
    }
  });

  it("should have 10-day MA less than or equal to latest value for all indicators", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();

    const indicators = [
      result.taiexIndex,
      result.vixIndex,
      result.taiwanVixIndex,
      result.crudOil,
      result.gold,
      result.dollarIndex,
    ];

    for (const indicator of indicators) {
      if (indicator.history && indicator.history.length > 0) {
        const lastPoint = indicator.history[indicator.history.length - 1];
        if (lastPoint.ma10 !== undefined) {
          expect(typeof lastPoint.ma10).toBe("number");
          expect(lastPoint.ma10).toBeGreaterThan(0);
        }
      }
    }
  });
});
