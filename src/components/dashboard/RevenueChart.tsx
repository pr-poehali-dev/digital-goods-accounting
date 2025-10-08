import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  if (data.length === 0) return null;

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="BarChart3" size={18} />
          Динамика доходов и затрат
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
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
            <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
              }}
            />
            <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorRevenue)" name="Доход" />
            <Area type="monotone" dataKey="costs" stroke="hsl(0, 91%, 59%)" strokeWidth={2} fill="url(#colorCosts)" name="Затраты" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;