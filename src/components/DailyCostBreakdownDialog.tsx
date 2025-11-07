import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyCostBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  exchangeRate: number;
  formatCurrency: (amount: number) => string;
}

interface TransactionCost {
  id: number;
  code: string;
  product: string;
  client: string;
  amount: number;
  cost_price: number;
  currency: string;
}

interface Expense {
  id: number;
  type: string;
  description: string;
  amount: number;
  distribution_type: string;
  start_date: string;
  end_date: string | null;
  currency: string;
}

interface BreakdownData {
  date: string;
  transaction_costs: TransactionCost[];
  expenses: Expense[];
  total_transaction_costs: number;
  total_expenses: number;
  total_costs: number;
}

const DailyCostBreakdownDialog = ({
  open,
  onOpenChange,
  date,
  exchangeRate,
  formatCurrency
}: DailyCostBreakdownProps) => {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !date) return;

    const fetchBreakdown = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/33e09c5b-edd0-4636-b984-d21d3d5b5042?date=${date}&exchange_rate=${exchangeRate}`
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch breakdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [open, date, exchangeRate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="CalendarDays" size={20} />
            Детализация расходов за {date ? new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Себестоимость</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.total_transaction_costs)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Расходы</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.total_expenses)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Всего затрат</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.total_costs)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="ShoppingCart" size={18} />
                  Себестоимость товаров ({data.transaction_costs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.transaction_costs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет транзакций за этот день</p>
                ) : (
                  <div className="space-y-3">
                    {data.transaction_costs.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.product}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.code}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Клиент: {item.client}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            {formatCurrency(item.cost_price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Выручка: {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="Receipt" size={18} />
                  Расходные транзакции ({data.expenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет расходов за этот день</p>
                ) : (
                  <div className="space-y-3">
                    {data.expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{expense.type}</span>
                            <Badge variant={expense.distribution_type === 'one_time' ? 'default' : 'secondary'} className="text-xs">
                              {expense.distribution_type === 'one_time' ? 'Разовый' : 'Распределённый'}
                            </Badge>
                          </div>
                          {expense.description && (
                            <div className="text-sm text-muted-foreground mb-1">
                              {expense.description}
                            </div>
                          )}
                          {expense.distribution_type === 'distributed' && (
                            <div className="text-xs text-muted-foreground">
                              Период: {new Date(expense.start_date).toLocaleDateString('ru')} - {expense.end_date ? new Date(expense.end_date).toLocaleDateString('ru') : '∞'}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-orange-600">
                            {formatCurrency(expense.amount)}
                          </div>
                          {expense.distribution_type === 'distributed' && (
                            <div className="text-xs text-muted-foreground">
                              За день
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Нет данных</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DailyCostBreakdownDialog;
