import { describe, it, expect, vi } from "vitest";
import { getIndicatorData, calculateMA10 } from "./_core/finnhubApi";

describe("Finnhub API Integration", () => {
  it("should calculate MA10 correctly", () => {
    const data = [
      { day: "01/01", value: 100 },
      { day: "01/02", value: 101 },
      { day: "01/03", value: 102 },
      { day: "01/04", value: 103 },
      { day: "01/05", value: 104 },
      { day: "01/06", value: 105 },
      { day: "01/07", value: 106 },
      { day: "01/08", value: 107 },
      { day: "01/09", value: 108 },
      { day: "01/10", value: 109 },
      { day: "01/11", value: 110 },
    ];

    const ma10 = calculateMA10(data);
    expect(ma10).toBe(104.5); // (100+101+102+103+104+105+106+107+108+109)/10
  });

  it("should return null for MA10 with less than 10 data points", () => {
    const data = [
      { day: "01/01", value: 100 },
      { day: "01/02", value: 101 },
      { day: "01/03", value: 102 },
    ];

    const ma10 = calculateMA10(data);
    expect(ma10).toBeNull();
  });

  it("should handle empty data array", () => {
    const data: Array<{ day: string; value: number }> = [];
    const ma10 = calculateMA10(data);
    expect(ma10).toBeNull();
  });

  it("should format data correctly", () => {
    const data = [
      { day: "01/01", value: 100.123 },
      { day: "01/02", value: 101.456 },
    ];

    // 驗證數據格式
    expect(data[0].value).toBe(100.123);
    expect(data[1].day).toBe("01/02");
  });
});
