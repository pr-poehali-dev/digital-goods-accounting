import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface DateFilterProps {
  dateFilter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
  customDateRange: { start: string; end: string };
  onDateFilterChange: (filter: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom') => void;
  onCustomDateChange: (range: { start: string; end: string }) => void;
}

const DateFilter = ({ 
  dateFilter, 
  customDateRange, 
  onDateFilterChange, 
  onCustomDateChange 
}: DateFilterProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={dateFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('all')}
            >
              <Icon name="Infinity" size={14} className="mr-2" />
              Все время
            </Button>
            <Button 
              variant={dateFilter === 'today' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('today')}
            >
              <Icon name="Calendar" size={14} className="mr-2" />
              Сегодня
            </Button>
            <Button 
              variant={dateFilter === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('week')}
            >
              <Icon name="CalendarDays" size={14} className="mr-2" />
              Неделя
            </Button>
            <Button 
              variant={dateFilter === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('month')}
            >
              <Icon name="CalendarRange" size={14} className="mr-2" />
              Месяц
            </Button>
            <Button 
              variant={dateFilter === 'quarter' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('quarter')}
            >
              <Icon name="Calendar" size={14} className="mr-2" />
              Квартал
            </Button>
            <Button 
              variant={dateFilter === 'year' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('year')}
            >
              <Icon name="CalendarDays" size={14} className="mr-2" />
              Год
            </Button>
            <Button 
              variant={dateFilter === 'custom' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onDateFilterChange('custom')}
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
                onChange={(e) => onCustomDateChange({ ...customDateRange, start: e.target.value })}
                className="w-auto"
              />
              <span className="text-muted-foreground">—</span>
              <Input 
                type="date" 
                value={customDateRange.end}
                onChange={(e) => onCustomDateChange({ ...customDateRange, end: e.target.value })}
                className="w-auto"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DateFilter;