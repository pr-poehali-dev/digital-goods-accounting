import { useMemo, useCallback } from 'react';

export const useDashboardMetrics = (convertedStats: any) => {
  const dailyChartData = useMemo(() => {
    if (!convertedStats.daily_analytics || convertedStats.daily_analytics.length === 0) return [];
    
    return convertedStats.daily_analytics.map((day: any) => {
      const dayRevenue = day.revenue || 0;
      const dayProfit = day.profit || 0;
      const transactionCosts = dayRevenue - dayProfit;
      const dayExpenses = day.expenses || 0;
      const dayCosts = transactionCosts + dayExpenses;
      
      return {
        date: new Date(day.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        revenue: Math.round(dayRevenue),
        costs: Math.round(dayCosts),
        profit: Math.round(dayProfit),
      };
    });
  }, [convertedStats]);

  const actualTotalCosts = useMemo(() => {
    if (!convertedStats.daily_analytics || convertedStats.daily_analytics.length === 0) return 0;
    
    return convertedStats.daily_analytics.reduce((total: number, day: any) => {
      const dayRevenue = day.revenue || 0;
      const dayProfit = day.profit || 0;
      const transactionCosts = dayRevenue - dayProfit;
      const dayExpenses = day.expenses || 0;
      return total + transactionCosts + dayExpenses;
    }, 0);
  }, [convertedStats]);

  const averageMetrics = useMemo(() => {
    if (!convertedStats.daily_analytics || convertedStats.daily_analytics.length === 0) {
      return { avgSalesPerDay: 0, avgProfitPerDay: 0, avgCheck: 0, avgMargin: 0 };
    }

    const days = convertedStats.daily_analytics.length;
    const totalCount = convertedStats.daily_analytics.reduce((sum: number, d: any) => sum + (d.count || 0), 0);
    const totalProfit = convertedStats.daily_analytics.reduce((sum: number, d: any) => sum + (d.profit || 0), 0);
    const totalRevenue = convertedStats.daily_analytics.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0);
    const totalCosts = totalRevenue - totalProfit;

    return {
      avgSalesPerDay: totalCount / days,
      avgProfitPerDay: totalProfit / days,
      avgCheck: totalCount > 0 ? totalRevenue / totalCount : 0,
      avgMargin: totalCosts > 0 ? totalRevenue / totalCosts : 0
    };
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
          const dayOfWeek = weekStart.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          weekStart.setDate(weekStart.getDate() + diff);
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

  return { dailyChartData, actualTotalCosts, averageMetrics, groupDataByPeriod };
};