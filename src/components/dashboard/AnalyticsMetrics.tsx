import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsMetricsProps {
  stats: {
    total_revenue: number;
    total_costs: number;
    total_profit: number;
    total_transactions: number;
    completed_count: number;
  };
}

const AnalyticsMetrics = ({ stats }: AnalyticsMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Средний чек</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₽{stats.total_transactions > 0 
              ? (stats.total_revenue / stats.total_transactions).toLocaleString(undefined, { maximumFractionDigits: 0 })
              : 0
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">На транзакцию</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Средняя маржа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.total_costs > 0
              ? ((stats.total_profit / stats.total_costs) * 100).toFixed(1)
              : 0
            }%
          </div>
          <p className="text-xs text-muted-foreground mt-1">ROI</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Конверсия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.total_transactions > 0
              ? ((stats.completed_count / stats.total_transactions) * 100).toFixed(1)
              : 0
            }%
          </div>
          <p className="text-xs text-muted-foreground mt-1">Завершённых</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Средняя прибыль</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₽{stats.completed_count > 0
              ? (stats.total_profit / stats.completed_count).toLocaleString(undefined, { maximumFractionDigits: 0 })
              : 0
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">С продажи</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsMetrics;
