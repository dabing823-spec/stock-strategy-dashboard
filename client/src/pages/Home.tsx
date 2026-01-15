import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ComposedChart, Bar } from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface MarketIndicator {
  id: string;
  title: string;
  value: string;
  ma10?: string;
  change?: string;
  status: "bullish" | "bearish" | "neutral" | "warning";
  description: string;
  data: Array<{ day: string; value: number; ma10?: number }>;
}

export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [indicators, setIndicators] = useState<MarketIndicator[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: marketData, isLoading, refetch } = trpc.marketData.getAllIndicators.useQuery(undefined, {
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!marketData) return;

    const createIndicator = (
      id: string,
      title: string,
      data: any,
      getStatus: (data: any) => "bullish" | "bearish" | "neutral" | "warning",
      getDescription: (data: any) => string
    ): MarketIndicator => {
      const lastValue = data.history[data.history.length - 1];
      const ma10 = lastValue?.ma10 || lastValue?.value || data.value;

      return {
        id,
        title,
        value: Number(data.value).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ma10: Number(ma10).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: `${Number(data.change) >= 0 ? "+" : ""}${Number(data.change).toFixed(2)}${data.unit ? "" : "%"}`,
        status: getStatus(data),
        description: getDescription(data),
        data: (data.history || []).slice(-30),
      };
    };

    const newIndicators: MarketIndicator[] = [
      createIndicator(
        "taiexIndex",
        "台灣加權指數",
        marketData.taiexIndex,
        (d) => (d.value > d.monthlyMA ? "bullish" : "bearish"),
        (d) => `月線: ${d.monthlyMA.toLocaleString()}, 季線: ${d.quarterlyMA.toLocaleString()}`
      ),
      createIndicator(
        "vixIndex",
        "VIX 指數",
        marketData.vixIndex,
        (d) => (d.value < 20 ? "bullish" : d.value > 30 ? "bearish" : "neutral"),
        (d) => (d.value < 20 ? "市場風險情緒穩定" : "市場波動加大")
      ),
      createIndicator(
        "cnnFearGreedIndex",
        "CNN 恐慌指數",
        marketData.cnnFearGreedIndex,
        (d) => (d.value > 50 ? "bullish" : "bearish"),
        (d) => (d.value > 50 ? "投資者情緒樂觀" : "投資者情緒悲觀")
      ),
      createIndicator(
        "taiwanVixIndex",
        "台灣 VIX 指數",
        marketData.taiwanVixIndex,
        (d) => (d.value > 20 ? "warning" : "neutral"),
        (d) => (d.value > 20 ? "中性偏高" : "中性偏低")
      ),
      createIndicator(
        "marginBalance",
        "融資餘額",
        { ...marketData.marginBalance, change: marketData.marginBalance.change || 0 },
        () => "neutral",
        () => "上市融資餘額"
      ),
      createIndicator(
        "marginMaintainRate",
        "融資維持率",
        { ...marketData.marginMaintainRate, change: marketData.marginMaintainRate.change || 0 },
        (d) => (d.value > d.safetyLine ? "bullish" : "warning"),
        (d) => `安全線: ${d.safetyLine}%, 斷頭線: ${d.breakLine}%`
      ),
      createIndicator(
        "crudOil",
        "原油",
        marketData.crudOil,
        (d) => (d.change > 0 ? "bullish" : "bearish"),
        () => "WTI 原油期貨"
      ),
      createIndicator(
        "gold",
        "黃金",
        marketData.gold,
        (d) => (d.value > 2000 ? "bullish" : "neutral"),
        () => "COMEX 黃金期貨"
      ),
      createIndicator(
        "dollarIndex",
        "美元指數",
        marketData.dollarIndex,
        (d) => (d.value > 103 ? "warning" : "neutral"),
        () => "美元強弱指標"
      ),
      createIndicator(
        "usTenYearBond",
        "10年期公債",
        marketData.usTenYearBond,
        (d) => (d.value > 4 ? "warning" : "neutral"),
        () => "美國 10 年期公債殖利率"
      ),
      createIndicator(
        "twdUsdRate",
        "台幣匯率",
        marketData.twdUsdRate,
        (d) => (d.value > 32 ? "warning" : "neutral"),
        () => "新台幣兌美元匯率"
      ),
    ];

    setIndicators(newIndicators);
    setLastUpdated(marketData.lastUpdated);
  }, [marketData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleCardClick = (indicatorId: string) => {
    setLocation(`/indicator?id=${indicatorId}`);
  };

  const getStatusIcon = (status: string) => {
    if (status === "bullish") return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (status === "bearish") return <TrendingDown className="w-5 h-5 text-red-400" />;
    if (status === "warning") return <AlertCircle className="w-5 h-5 text-amber-400" />;
    return <CheckCircle2 className="w-5 h-5 text-slate-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "bullish") return "from-emerald-900/20 to-emerald-900/5 border-emerald-700/30";
    if (status === "bearish") return "from-red-900/20 to-red-900/5 border-red-700/30";
    if (status === "warning") return "from-amber-900/20 to-amber-900/5 border-amber-700/30";
    return "from-slate-800/20 to-slate-800/5 border-slate-700/30";
  };

  const getLineColor = (status: string) => {
    if (status === "bullish") return "#10b981";
    if (status === "bearish") return "#ef4444";
    return "#94a3b8";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-slate-800/50 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>股票操作戰略儀表板</h1>
                <p className="text-slate-400 mt-2">實時市場指標監控與策略分析</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">最後更新</p>
                <p className="text-lg font-semibold text-slate-200">
                  {lastUpdated ? new Date(lastUpdated).toLocaleString("zh-TW") : "2026/01/15"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="mt-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "更新中..." : "刷新"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>市場概況</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {indicators.map((indicator) => (
                <Card
                  key={indicator.id}
                  onClick={() => handleCardClick(indicator.id)}
                  className={`bg-gradient-to-br ${getStatusColor(indicator.status)} border backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 cursor-pointer group flex flex-col`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-semibold text-slate-200">{indicator.title}</CardTitle>
                      <div className="flex gap-2">
                        <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">{getStatusIcon(indicator.status)}</div>
                        <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-3">
                      <p className="text-3xl font-bold text-white" style={{ fontFamily: "Roboto Mono, monospace" }}>{indicator.value}</p>
                      {indicator.ma10 && <p className="text-xs text-slate-500 mt-1">10日均線: {indicator.ma10}</p>}
                      {indicator.change && (
                        <p
                          className={`text-sm mt-1 font-semibold ${
                            indicator.status === "bullish"
                              ? "text-emerald-400"
                              : indicator.status === "bearish"
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}
                        >
                          {indicator.status === "bullish" && "↑ "}
                          {indicator.status === "bearish" && "↓ "}
                          {indicator.change}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{indicator.description}</p>
                    <div className="mt-auto">
                      <p className="text-xs text-slate-500 mb-2">30 天走勢</p>
                      {indicator.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={60}>
                          <ComposedChart data={indicator.data}>
                            <XAxis dataKey="day" hide />
                            <YAxis hide domain={["dataMin", "dataMax"]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "6px" }}
                              labelStyle={{ color: "#e2e8f0" }}
                              formatter={(value: any) =>
                                typeof value === "number"
                                  ? value.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : value
                              }
                            />
                            <Bar dataKey="value" fill={getLineColor(indicator.status)} opacity={0.5} />
                            <Line type="monotone" dataKey="ma10" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-15 bg-slate-800/30 rounded animate-pulse" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-lg p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>策略分析</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  正面信號
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>✓ 台股位階在月線與季線以上，多頭趨勢明確</li>
                  <li>✓ VIX 指數低於 20，市場風險情緒穩定</li>
                  <li>✓ CNN 恐慌指數 62，投資者情緒樂觀</li>
                  <li>✓ 融資維持率 170%，市場槓桿穩健</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  監控項目
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>⚠ 台灣 VIX 22.67，需留意波動加大</li>
                  <li>⚠ 融資餘額 3,593 億，監控過度槓桿</li>
                  <li>⚠ 融資維持率跌破 160% 需警惕</li>
                  <li>⚠ 關注美股走勢與 VIX 變化</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800/50 text-center text-slate-400 text-sm">
            <p>此儀表板數據來自公開市場信息，僅供參考。投資決策應基於個人風險承受能力與充分研究。</p>
            <p className="mt-2">© 2026 Stock Strategy Dashboard | 點擊任一卡片查看詳細分析</p>
          </div>
        </main>
      </div>
    </div>
  );
}
