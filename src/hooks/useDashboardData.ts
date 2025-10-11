import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStats, getTransactions } from '@/lib/api';
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

export const useDashboardData = (
  dateFilter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom',
  customDateRange: { start: string; end: string },
  exchangeRate: number,
  isAuthenticated: boolean
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const loadData = useCallback(async () => {
    try {
      const startDate = dateFilter === 'custom' ? customDateRange.start : undefined;
      const endDate = dateFilter === 'custom' ? customDateRange.end : undefined;
      
      const [statsResult, transactionsResult] = await Promise.all([
        getStats(dateFilter, startDate, endDate, exchangeRate),
        getTransactions(),
      ]);
      
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
  }, [dateFilter, customDateRange, exchangeRate]);

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

  return { transactions, stats, loadData };
};
