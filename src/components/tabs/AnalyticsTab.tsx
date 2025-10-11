import DateFilter from '@/components/dashboard/DateFilter';
import ProductSalesChart from '@/components/dashboard/ProductSalesChart';
import ProfitDynamicsChart from '@/components/dashboard/ProfitDynamicsChart';

interface AnalyticsTabProps {
  dateFilter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
  customDateRange: { start: string; end: string };
  onDateFilterChange: (filter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom') => void;
  onCustomDateChange: (range: { start: string; end: string }) => void;
  convertedStats: any;
  displayCurrency: 'RUB' | 'USD';
  analyticsChartData: any[];
  analyticsGrouping: 'day' | 'week' | 'month' | 'quarter' | 'year';
  onGroupingChange: (grouping: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
}

const AnalyticsTab = ({
  dateFilter,
  customDateRange,
  onDateFilterChange,
  onCustomDateChange,
  convertedStats,
  displayCurrency,
  analyticsChartData,
  analyticsGrouping,
  onGroupingChange
}: AnalyticsTabProps) => {
  return (
    <div className="space-y-6">
      <DateFilter
        dateFilter={dateFilter}
        customDateRange={customDateRange}
        onDateFilterChange={onDateFilterChange}
        onCustomDateChange={onCustomDateChange}
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
          onGroupingChange={onGroupingChange}
        />
      </div>
    </div>
  );
};

export default AnalyticsTab;
