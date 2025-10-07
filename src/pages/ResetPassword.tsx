import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    if (!email || !newPassword) {
      toast.error('Заполните все поля');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/0fe2adb1-b56f-4acd-aa46-246d52206d4d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reset_password',
          email: email,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Пароль успешно изменён! Теперь можете войти с новым паролем');
        setEmail('');
        setNewPassword('');
      } else {
        toast.error(data.error || 'Ошибка смены пароля');
      }
    } catch (error) {
      toast.error('Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Key" size={32} className="text-emerald-400" />
            <CardTitle className="text-white text-2xl">Сброс пароля</CardTitle>
          </div>
          <p className="text-slate-400 text-sm">
            Введите email и новый пароль для сброса
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ваш@email.com"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Новый пароль (минимум 6 символов)</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Введите новый пароль"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button 
            onClick={resetPassword} 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            {loading ? 'Сброс...' : 'Сбросить пароль'}
          </Button>
          <div className="pt-4 border-t border-slate-700">
            <a 
              href="/login" 
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Вернуться на страницу входа
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
