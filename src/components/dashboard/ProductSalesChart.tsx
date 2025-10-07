import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductAnalytics {
  name: string;
  sales_count: number;
  total_profit: number;
  total_revenue: number;
}

interface ProductSalesChartProps {
  data: ProductAnalytics[];
  displayCurrency?: 'RUB' | 'USD';
  useNetProfit?: boolean;
}

const COLORS = [
  'hsl(217, 91%, 60%)', 
  'hsl(142, 76%, 36%)', 
  'hsl(45, 93%, 47%)', 
  'hsl(0, 84%, 60%)', 
  'hsl(262, 83%, 58%)'
];

const ProductSalesChart = ({ data, displayCurrency = 'RUB', useNetProfit = false }: ProductSalesChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="PieChart" size={18} />
            {useNetProfit ? 'Прибыль по товарам' : 'Продажи по товарам'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Нет данных</p>
        </CardContent>
      </Card>
    );
  }

  const dataKey = useNetProfit ? 'total_profit' : 'total_revenue';
  const chartTitle = useNetProfit ? 'Прибыль по товарам' : 'Продажи по товарам';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="PieChart" size={18} />
          {chartTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={140}
              label={(entry) => entry.name}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => {
                const symbol = displayCurrency === 'RUB' ? '₽' : '$';
                const formatted = displayCurrency === 'RUB' 
                  ? value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
                  : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return `${formatted} ${symbol}`;
              }}
              content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const item = payload[0].payload;
                const symbol = displayCurrency === 'RUB' ? '₽' : '$';
                const profitFormatted = displayCurrency === 'RUB' 
                  ? item.total_profit.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
                  : item.total_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                return (
                  <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="font-semibold mb-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.sales_count} продаж</p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {profitFormatted} {symbol}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProductSalesChart;