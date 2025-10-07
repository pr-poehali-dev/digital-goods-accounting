import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface StatsCardsProps {
  stats: {
    total_revenue: number;
    total_transactions: number;
    completed_count: number;
    total_profit: number;
    total_costs: number;
  };
  formatCurrency: (amount: number) => string;
}

const StatsCards = ({ stats, formatCurrency }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-primary animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="TrendingUp" size={16} />
            Оборот
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(stats.total_revenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Всего продаж: {stats.completed_count}</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-secondary animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Receipt" size={16} />
            Транзакции
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {stats.total_transactions}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Завершено: {stats.completed_count} • Ожидает: {stats.pending_count}
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Wallet" size={16} />
            Прибыль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(stats.total_profit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Чистая прибыль</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-destructive animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            Затраты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(stats.total_costs)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Себестоимость</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;