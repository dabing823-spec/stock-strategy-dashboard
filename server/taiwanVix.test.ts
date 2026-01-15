import { describe, it, expect, vi } from "vitest";
import { fetchTaiwanVix, getTaiwanVixWithFallback } from "./_core/taiwanVix";
import axios from "axios";

vi.mock("axios");

describe("Taiwan VIX", () => {
  it("should fetch Taiwan VIX data from WantGoo", async () => {
    const mockHtml = `
      <div>
        <span>VIXTWN 22.67</span>
        <span>0.04 0.18%</span>
      </div>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockHtml });

    const result = await fetchTaiwanVix();

    expect(result).toBeDefined();
    expect(result?.value).toBeGreaterThan(0);
    expect(result?.timestamp).toBeDefined();
  });

  it("should return fallback data when fetch fails", async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("Network error"));

    const result = await getTaiwanVixWithFallback();

    expect(result).toBeDefined();
    expect(result.value).toBe(22.67);
    expect(result.change).toBe(0.04);
    expect(result.changePercent).toBe(0.18);
  });

  it("should have valid Taiwan VIX value range", async () => {
    const result = await getTaiwanVixWithFallback();

    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThan(100); // VIX typically between 0-100
  });

  it("should return data with timestamp", async () => {
    const result = await getTaiwanVixWithFallback();

    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp)).toBeInstanceOf(Date);
  });
});
