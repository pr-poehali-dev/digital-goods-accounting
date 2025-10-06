import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfitDynamicsChartProps {
  data: Array<{
    period: string;
    revenue: number;
    profit: number;
    costs: number;
    count: number;
    expenses: number;
    net_profit: number;
  }>;
  grouping: 'day' | 'week' | 'month' | 'quarter' | 'year';
  onGroupingChange: (grouping: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
}

const ProfitDynamicsChart = ({ data, grouping, onGroupingChange }: ProfitDynamicsChartProps) => {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Динамика прибыли</CardTitle>
          <div className="flex gap-1">
            <Button 
              variant={grouping === 'day' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onGroupingChange('day')}
            >
              День
            </Button>
            <Button 
              variant={grouping === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onGroupingChange('week')}
            >
              Неделя
            </Button>
            <Button 
              variant={grouping === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onGroupingChange('month')}
            >
              Месяц
            </Button>
            <Button 
              variant={grouping === 'quarter' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onGroupingChange('quarter')}
            >
              Квартал
            </Button>
            <Button 
              variant={grouping === 'year' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onGroupingChange('year')}
            >
              Год
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis 
              dataKey="period" 
              stroke="hsl(215, 16%, 65%)" 
              fontSize={12}
              angle={grouping === 'day' ? -45 : 0}
              textAnchor={grouping === 'day' ? 'end' : 'middle'}
              height={grouping === 'day' ? 60 : 30}
            />
            <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" radius={[8, 8, 0, 0]} name="Прибыль" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProfitDynamicsChart;
