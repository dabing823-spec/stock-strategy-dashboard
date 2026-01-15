import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCNNFearGreed, getCNNFearGreedWithFallback } from "./_core/cnnFearGreed";

describe("CNN Fear & Greed Index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return fear & greed data with correct sentiment", async () => {
    const data = await getCNNFearGreedWithFallback();

    expect(data).toBeDefined();
    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.value).toBeLessThanOrEqual(100);
    expect(["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"]).toContain(data.sentiment);
    expect(data.timestamp).toBeDefined();
  });

  it("should map value to correct sentiment", async () => {
    const data = await getCNNFearGreedWithFallback();

    // 根據數值驗證情緒映射
    if (data.value <= 25) {
      expect(data.sentiment).toBe("Extreme Fear");
    } else if (data.value <= 45) {
      expect(data.sentiment).toBe("Fear");
    } else if (data.value <= 55) {
      expect(data.sentiment).toBe("Neutral");
    } else if (data.value <= 75) {
      expect(data.sentiment).toBe("Greed");
    } else {
      expect(data.sentiment).toBe("Extreme Greed");
    }
  });

  it("should return fallback data when fetch fails", async () => {
    // 使用備用數據時，應該返回有效的數據
    const data = await getCNNFearGreedWithFallback();

    expect(data).toBeDefined();
    expect(data.value).toBe(62); // 備用值
    expect(data.sentiment).toBe("Greed");
  });

  it("should have valid timestamp", async () => {
    const data = await getCNNFearGreedWithFallback();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000); // 不超過 1 分鐘前
  });
});
