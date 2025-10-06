import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyAnalytics {
  date: string;
  revenue: number;
  profit: number;
  expenses?: number;
  net_profit?: number;
  count: number;
}

interface SalesDynamicsChartProps {
  data: DailyAnalytics[];
}

const SalesDynamicsChart = ({ data }: SalesDynamicsChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" size={18} />
            Динамика продаж
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Нет данных о динамике</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="TrendingUp" size={18} />
          Динамика продаж
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={[...data].reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215, 16%, 65%)" 
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString('ru')}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Оборот" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
            <Line type="monotone" dataKey="profit" name="Прибыль" stroke="hsl(142, 76%, 36%)" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" name="Расходы" stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
            <Line type="monotone" dataKey="net_profit" name="Чистая прибыль" stroke="hsl(142, 76%, 36%)" strokeWidth={3} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="count" name="Продажи" stroke="hsl(45, 93%, 47%)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesDynamicsChart;
