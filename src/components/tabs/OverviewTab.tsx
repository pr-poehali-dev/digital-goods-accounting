import DateFilter from '@/components/dashboard/DateFilter';
import StatsCards from '@/components/dashboard/StatsCards';
import AverageMetrics from '@/components/dashboard/AverageMetrics';
import RevenueChart from '@/components/dashboard/RevenueChart';

interface OverviewTabProps {
  dateFilter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
  customDateRange: { start: string; end: string };
  onDateFilterChange: (filter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom') => void;
  onCustomDateChange: (range: { start: string; end: string }) => void;
  convertedStats: any;
  actualTotalCosts: number;
  formatCurrency: (amount: number) => string;
  averageMetrics: any;
  dailyChartData: any[];
}

const OverviewTab = ({
  dateFilter,
  customDateRange,
  onDateFilterChange,
  onCustomDateChange,
  convertedStats,
  actualTotalCosts,
  formatCurrency,
  averageMetrics,
  dailyChartData
}: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      <DateFilter
        dateFilter={dateFilter}
        customDateRange={customDateRange}
        onDateFilterChange={onDateFilterChange}
        onCustomDateChange={onCustomDateChange}
      />

      <StatsCards stats={{...convertedStats, total_costs: actualTotalCosts}} formatCurrency={formatCurrency} />

      <AverageMetrics 
        data={averageMetrics} 
        formatCurrency={formatCurrency}
        dailyAnalytics={convertedStats.daily_analytics}
      />

      <RevenueChart data={dailyChartData} />
    </div>
  );
};

export default OverviewTab;