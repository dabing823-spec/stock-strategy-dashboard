import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, ComposedChart, Bar } from "recharts";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function IndicatorDetail() {
  const [, setLocation] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const indicatorId = queryParams.get("id") as any;
  const [timeRange, setTimeRange] = useState(30);

  const { data: detailData, isLoading } = trpc.marketData.getIndicatorDetail.useQuery(indicatorId, {
    enabled: !!indicatorId,
  });

  // 統計數據將從 history 計算

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
        <div className="text-white text-center">載入中...</div>
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
        <div className="text-white text-center">找不到指標數據</div>
      </div>
    );
  }

  const chartData = detailData.history.slice(-timeRange);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-slate-800/50 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{detailData.name}</h1>
                <p className="text-slate-400 text-sm mt-1">代碼: {detailData.symbol}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* 指標摘要 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">當前價格</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {detailData.value.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 mt-1">{detailData.unit}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">漲跌幅</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {detailData.change >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`text-3xl font-bold ${detailData.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {detailData.change >= 0 ? "+" : ""}{detailData.change.toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {timeRange}天最高
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">N/A</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {timeRange}天最低
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">N/A</p>
              </CardContent>
            </Card>
          </div>

          {/* 時間範圍選擇 */}
          <div className="flex gap-2 mb-6">
            {[7, 30, 90, 180].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(days)}
              >
                {days}天
              </Button>
            ))}
          </div>

          {/* 主圖表 - 價格與均線 */}
          <Card className="bg-slate-800/50 border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle>價格走勢與十日均線</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value: any) =>
                      typeof value === "number"
                        ? value.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : value
                    }
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="價格" opacity={0.7} />
                  <Line type="monotone" dataKey="ma10" stroke="#10b981" strokeWidth={2} name="10日均線" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 統計信息 */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>統計數據</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">平均值</p>
                  <p className="text-xl font-bold text-white">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">最高</p>
                  <p className="text-xl font-bold text-emerald-400">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">最低</p>
                  <p className="text-xl font-bold text-red-400">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">期間漲跌</p>
                  <p className="text-xl font-bold text-blue-400">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">波動幅度</p>
                  <p className="text-xl font-bold text-blue-400">N/A</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
