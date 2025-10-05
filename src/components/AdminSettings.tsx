import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { addAllowedUser } from '@/lib/api';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [telegramId, setTelegramId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addAllowedUser(parseInt(telegramId), username);
      
      if (result.success) {
        toast.success('Пользователь добавлен в белый список');
        setTelegramId('');
        setUsername('');
      } else {
        toast.error('Ошибка добавления пользователя');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Управление доступом</CardTitle>
          <CardDescription>
            Добавьте пользователей в белый список для доступа к системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram_id">Telegram ID пользователя</Label>
              <Input
                id="telegram_id"
                type="number"
                placeholder="123456789"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Пользователь может узнать свой ID у бота @userinfobot
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username (опционально)</Label>
              <Input
                id="username"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading || !telegramId}>
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" size={16} className="mr-2" />
                  Добавить пользователя
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Настройка Telegram Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="font-medium flex items-center gap-2">
              <Icon name="Info" size={16} className="text-primary" />
              Инструкция по настройке:
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
              <li>
                Создайте бота через <code className="bg-muted px-1 py-0.5 rounded">@BotFather</code> в Telegram
              </li>
              <li>
                Выполните команду <code className="bg-muted px-1 py-0.5 rounded">/setdomain</code> и укажите домен вашего сайта
              </li>
              <li>
                Скопируйте токен бота и добавьте его в секрет <code className="bg-muted px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code>
              </li>
              <li>
                В файле <code className="bg-muted px-1 py-0.5 rounded">TelegramAuth.tsx</code> замените <code className="bg-muted px-1 py-0.5 rounded">YOUR_BOT_USERNAME</code> на username вашего бота
              </li>
              <li>
                Добавьте свой Telegram ID в белый список через форму выше
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
