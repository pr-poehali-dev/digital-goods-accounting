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
}

const COLORS = [
  'hsl(217, 91%, 60%)', 
  'hsl(142, 76%, 36%)', 
  'hsl(45, 93%, 47%)', 
  'hsl(0, 84%, 60%)', 
  'hsl(262, 83%, 58%)'
];

const ProductSalesChart = ({ data }: ProductSalesChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="PieChart" size={18} />
            Продажи по товарам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Нет данных о продажах</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="PieChart" size={18} />
          Продажи по товарам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total_revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name}: ₽${entry.total_revenue.toLocaleString()}`}
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
                  <p className="font-semibold text-green-600">₽{product.total_profit.toLocaleString()}</p>
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
