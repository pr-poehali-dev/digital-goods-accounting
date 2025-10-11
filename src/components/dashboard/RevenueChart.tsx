import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
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

  const chartData = useMemo(() => {
    let result = [...data];
    if (showMA7) result = calculateMA(result, 7, 'revenue');
    if (showMA30) result = calculateMA(result, 30, 'revenue');
    if (showMA90) result = calculateMA(result, 90, 'revenue');
    return result;
  }, [data, showMA7, showMA30, showMA90]);

  const yAxisDomain = useMemo(() => {
    if (data.length === 0) return [0, 100];
    
    const allValues = data.flatMap(d => [d.revenue, d.costs]);
    const sorted = allValues.sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const upperBound = q3 + 1.5 * iqr;
    const maxNormal = Math.max(...allValues.filter(v => v <= upperBound));
    
    return [0, Math.ceil(maxNormal * 1.1)];
  }, [data]);

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return Math.round(value).toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name} : {formatNumber(entry.value)}
          </p>
        ))}
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
              domain={yAxisDomain}
              tickFormatter={formatNumber}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorRevenue)" name="Доход" />
            <Area type="monotone" dataKey="costs" stroke="hsl(0, 91%, 59%)" strokeWidth={2} fill="url(#colorCosts)" name="Затраты" />
            {showMA7 && <Line type="monotone" dataKey="ma7_revenue" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} name="MA7" />}
            {showMA30 && <Line type="monotone" dataKey="ma30_revenue" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} name="MA30" />}
            {showMA90 && <Line type="monotone" dataKey="ma90_revenue" stroke="hsl(24, 95%, 53%)" strokeWidth={2} dot={false} name="MA90" />}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;