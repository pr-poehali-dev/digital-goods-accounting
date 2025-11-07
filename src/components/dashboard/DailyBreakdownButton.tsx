import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DailyCostBreakdownDialog from '@/components/DailyCostBreakdownDialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DailyBreakdownButtonProps {
  exchangeRate: number;
  formatCurrency: (amount: number) => string;
}

const DailyBreakdownButton = ({ exchangeRate, formatCurrency }: DailyBreakdownButtonProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setPopoverOpen(false);
      setBreakdownOpen(true);
    }
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Icon name="Search" size={16} />
            Детализация расходов по дню
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            locale={ru}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <DailyCostBreakdownDialog
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
        date={date ? format(date, 'yyyy-MM-dd') : ''}
        exchangeRate={exchangeRate}
        formatCurrency={formatCurrency}
      />
    </>
  );
};

export default DailyBreakdownButton;
