import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string | null;
  last_login: string | null;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    is_admin: false
  });
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const authToken = localStorage.getItem('auth_token');

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (!authToken || !userStr) {
      navigate('/login');
      return;
    }
    
    try {
      const currentUser = JSON.parse(userStr);
      if (!currentUser.is_admin) {
        toast.error('Доступ запрещён');
        navigate('/');
        return;
      }
    } catch (e) {
      navigate('/login');
      return;
    }
    
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/0fe2adb1-b56f-4acd-aa46-246d52206d4d?action=users', {
        method: 'GET',
        headers: {
          'X-Auth-Token': authToken || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('Заполните все поля');
      return;
    }

    toast.error('Создание пользователей временно недоступно. Обновите подписку на poehali.dev/p/pay');
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    toast.error('Управление пользователями временно недоступно');
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    if (!selectedUserId) {
      toast.error('Пользователь не выбран');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/0fe2adb1-b56f-4acd-aa46-246d52206d4d', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken || ''
        },
        body: JSON.stringify({
          action: 'update',
          user_id: selectedUserId,
          password: newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка смены пароля');
      }

      toast.success('Пароль успешно изменён');
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUserId(null);
    } catch (error) {
      toast.error('Не удалось изменить пароль');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Icon name="Users" size={32} className="text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline" className="border-slate-600 text-slate-200">
              <Icon name="BarChart3" size={20} className="mr-2" />
              Дашборд
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-slate-600 text-slate-200">
              <Icon name="LogOut" size={20} className="mr-2" />
              Выход
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Пользователи системы</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Icon name="UserPlus" size={20} className="mr-2" />
                    Создать пользователя
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Новый пользователь</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Email</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-200">Полное имя</Label>
                      <Input
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-200">Пароль</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newUser.is_admin}
                        onCheckedChange={(checked) => setNewUser({ ...newUser, is_admin: checked })}
                      />
                      <Label className="text-slate-200">Администратор</Label>
                    </div>
                    <Button onClick={createUser} className="w-full bg-emerald-500 hover:bg-emerald-600">
                      Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{user.full_name}</p>
                      {user.is_admin && (
                        <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                          Админ
                        </span>
                      )}
                      {!user.is_active && (
                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                          Неактивен
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Создан: {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'}
                      {user.last_login && ` • Последний вход: ${new Date(user.last_login).toLocaleDateString('ru-RU')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setIsPasswordDialogOpen(true);
                      }}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      <Icon name="Key" size={16} className="mr-2" />
                      Сменить пароль
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={user.email === currentUser.email}
                      />
                      <span className="text-sm text-slate-400">
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Сменить пароль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <div className="flex gap-2">
                <Button 
                  onClick={changePassword} 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  Сменить пароль
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    setNewPassword('');
                    setSelectedUserId(null);
                  }}
                  className="border-slate-600 text-slate-200"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;