import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ProductManager from '@/components/ProductManager';
import TransactionForm from '@/components/TransactionForm';
import ExpenseManager from '@/components/ExpenseManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import OverviewTab from '@/components/tabs/OverviewTab';
import TransactionsTab from '@/components/tabs/TransactionsTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { deleteTransaction } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
  id: number;
  transaction_code: string;
  product_id: number;
  product_name: string;
  client_telegram: string;
  client_name: string;
  amount: number;
  cost_price: number;
  profit: number;
  status: string;
  transaction_date: string;
  notes: string;
  currency: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [displayCurrency, setDisplayCurrency] = useState<'RUB' | 'USD'>('RUB');
  const [exchangeRate, setExchangeRate] = useState(82);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [analyticsGrouping, setAnalyticsGrouping] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFilters, setTransactionFilters] = useState({
    status: 'all',
    product: 'all',
    dateFrom: '',
    dateTo: '',
    searchText: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
        const data = await res.json();
        if (data?.Valute?.USD?.Value) {
          setExchangeRate(data.Valute.USD.Value);
        }
      } catch {
        setExchangeRate(82);
      }
    };
    fetchRate();
  }, []);

  const { transactions, stats, loadData } = useDashboardData(
    dateFilter,
    customDateRange,
    exchangeRate,
    isAuthenticated
  );

  const { convertedStats, formatCurrency } = useCurrencyConversion(
    displayCurrency,
    exchangeRate,
    stats
  );

  const { dailyChartData, actualTotalCosts, averageMetrics, groupDataByPeriod } = useDashboardMetrics(convertedStats);

  const analyticsChartData = useMemo(() => {
    if (!convertedStats.daily_analytics) return [];
    return groupDataByPeriod(convertedStats.daily_analytics, analyticsGrouping);
  }, [convertedStats.daily_analytics, analyticsGrouping, groupDataByPeriod]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Удалить транзакцию?')) return;
    
    try {
      await deleteTransaction(id);
      toast.success('Транзакция удалена');
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormOpen(true);
  };

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

          <TabsContent value="overview">
            <OverviewTab
              dateFilter={dateFilter}
              customDateRange={customDateRange}
              onDateFilterChange={setDateFilter}
              onCustomDateChange={setCustomDateRange}
              convertedStats={convertedStats}
              actualTotalCosts={actualTotalCosts}
              formatCurrency={formatCurrency}
              averageMetrics={averageMetrics}
              dailyChartData={dailyChartData}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab
              transactions={transactions}
              transactionFilters={transactionFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              setTransactionFilters={setTransactionFilters}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
            />
          </TabsContent>

          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab
              dateFilter={dateFilter}
              customDateRange={customDateRange}
              onDateFilterChange={setDateFilter}
              onCustomDateChange={setCustomDateRange}
              convertedStats={convertedStats}
              displayCurrency={displayCurrency}
              analyticsChartData={analyticsChartData}
              analyticsGrouping={analyticsGrouping}
              onGroupingChange={setAnalyticsGrouping}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseManager />
          </TabsContent>
        </Tabs>
      </div>

      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={(open) => {
          setTransactionFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        onSuccess={loadData}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Index;
