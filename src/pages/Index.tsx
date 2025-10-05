import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TelegramAuth from '@/components/TelegramAuth';
import ProductManager from '@/components/ProductManager';
import TransactionForm from '@/components/TransactionForm';
import { getStats, getTransactions } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
  id: number;
  transaction_code: string;
  product_name: string;
  client_telegram: string;
  client_name: string;
  amount: number;
  profit: number;
  status: string;
  transaction_date: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_costs: 0,
    total_profit: 0,
    total_transactions: 0,
    completed_count: 0,
    pending_count: 0,
  });
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [statsResult, transactionsResult] = await Promise.all([
        getStats(),
        getTransactions(),
      ]);
      
      setStats(statsResult);
      setTransactions(transactionsResult.transactions || []);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('telegram_id');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <TelegramAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const revenueByMonth = transactions.reduce((acc, t) => {
    const month = new Date(t.transaction_date).toLocaleDateString('ru', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.revenue += t.amount;
      existing.costs += (t.amount - t.profit);
    } else {
      acc.push({
        month,
        revenue: t.amount,
        costs: t.amount - t.profit,
      });
    }
    
    return acc;
  }, [] as Array<{ month: string; revenue: number; costs: number }>);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon name="Package" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Админ-панель</h1>
                <p className="text-sm text-muted-foreground">Магазин цифровых товаров</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setTransactionFormOpen(true)} className="bg-primary hover:bg-primary/90">
                <Icon name="Plus" size={16} className="mr-2" />
                Новая транзакция
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="overview" className="gap-2">
              <Icon name="LayoutDashboard" size={16} />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Icon name="Receipt" size={16} />
              Транзакции
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Icon name="Package" size={16} />
              Товары
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="TrendingUp" size={16} />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-primary animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon name="TrendingUp" size={16} />
                    Общий доход
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    ₽{stats.total_revenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Всего продаж</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Завершено: {stats.completed_count}</p>
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
                    ₽{stats.total_profit.toLocaleString()}
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
                    ₽{stats.total_costs.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Себестоимость</p>
                </CardContent>
              </Card>
            </div>

            {revenueByMonth.length > 0 && (
              <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="BarChart3" size={18} />
                    Динамика доходов и затрат
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueByMonth}>
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
                      <XAxis dataKey="month" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="costs" stroke="hsl(0, 91%, 59%)" strokeWidth={2} fill="url(#colorCosts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Activity" size={18} />
                  Последние транзакции
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Транзакций пока нет</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Товар</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 10).map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{transaction.transaction_code}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('ru')}
                          </TableCell>
                          <TableCell>
                            {transaction.client_telegram || transaction.client_name || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{transaction.product_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ₽{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                Завершена
                              </Badge>
                            )}
                            {transaction.status === 'pending' && (
                              <Badge variant="secondary">Ожидает</Badge>
                            )}
                            {transaction.status === 'failed' && (
                              <Badge variant="destructive">Отклонена</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Все транзакции</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Icon name="Filter" size={16} className="mr-2" />
                    Фильтры
                  </Button>
                  <Button variant="outline" size="sm">
                    <Icon name="Download" size={16} className="mr-2" />
                    Экспорт
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Транзакций пока нет</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID транзакции</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Товар</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                        <TableHead className="text-right">Прибыль</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.transaction_code}</TableCell>
                          <TableCell>
                            {new Date(transaction.transaction_date).toLocaleDateString('ru')}
                          </TableCell>
                          <TableCell>
                            {transaction.client_telegram ? (
                              <span className="text-primary">{transaction.client_telegram}</span>
                            ) : (
                              transaction.client_name || '—'
                            )}
                          </TableCell>
                          <TableCell>{transaction.product_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ₽{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            ₽{transaction.profit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                Завершена
                              </Badge>
                            )}
                            {transaction.status === 'pending' && (
                              <Badge variant="secondary">Ожидает</Badge>
                            )}
                            {transaction.status === 'failed' && (
                              <Badge variant="destructive">Отклонена</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Средний чек</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ₽{stats.total_transactions > 0 
                      ? (stats.total_revenue / stats.total_transactions).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : 0
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Средняя маржа</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.total_costs > 0
                      ? ((stats.total_profit / stats.total_costs) * 100).toFixed(1)
                      : 0
                    }%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Конверсия</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.total_transactions > 0
                      ? ((stats.completed_count / stats.total_transactions) * 100).toFixed(1)
                      : 0
                    }%
                  </div>
                </CardContent>
              </Card>
            </div>

            {revenueByMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Динамика прибыли</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={revenueByMonth.map(item => ({
                      ...item,
                      profit: item.revenue - item.costs,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="month" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Index;
