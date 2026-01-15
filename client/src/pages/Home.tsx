import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface MarketIndicator {
  title: string;
  value: string;
  change?: string;
  status: "bullish" | "bearish" | "neutral" | "warning";
  description: string;
  data: Array<{ day: string; value: number; ma10?: number }>;
  source: string;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { data: allIndicators, isLoading } = trpc.marketData.getAllIndicators.useQuery();
  const [indicators, setIndicators] = useState<MarketIndicator[]>([]);

  useEffect(() => {
    if (allIndicators) {
      const newIndicators: MarketIndicator[] = [
        {
          title: "台灣加權指數",
          value: allIndicators.taiexIndex.value.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          change: `${allIndicators.taiexIndex.change > 0 ? "+" : ""}${allIndicators.taiexIndex.change.toFixed(2)}%`,
          status:
            allIndicators.taiexIndex.value > allIndicators.taiexIndex.monthlyMA ? "bullish" : "neutral",
          description: `月線: ${allIndicators.taiexIndex.monthlyMA.toLocaleString()}, 季線: ${allIndicators.taiexIndex.quarterlyMA.toLocaleString()}`,
          data: allIndicators.taiexIndex.history || [],
          source: allIndicators.taiexIndex.source || "TWSE",
        },
        {
          title: "VIX 指數",
          value: allIndicators.vixIndex.value.toFixed(2),
          change: `${allIndicators.vixIndex.change > 0 ? "+" : ""}${allIndicators.vixIndex.change.toFixed(2)}%`,
          status: allIndicators.vixIndex.value < 20 ? "bullish" : allIndicators.vixIndex.value > 25 ? "warning" : "neutral",
          description: allIndicators.vixIndex.value < 20 ? "市場風險情緒穩定" : "市場波動加大",
          data: allIndicators.vixIndex.history || [],
          source: allIndicators.vixIndex.source || "Yahoo Finance",
        },
        {
          title: "CNN 恐慌指數",
          value: allIndicators.cnnFearGreedIndex.value.toString(),
          change: allIndicators.cnnFearGreedIndex.label,
          status: allIndicators.cnnFearGreedIndex.value > 50 ? "bullish" : "bearish",
          description: allIndicators.cnnFearGreedIndex.value > 50 ? "投資者情緒樂觀" : "投資者情緒悲觀",
          data: [],
          source: allIndicators.cnnFearGreedIndex.source || "CNN",
        },
        {
          title: "融資餘額",
          value: `${allIndicators.marginBalance.value.toLocaleString()}`,
          change: `${allIndicators.marginBalance.change > 0 ? "+" : ""}${allIndicators.marginBalance.change.toFixed(1)}`,
          status: "neutral",
          description: "市場槓桿程度",
          data: allIndicators.marginBalance.history || [],
          source: allIndicators.marginBalance.source || "TWSE",
        },
        {
          title: "融資維持率",
          value: `${allIndicators.marginMaintainRate.value.toFixed(2)}%`,
          change: "安全",
          status: allIndicators.marginMaintainRate.value > 160 ? "bullish" : "warning",
          description: `安全線: ${allIndicators.marginMaintainRate.safetyLine}%, 警戒線: ${allIndicators.marginMaintainRate.breakLine}%`,
          data: [],
          source: allIndicators.marginMaintainRate.source || "TWSE",
        },
        {
          title: "台灣 VIX",
          value: allIndicators.taiwanVix.value.toFixed(2),
          change: `${allIndicators.taiwanVix.change > 0 ? "+" : ""}${allIndicators.taiwanVix.change.toFixed(2)}%`,
          status: allIndicators.taiwanVix.value < 20 ? "bullish" : allIndicators.taiwanVix.value > 25 ? "warning" : "neutral",
          description: allIndicators.taiwanVix.value < 20 ? "台股波動率低" : "台股波動率高",
          data: allIndicators.taiwanVix.history || [],
          source: allIndicators.taiwanVix.source || "TAIFEX",
        },
      ];

      setIndicators(newIndicators);
    }
  }, [allIndicators]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">載入中...</div>
      </div>
    );
  }

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
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                  股票操作戰略儀表板
                </h1>
                <p className="text-slate-400 mt-2">實時市場指標監控與策略分析</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">最後更新</p>
                <p className="text-lg font-semibold text-slate-200">
                  {allIndicators?.lastUpdated ? new Date(allIndicators.lastUpdated).toLocaleString("zh-TW") : ""}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              市場概況
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {indicators.map((indicator, idx) => (
                <Card
                  key={idx}
                  className={`bg-gradient-to-br ${getStatusColor(indicator.status)} border backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 cursor-pointer group flex flex-col`}
                  onClick={() => navigate(`/indicator?id=${encodeURIComponent(indicator.title)}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-semibold text-slate-200">{indicator.title}</CardTitle>
                      <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
                        {getStatusIcon(indicator.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-3">
                      <p className="text-3xl font-bold text-white" style={{ fontFamily: "Roboto Mono, monospace" }}>
                        {indicator.value}
                      </p>
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

                    {/* 數據來源標註 */}
                    <div className="mt-auto pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Info className="w-3 h-3" />
                        <span>資料來源: {indicator.source}</span>
                      </div>
                    </div>

                    {/* 迷你圖表 */}
                    {indicator.data && indicator.data.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-2">30 天走勢</p>
                        <ResponsiveContainer width="100%" height={60}>
                          <LineChart data={indicator.data}>
                            <XAxis dataKey="day" hide />
                            <YAxis hide domain={["dataMin", "dataMax"]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "6px" }}
                              labelStyle={{ color: "#e2e8f0" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={getLineColor(indicator.status)}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                            {indicator.data[0]?.ma10 && (
                              <Line
                                type="monotone"
                                dataKey="ma10"
                                stroke="#eab308"
                                strokeWidth={1}
                                dot={false}
                                isAnimationActive={false}
                                strokeDasharray="5,5"
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-lg p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              策略分析
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  正面信號
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  {allIndicators?.taiexIndex && allIndicators.taiexIndex.value > allIndicators.taiexIndex.monthlyMA && (
                    <li>✓ 台股位階在月線以上，多頭趨勢明確</li>
                  )}
                  {allIndicators?.taiexIndex && allIndicators.taiexIndex.value > allIndicators.taiexIndex.quarterlyMA && (
                    <li>✓ 台股位階在季線以上，長期趨勢向上</li>
                  )}
                  {allIndicators?.vixIndex && allIndicators.vixIndex.value < 20 && (
                    <li>✓ VIX 指數低於 20，市場風險情緒穩定</li>
                  )}
                  {allIndicators?.cnnFearGreedIndex && allIndicators.cnnFearGreedIndex.value > 50 && (
                    <li>✓ CNN 恐慌指數 {allIndicators.cnnFearGreedIndex.value}，投資者情緒樂觀</li>
                  )}
                  {allIndicators?.marginMaintainRate && allIndicators.marginMaintainRate.value > 160 && (
                    <li>✓ 融資維持率 {allIndicators.marginMaintainRate.value.toFixed(2)}%，市場槓桿穩健</li>
                  )}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  監控項目
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  {allIndicators?.vixIndex && allIndicators.vixIndex.value > 25 && (
                    <li>⚠ VIX 指數 {allIndicators.vixIndex.value.toFixed(2)}，市場波動加大</li>
                  )}
                  {allIndicators?.marginMaintainRate && allIndicators.marginMaintainRate.value < 160 && (
                    <li>⚠ 融資維持率 {allIndicators.marginMaintainRate.value.toFixed(2)}%，需留意風險</li>
                  )}
                  {allIndicators?.cnnFearGreedIndex && allIndicators.cnnFearGreedIndex.value < 30 && (
                    <li>⚠ CNN 恐慌指數 {allIndicators.cnnFearGreedIndex.value}，投資者情緒悲觀</li>
                  )}
                  <li>⚠ 融資餘額 {allIndicators?.marginBalance?.value.toLocaleString()}億，監控過度槓桿</li>
                  <li>⚠ 關注美股走勢與 VIX 變化</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800/50 text-center text-slate-400 text-sm">
            <p>此儀表板數據來自官方公開數據源，僅供參考。投資決策應基於個人風險承受能力與充分研究。</p>
            <p className="mt-2">© 2026 Stock Strategy Dashboard</p>
            <p className="mt-4 text-xs text-slate-500">
              數據來源: {allIndicators?.dataSource || "TWSE, Yahoo Finance, CNN"}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
