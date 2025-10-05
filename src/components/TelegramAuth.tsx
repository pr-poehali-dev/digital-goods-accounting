import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface TelegramAuthProps {
  onAuthenticated: (user: any) => void;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

const TelegramAuth = ({ onAuthenticated }: TelegramAuthProps) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('telegram_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        onAuthenticated(user);
      } catch (e) {
        localStorage.removeItem('telegram_user');
      }
    }

    window.onTelegramAuth = async (user: any) => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('https://functions.poehali.dev/0fe2adb1-b56f-4acd-aa46-246d52206d4d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          localStorage.setItem('telegram_user', JSON.stringify(result.user));
          onAuthenticated(result.user);
        } else {
          setError(result.error || 'Доступ запрещён. Обратитесь к администратору.');
        }
      } catch (err) {
        setError('Ошибка подключения к серверу');
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [onAuthenticated]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <Icon name="Send" size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Войдите через Telegram для доступа к админ-панели
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={32} className="animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <Icon name="AlertCircle" size={16} className="text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div id="telegram-login-container" className="flex justify-center"></div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Icon name="Info" size={16} className="text-primary" />
                Инструкция:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
                <li>Создайте бота через @BotFather в Telegram</li>
                <li>Укажите username бота в настройках</li>
                <li>Добавьте TELEGRAM_BOT_TOKEN в секреты проекта</li>
                <li>Добавьте свой Telegram ID в белый список</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramAuth;
