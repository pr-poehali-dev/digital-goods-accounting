import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ProductManager from '@/components/ProductManager';
import TransactionForm from '@/components/TransactionForm';
import ExpenseManager from '@/components/ExpenseManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DateFilter from '@/components/dashboard/DateFilter';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TransactionsTable from '@/components/dashboard/TransactionsTable';
import AnalyticsMetrics from '@/components/dashboard/AnalyticsMetrics';
import ProductSalesChart from '@/components/dashboard/ProductSalesChart';
import SalesDynamicsChart from '@/components/dashboard/SalesDynamicsChart';
import ProfitDynamicsChart from '@/components/dashboard/ProfitDynamicsChart';
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
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(JSON.parse(user));
    setIsAuthenticated(true);
  }, [navigate]);
  const [displayCurrency, setDisplayCurrency] = useState<'RUB' | 'USD'>('RUB');
  const [exchangeRate, setExchangeRate] = useState(95.50);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [analyticsGrouping, setAnalyticsGrouping] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_costs: 0,
    total_profit: 0,
    total_transactions: 0,
    completed_count: 0,
    pending_count: 0,
    expenses_count: 0,
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const convertAmount = useCallback((amount: number, fromCurrency: string = 'RUB') => {
    if (displayCurrency === fromCurrency) return amount;
    if (displayCurrency === 'USD' && fromCurrency === 'RUB') return amount / exchangeRate;
    if (displayCurrency === 'RUB' && fromCurrency === 'USD') return amount * exchangeRate;
    return amount;
  }, [displayCurrency, exchangeRate]);

  const formatCurrency = useCallback((amount: number) => {
    const symbol = displayCurrency === 'RUB' ? '₽' : '$';
    const formatted = displayCurrency === 'RUB' 
      ? amount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
      : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ${symbol}`;
  }, [displayCurrency]);

  const convertedStats = useMemo(() => ({
    total_revenue: convertAmount(stats.total_revenue || 0, 'RUB'),
    total_costs: convertAmount(stats.total_costs || 0, 'RUB'),
    total_profit: convertAmount(stats.total_profit || 0, 'RUB'),
    total_transactions: stats.total_transactions || 0,
    completed_count: stats.completed_count || 0,
    pending_count: stats.pending_count || 0,
    expenses_count: stats.expenses_count || 0,
    product_analytics: (stats.product_analytics || []).map((p: any) => ({
      ...p,
      total_revenue: convertAmount(p.total_revenue || 0, 'RUB'),
      total_profit: convertAmount(p.total_profit || 0, 'RUB'),
    })),
    daily_analytics: (stats.daily_analytics || []).map((d: any) => ({
      ...d,
      revenue: convertAmount(d.revenue || 0, 'RUB'),
      profit: convertAmount(d.profit || 0, 'RUB'),
      expenses: convertAmount(d.expenses || 0, 'RUB'),
      net_profit: convertAmount(d.net_profit || 0, 'RUB'),
    })),
  }), [stats, convertAmount]);

  const dailyChartData = useMemo(() => {
    if (!convertedStats.daily_analytics || convertedStats.daily_analytics.length === 0) return [];
    
    let cumulativeRevenue = 0;
    let cumulativeCosts = 0;
    let totalExpensesAdded = 0;
    
    const result = convertedStats.daily_analytics.map((day: any, index: number) => {
      const dayRevenue = day.revenue || 0;
      const transactionCosts = (day.revenue || 0) - (day.profit || 0);
      const dayExpenses = day.expenses || 0;
      
      const dayCosts = transactionCosts + (index === 0 ? dayExpenses : 0);
      if (index === 0) totalExpensesAdded = dayExpenses;
      
      cumulativeRevenue += dayRevenue;
      cumulativeCosts += dayCosts;
      
      return {
        date: new Date(day.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        revenue: Math.round(cumulativeRevenue),
        costs: Math.round(cumulativeCosts),
        profit: Math.round(day.profit || 0),
      };
    });
    
    return result;
  }, [convertedStats]);

  const groupDataByPeriod = useCallback((data: any[], grouping: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    if (!data || data.length === 0) return [];
    
    const grouped = data.reduce((acc: any, item: any) => {
      const date = new Date(item.date);
      let key = '';
      
      switch (grouping) {
        case 'day':
          key = date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          key = `Нед ${weekStart.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`;
          break;
        case 'month':
          key = date.toLocaleDateString('ru', { month: 'short', year: 'numeric' });
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }
      
      if (!acc[key]) {
        acc[key] = { period: key, revenue: 0, profit: 0, costs: 0, count: 0, expenses: 0, net_profit: 0 };
      }
      
      acc[key].revenue += item.revenue || 0;
      acc[key].profit += item.profit || 0;
      acc[key].costs += (item.revenue || 0) - (item.profit || 0);
      acc[key].count += item.count || 0;
      acc[key].expenses += item.expenses || 0;
      acc[key].net_profit += item.net_profit || 0;
      
      return acc;
    }, {});
    
    return Object.values(grouped);
  }, []);

  const analyticsChartData = useMemo(() => {
    if (!convertedStats.daily_analytics) return [];
    return groupDataByPeriod(convertedStats.daily_analytics, analyticsGrouping);
  }, [convertedStats.daily_analytics, analyticsGrouping, groupDataByPeriod]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        displayCurrency={displayCurrency}
        onCurrencyChange={setDisplayCurrency}
        onNewTransaction={() => setTransactionFormOpen(true)}
        onLogout={handleLogout}
        isAdmin={currentUser?.is_admin || false}
      />

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
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DateFilter
              dateFilter={dateFilter}
              customDateRange={customDateRange}
              onDateFilterChange={setDateFilter}
              onCustomDateChange={setCustomDateRange}
            />

            <StatsCards stats={convertedStats} formatCurrency={formatCurrency} />

            <RevenueChart data={dailyChartData} />

            <TransactionsTable transactions={transactions} maxRows={10} />
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
            </Card>
            <TransactionsTable transactions={transactions} showProfit title="Все транзакции" />
          </TabsContent>

          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DateFilter
              dateFilter={dateFilter}
              customDateRange={customDateRange}
              onDateFilterChange={setDateFilter}
              onCustomDateChange={setCustomDateRange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductSalesChart 
                data={convertedStats.product_analytics} 
                displayCurrency={displayCurrency}
                useNetProfit={true}
              />
              <ProfitDynamicsChart
                data={analyticsChartData}
                grouping={analyticsGrouping}
                onGroupingChange={setAnalyticsGrouping}
              />
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseManager />
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