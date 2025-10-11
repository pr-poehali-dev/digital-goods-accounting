import { useCallback, useMemo } from 'react';

export const useCurrencyConversion = (
  displayCurrency: 'RUB' | 'USD',
  exchangeRate: number,
  stats: any
) => {
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

  return { convertAmount, formatCurrency, convertedStats };
};
