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
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => {
                  const value = useNetProfit ? entry.total_profit : entry.total_revenue;
                  const symbol = displayCurrency === 'RUB' ? '₽' : '$';
                  const formatted = displayCurrency === 'RUB' 
                    ? value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
                    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return `${entry.name}: ${formatted} ${symbol}`;
                }}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.map((product, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sales_count} продаж</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {displayCurrency === 'RUB' 
                      ? `₽${product.total_profit.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`
                      : `$${product.total_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">прибыль</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSalesChart;