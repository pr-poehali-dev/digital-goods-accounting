import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceDot, Label } from 'recharts';
import { useState, useMemo } from 'react';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const [showMA7, setShowMA7] = useState(false);
  const [showMA30, setShowMA30] = useState(false);
  const [showMA90, setShowMA90] = useState(false);

  const calculateMA = (data: any[], period: number, key: string) => {
    return data.map((item, idx) => {
      if (idx < period - 1) return { ...item, [`ma${period}_${key}`]: null };
      const slice = data.slice(idx - period + 1, idx + 1);
      const avg = slice.reduce((sum, d) => sum + d[key], 0) / period;
      return { ...item, [`ma${period}_${key}`]: avg };
    });
  };

  const { chartData, normalizedData, anomalies } = useMemo(() => {
    if (data.length === 0) return { chartData: [], normalizedData: [], anomalies: [] };

    const threshold = 100000;
    const anomalyList: Array<{ date: string; revenue: number; costs: number; index: number }> = [];
    
    const normalized = data.map((item, idx) => {
      const hasAnomaly = item.revenue > threshold;
      
      if (hasAnomaly) {
        anomalyList.push({
          date: item.date,
          revenue: item.revenue,
          costs: item.costs,
          index: idx
        });
      }

      return {
        ...item,
        displayRevenue: Math.min(item.revenue, threshold),
        displayCosts: item.costs,
        displayProfit: Math.min(item.revenue, threshold) - item.costs,
        hasAnomaly
      };
    });

    let result = normalized;
    if (showMA7) {
      result = calculateMA(result, 7, 'displayProfit');
    }
    if (showMA30) {
      result = calculateMA(result, 30, 'displayProfit');
    }
    if (showMA90) {
      result = calculateMA(result, 90, 'displayProfit');
    }

    return { chartData: result, normalizedData: normalized, anomalies: anomalyList };
  }, [data, showMA7, showMA30, showMA90]);

  const formatNumber = (value: number) => {
    return value.toLocaleString('ru-RU');
  };

  const formatAxisNumber = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k';
    }
    return Math.round(value).toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = normalizedData.find(d => d.date === label);
    if (!dataPoint) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        <p className="text-sm" style={{ color: 'hsl(217, 91%, 60%)' }}>
          Доход: {formatNumber(dataPoint.revenue)}
          {dataPoint.hasAnomaly && <span className="ml-1 text-orange-500">⚠️</span>}
        </p>
        <p className="text-sm" style={{ color: 'hsl(0, 91%, 59%)' }}>
          Затраты: {formatNumber(dataPoint.costs)}
        </p>
        {payload.find((p: any) => p.dataKey?.includes('ma')) && (
          <>
            {payload.filter((p: any) => p.dataKey?.includes('ma')).map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {formatNumber(entry.value)}
              </p>
            ))}
          </>
        )}
      </div>
    );
  };

  if (data.length === 0) return null;

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="BarChart3" size={18} />
            Динамика доходов и затрат
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={showMA7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMA7(!showMA7)}
            >
              MA7
            </Button>
            <Button
              variant={showMA30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMA30(!showMA30)}
            >
              MA30
            </Button>
            <Button
              variant={showMA90 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMA90(!showMA90)}
            >
              MA90
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 91%, 59%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 91%, 59%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215, 16%, 65%)" 
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(215, 16%, 65%)" 
              fontSize={12}
              domain={[0, 100000]}
              ticks={[0, 20000, 40000, 60000, 80000, 100000]}
              tickFormatter={formatAxisNumber}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="displayRevenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorRevenue)" name="Доход" />
            <Area type="monotone" dataKey="displayCosts" stroke="hsl(0, 91%, 59%)" strokeWidth={2} fill="url(#colorCosts)" name="Затраты" />
            {showMA7 && <Line type="monotone" dataKey="ma7_displayProfit" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} name="MA7 Прибыль" />}
            {showMA30 && <Line type="monotone" dataKey="ma30_displayProfit" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} name="MA30 Прибыль" />}
            {showMA90 && <Line type="monotone" dataKey="ma90_displayProfit" stroke="hsl(24, 95%, 53%)" strokeWidth={2} dot={false} name="MA90 Прибыль" />}
            {anomalies.map((anomaly, idx) => (
              <ReferenceDot 
                key={idx}
                x={anomaly.date} 
                y={100000}
                r={7}
                fill="hsl(24, 95%, 53%)"
                stroke="white"
                strokeWidth={2}
              >
                <Label 
                  value={formatNumber(anomaly.revenue)}
                  position="top"
                  fill="hsl(24, 95%, 53%)"
                  fontSize={11}
                  fontWeight="600"
                  offset={5}
                />
              </ReferenceDot>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        {anomalies.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Icon name="AlertTriangle" size={14} className="text-orange-500" />
            <span>Обнаружено аномалий: {anomalies.length}. Значения отмечены на графике.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;