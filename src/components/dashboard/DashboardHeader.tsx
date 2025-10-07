import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface DashboardHeaderProps {
  displayCurrency: 'RUB' | 'USD';
  onCurrencyChange: (currency: 'RUB' | 'USD') => void;
  onNewTransaction: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
}

const DashboardHeader = ({ 
  displayCurrency, 
  onCurrencyChange, 
  onNewTransaction, 
  onLogout,
  isAdmin = false,
  exchangeRate,
  onExchangeRateChange
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon name="Package" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Админ-панель</h1>
              <p className="text-sm text-muted-foreground">Магазин цифровых товаров</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-muted rounded-lg">
              <span className="text-sm font-medium">Курс $:</span>
              <Input 
                type="number"
                value={exchangeRate}
                onChange={(e) => onExchangeRateChange(Number(e.target.value))}
                className="h-7 w-20 px-2 text-sm"
                min="1"
                step="0.01"
              />
            </div>
            <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-muted rounded-lg">
              <span className="text-sm font-medium">Валюта:</span>
              <Button 
                variant={displayCurrency === 'RUB' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => onCurrencyChange('RUB')}
                className="h-7 px-3"
              >
                ₽ RUB
              </Button>
              <Button 
                variant={displayCurrency === 'USD' ? 'default' : 'ghost'}
                size="sm" 
                onClick={() => onCurrencyChange('USD')}
                className="h-7 px-3"
              >
                $ USD
              </Button>
            </div>
            <Button onClick={onNewTransaction} className="bg-primary hover:bg-primary/90">
              <Icon name="Plus" size={16} className="mr-2" />
              Новая транзакция
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')}>
                <Icon name="Users" size={16} className="mr-2" />
                Пользователи
              </Button>
            )}
            <Button variant="outline" onClick={onLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;