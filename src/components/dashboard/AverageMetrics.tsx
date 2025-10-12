import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AverageMetricsProps {
  data: {
    avgSalesPerDay: number;
    avgProfitPerDay: number;
    avgCheck: number;
    avgMargin: number;
  };
  formatCurrency: (amount: number) => string;
  dailyAnalytics?: Array<{
    date: string;
    count: number;
    profit: number;
    revenue: number;
    expenses: number;
  }>;
}

const AverageMetrics = ({ data, formatCurrency, dailyAnalytics = [] }: AverageMetricsProps) => {
  const [showSalesChart, setShowSalesChart] = useState(false);
  const [showProfitChart, setShowProfitChart] = useState(false);
  const [showCheckChart, setShowCheckChart] = useState(false);
  const [showMarginChart, setShowMarginChart] = useState(false);

  const cumulativeAvgData = dailyAnalytics.map((day, index) => {
    const previousDays = dailyAnalytics.slice(0, index + 1);
    const totalSales = previousDays.reduce((sum, d) => sum + d.count, 0);
    const totalProfit = previousDays.reduce((sum, d) => sum + (d.profit || 0), 0);
    const totalExpenses = previousDays.reduce((sum, d) => sum + (d.expenses || 0), 0);
    const totalRevenue = previousDays.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalCosts = totalRevenue - totalProfit;
    
    const avgSales = totalSales / (index + 1);
    const avgProfit = (totalProfit - totalExpenses) / (index + 1);
    const avgCheck = totalSales > 0 ? totalRevenue / totalSales : 0;
    const avgMargin = totalCosts > 0 ? totalRevenue / totalCosts : 0;
    
    return {
      date: new Date(day.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
      avgSales: parseFloat(avgSales.toFixed(2)),
      avgProfit: parseFloat(avgProfit.toFixed(2)),
      avgCheck: parseFloat(avgCheck.toFixed(2)),
      avgMargin: parseFloat(avgMargin.toFixed(2))
    };
  });
  const metrics = [
    {
      title: 'Ср. продаж/день',
      value: data.avgSalesPerDay.toFixed(1),
      icon: 'ShoppingCart',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      hasChart: true,
      onClick: () => setShowSalesChart(true)
    },
    {
      title: 'Ср. прибыль/день',
      value: formatCurrency(data.avgProfitPerDay),
      icon: 'TrendingUp',
      color: 'text-green-600',
      bg: 'bg-green-50',
      hasChart: true,
      onClick: () => setShowProfitChart(true)
    },
    {
      title: 'Средний чек',
      value: formatCurrency(data.avgCheck),
      icon: 'Receipt',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      hasChart: true,
      onClick: () => setShowCheckChart(true)
    },
    {
      title: 'Средняя маржа',
      value: `${data.avgMargin.toFixed(2)}x`,
      icon: 'TrendingUp',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      hasChart: true,
      onClick: () => setShowMarginChart(true)
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {metric.hasChart && (
                  <button
                    onClick={metric.onClick}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Посмотреть график"
                  >
                    <Icon name="LineChart" size={16} className="text-gray-600" />
                  </button>
                )}
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <Icon name={metric.icon as any} size={16} className={metric.color} />
                </div>
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

      <Dialog open={showSalesChart} onOpenChange={setShowSalesChart}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Среднее количество продаж в день</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cumulativeAvgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 16%, 65%)" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Ср. продаж/день']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSales" 
                  stroke="hsl(221, 83%, 53%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(221, 83%, 53%)', r: 3 }}
                  name="Ср. продаж/день"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              График показывает накопительное среднее количество продаж в день за всю историю проекта
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfitChart} onOpenChange={setShowProfitChart}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Средняя чистая прибыль в день</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cumulativeAvgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 16%, 65%)" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Ср. прибыль/день']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgProfit" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 76%, 36%)', r: 3 }}
                  name="Ср. прибыль/день"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              График показывает накопительную среднюю чистую прибыль в день за всю историю проекта
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckChart} onOpenChange={setShowCheckChart}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Средний чек</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cumulativeAvgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 16%, 65%)" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Средний чек']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgCheck" 
                  stroke="hsl(271, 91%, 65%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(271, 91%, 65%)', r: 3 }}
                  name="Средний чек"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              График показывает накопительный средний чек за всю историю проекта
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMarginChart} onOpenChange={setShowMarginChart}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Средняя маржа</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cumulativeAvgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(215, 16%, 65%)" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}x`, 'Средняя маржа']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgMargin" 
                  stroke="hsl(25, 95%, 53%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(25, 95%, 53%)', r: 3 }}
                  name="Средняя маржа"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              График показывает накопительную среднюю маржу за всю историю проекта
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AverageMetrics;