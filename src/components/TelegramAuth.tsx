import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { checkAuth } from '@/lib/api';

interface TelegramAuthProps {
  onAuthenticated: () => void;
}

const TelegramAuth = ({ onAuthenticated }: TelegramAuthProps) => {
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem('telegram_id');
    if (storedId) {
      handleAuth(storedId);
    }
  }, []);

  const handleAuth = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      const result = await checkAuth(parseInt(id));
      
      if (result.allowed) {
        localStorage.setItem('telegram_id', id);
        onAuthenticated();
      } else {
        setError('Доступ запрещен. Обратитесь к администратору.');
      }
    } catch (err) {
      setError('Ошибка подключения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (telegramId) {
      handleAuth(telegramId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <Icon name="Lock" size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Введите ваш Telegram ID для доступа к админ-панели
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram_id">Telegram ID</Label>
              <Input
                id="telegram_id"
                type="number"
                placeholder="123456789"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Узнать свой ID можно у бота @userinfobot
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <Icon name="AlertCircle" size={16} className="text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !telegramId}>
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Проверка доступа...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={16} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramAuth;
