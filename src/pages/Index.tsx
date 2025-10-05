import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TelegramAuth from '@/components/TelegramAuth';
import ProductManager from '@/components/ProductManager';
import TransactionForm from '@/components/TransactionForm';
import AdminSettings from '@/components/AdminSettings';
import ExpenseManager from '@/components/ExpenseManager';
import { getStats, getTransactions, getExchangeRate } from '@/lib/api';
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
  currency?: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [displayCurrency, setDisplayCurrency] = useState<'RUB' | 'USD'>('RUB');
  const [exchangeRate, setExchangeRate] = useState(95.50);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_costs: 0,
    total_profit: 0,
    total_transactions: 0,
    completed_count: 0,
    pending_count: 0,
    product_analytics: [],
    daily_analytics: [],
  });
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const startDate = dateFilter === 'custom' ? customDateRange.start : undefined;
      const endDate = dateFilter === 'custom' ? customDateRange.end : undefined;
      
      const [statsResult, transactionsResult, rateResult] = await Promise.all([
        getStats(dateFilter, startDate, endDate),
        getTransactions(),
        getExchangeRate().catch(() => ({ rate: 95.50 })),
      ]);
      
      if (rateResult?.rate) {
        setExchangeRate(rateResult.rate);
      }
      
      setStats(prevStats => {
        if (JSON.stringify(prevStats) === JSON.stringify(statsResult)) {
          return prevStats;
        }
        return statsResult;
      });
      
      setTransactions(prevTrans => {
        const newTrans = transactionsResult.transactions || [];
        if (JSON.stringify(prevTrans) === JSON.stringify(newTrans)) {
          return prevTrans;
        }
        return newTrans;
      });
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    }
  }, [dateFilter, customDateRange]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    
    const fetchData = async () => {
      if (!mounted) return;
      await loadData();
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('telegram_id');
    setIsAuthenticated(false);
  };

  const convertAmount = useCallback((amount: number, fromCurrency: string = 'RUB') => {
    if (displayCurrency === fromCurrency) return amount;
    if (displayCurrency === 'USD' && fromCurrency === 'RUB') return amount / exchangeRate;
    if (displayCurrency === 'RUB' && fromCurrency === 'USD') return amount * exchangeRate;
    return amount;
  }, [displayCurrency, exchangeRate]);

  const formatCurrency = useCallback((amount: number, currency?: string) => {
    const converted = convertAmount(amount, currency || 'RUB');
    const symbol = displayCurrency === 'RUB' ? '₽' : '$';
    return `${converted.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${symbol}`;
  }, [displayCurrency, convertAmount]);

  const convertedStats = useMemo(() => ({
    total_revenue: convertAmount(stats.total_revenue),
    total_costs: convertAmount(stats.total_costs),
    total_profit: convertAmount(stats.total_profit),
    total_transactions: stats.total_transactions,
    completed_count: stats.completed_count,
    pending_count: stats.pending_count,
    product_analytics: stats.product_analytics.map((p: any) => ({
      ...p,
      revenue: convertAmount(p.revenue || 0),
      profit: convertAmount(p.profit || 0),
    })),
    daily_analytics: stats.daily_analytics.map((d: any) => ({
      ...d,
      revenue: convertAmount(d.revenue || 0),
      profit: convertAmount(d.profit || 0),
    })),
  }), [stats, convertAmount]);

  const revenueByMonth = useMemo(() => {
    if (!isAuthenticated) return [];
    
    return transactions.reduce((acc, t) => {
      const month = new Date(t.transaction_date).toLocaleDateString('ru', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      const revenue = convertAmount(t.amount, t.currency);
      const costs = convertAmount(t.amount - t.profit, t.currency);
      
      if (existing) {
        existing.revenue += revenue;
        existing.costs += costs;
      } else {
        acc.push({
          month,
          revenue,
          costs,
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; revenue: number; costs: number }>);
  }, [isAuthenticated, transactions, convertAmount]);

  if (!isAuthenticated) {
    return <TelegramAuth onAuthenticated={(user) => {
      setIsAuthenticated(true);
    }} />;
  }

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
              <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-muted rounded-lg">
                <span className="text-sm font-medium">Валюта:</span>
                <Button 
                  variant={displayCurrency === 'RUB' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setDisplayCurrency('RUB')}
                  className="h-7 px-3"
                >
                  ₽ RUB
                </Button>
                <Button 
                  variant={displayCurrency === 'USD' ? 'default' : 'ghost'}
                  size="sm" 
                  onClick={() => setDisplayCurrency('USD')}
                  className="h-7 px-3"
                >
                  $ USD
                </Button>
              </div>
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
            <TabsTrigger value="expenses" className="gap-2">
              <Icon name="DollarSign" size={16} />
              Расходы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="TrendingUp" size={16} />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Icon name="Settings" size={16} />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={dateFilter === 'today' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateFilter('today')}
                    >
                      <Icon name="Calendar" size={14} className="mr-2" />
                      Сегодня
                    </Button>
                    <Button 
                      variant={dateFilter === 'week' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateFilter('week')}
                    >
                      <Icon name="CalendarDays" size={14} className="mr-2" />
                      Неделя
                    </Button>
                    <Button 
                      variant={dateFilter === 'month' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateFilter('month')}
                    >
                      <Icon name="CalendarRange" size={14} className="mr-2" />
                      Месяц
                    </Button>
                    <Button 
                      variant={dateFilter === 'custom' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateFilter('custom')}
                    >
                      <Icon name="CalendarClock" size={14} className="mr-2" />
                      Диапазон
                    </Button>
                  </div>
                  
                  {dateFilter === 'custom' && (
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="date" 
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        className="w-auto"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input 
                        type="date" 
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        className="w-auto"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
                    {formatCurrency(convertedStats.total_revenue)}
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
                    {formatCurrency(convertedStats.total_profit)}
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
                    {formatCurrency(convertedStats.total_costs)}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="PieChart" size={18} />
                    Продажи по товарам
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.product_analytics && stats.product_analytics.length > 0 ? (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={stats.product_analytics}
                            dataKey="total_revenue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.name}: ₽${entry.total_revenue.toLocaleString()}`}
                          >
                            {stats.product_analytics.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {stats.product_analytics.map((product: any, index: number) => (
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
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных о продажах</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="TrendingUp" size={18} />
                    Динамика продаж
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.daily_analytics && stats.daily_analytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={[...stats.daily_analytics].reverse()}>
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
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных о динамике</p>
                  )}
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

          <TabsContent value="expenses">
            <ExpenseManager />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
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