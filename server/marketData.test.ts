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
    expect(result.taiwanVix).toBeDefined();
    expect(result.marginBalance).toBeDefined();
    expect(result.marginMaintainRate).toBeDefined();
    expect(result.lastUpdated).toBeInstanceOf(Date);
  });

  it("should have valid TAIEX index data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();
    const taiex = result.taiexIndex;

    expect(taiex.name).toBe("台灣加權指數");
    expect(taiex.symbol).toBe("^TWII");
    expect(typeof taiex.value).toBe("number");
    expect(taiex.value).toBeGreaterThan(0);
  });

  it("should have valid VIX index data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();
    const vix = result.vixIndex;

    expect(vix.name).toBe("VIX 指數");
    expect(vix.symbol).toBe("^VIX");
    expect(typeof vix.value).toBe("number");
    expect(vix.value).toBeGreaterThan(0);
  });

  it("should have valid CNN Fear & Greed index data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();
    const cnn = result.cnnFearGreedIndex;

    expect(cnn).toBeDefined();
    expect(typeof cnn.value).toBe("number");
    expect(cnn.value).toBeGreaterThanOrEqual(0);
    expect(cnn.value).toBeLessThanOrEqual(100);
  });

  it("should have valid Taiwan VIX data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();
    const taiwanVix = result.taiwanVix;

    expect(taiwanVix).toBeDefined();
    expect(typeof taiwanVix.value).toBe("number");
    expect(taiwanVix.value).toBeGreaterThan(0);
  });

  it("should have valid margin balance data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();
    const margin = result.marginBalance;

    expect(margin).toBeDefined();
    expect(typeof margin.value).toBe("number");
    expect(margin.value).toBeGreaterThan(0);
  });

  it("should have valid margin maintain rate data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getAllIndicators();
    const rate = result.marginMaintainRate;

    expect(rate).toBeDefined();
    expect(typeof rate.value).toBe("number");
    expect(rate.value).toBeGreaterThan(100);
  });

  it("should retrieve market status analysis", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getMarketStatus();

    expect(result).toBeDefined();
    expect(result.marketTrend).toMatch(/bullish|bearish|unknown/);
    expect(result.volatility).toMatch(/low|high|unknown/);
    expect(result.overallSignal).toMatch(/positive|caution|unknown/);
  });

  it("should retrieve indicator detail for TAIEX", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getIndicatorDetail("台灣加權指數");

    expect(result).toBeDefined();
    expect(result.name).toBe("台灣加權指數");
    expect(typeof result.value).toBe("number");
  });

  it("should retrieve indicator detail for VIX", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketData.getIndicatorDetail("VIX 指數");

    expect(result).toBeDefined();
    expect(result.name).toBe("VIX 指數");
    expect(typeof result.value).toBe("number");
  });
});
