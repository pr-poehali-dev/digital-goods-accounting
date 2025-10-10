import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface AverageMetricsProps {
  data: {
    avgSalesPerDay: number;
    avgProfitPerDay: number;
    avgCheck: number;
    avgMargin: number;
  };
  formatCurrency: (amount: number) => string;
}

const AverageMetrics = ({ data, formatCurrency }: AverageMetricsProps) => {
  const metrics = [
    {
      title: 'Ср. продаж/день',
      value: data.avgSalesPerDay.toFixed(1),
      icon: 'ShoppingCart',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Ср. прибыль/день',
      value: formatCurrency(data.avgProfitPerDay),
      icon: 'TrendingUp',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Средний чек',
      value: formatCurrency(data.avgCheck),
      icon: 'Receipt',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Средняя маржа',
      value: `${data.avgMargin.toFixed(1)}%`,
      icon: 'Percent',
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bg}`}>
              <Icon name={metric.icon as any} size={16} className={metric.color} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AverageMetrics;
