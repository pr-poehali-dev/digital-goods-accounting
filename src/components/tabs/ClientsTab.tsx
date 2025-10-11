import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import ClientsGraph from '@/components/clients/ClientsGraph';

interface Client {
  id: number;
  client_telegram: string;
  client_name: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  comments: string;
  total_revenue: number;
  purchase_count: number;
  avg_check: number;
  first_purchase: string;
  last_purchase: string;
}

interface ClientConnection {
  id: number;
  client_id_from: number;
  client_id_to: number;
  connection_type: string;
  description: string;
}

const importanceColors = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const importanceLabels = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
  critical: 'Критичный'
};

const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [connections, setConnections] = useState<ClientConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'purchases' | 'avg_check'>('revenue');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [connectionDialog, setConnectionDialog] = useState(false);
  const [newConnection, setNewConnection] = useState({
    from: '',
    to: '',
    type: '',
    description: ''
  });

  useEffect(() => {
    loadClients();
    loadConnections();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetch('https://functions.poehali.dev/a6283aac-d0f5-49a0-9a1d-114c69ecf88d?action=list');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      toast.error('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const res = await fetch('https://functions.poehali.dev/a6283aac-d0f5-49a0-9a1d-114c69ecf88d?action=connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Ошибка загрузки связей');
    }
  };

  const updateClient = async (clientId: number, updates: Partial<Client>) => {
    try {
      const res = await fetch('https://functions.poehali.dev/a6283aac-d0f5-49a0-9a1d-114c69ecf88d?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id: clientId, ...updates })
      });

      if (!res.ok) throw new Error('Ошибка обновления');

      toast.success('Клиент обновлён');
      loadClients();
      setDialogOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast.error('Ошибка обновления клиента');
    }
  };

  const addConnection = async () => {
    if (!newConnection.from || !newConnection.to || !newConnection.type) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const res = await fetch('https://functions.poehali.dev/a6283aac-d0f5-49a0-9a1d-114c69ecf88d?action=add-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_telegram_from: newConnection.from,
          client_telegram_to: newConnection.to,
          connection_type: newConnection.type,
          description: newConnection.description
        })
      });

      if (!res.ok) throw new Error('Ошибка создания связи');

      toast.success('Связь создана');
      loadConnections();
      setConnectionDialog(false);
      setNewConnection({ from: '', to: '', type: '', description: '' });
    } catch (error) {
      toast.error('Ошибка создания связи');
    }
  };

  const filteredClients = clients
    .filter(client => 
      client.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_telegram?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.total_revenue - a.total_revenue;
      if (sortBy === 'purchases') return b.purchase_count - a.purchase_count;
      if (sortBy === 'avg_check') return b.avg_check - a.avg_check;
      return 0;
    });

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск клиента..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">По доходу</SelectItem>
            <SelectItem value="purchases">По покупкам</SelectItem>
            <SelectItem value="avg_check">По среднему чеку</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => setShowGraph(!showGraph)}>
          <Icon name={showGraph ? "List" : "Network"} size={18} />
          {showGraph ? 'Список' : 'Граф связей'}
        </Button>

        <Button onClick={() => setConnectionDialog(true)}>
          <Icon name="Link" size={18} />
          Добавить связь
        </Button>
      </div>

      {showGraph ? (
        <ClientsGraph clients={filteredClients} connections={connections} />
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={20} className="text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{client.client_name || 'Без имени'}</h3>
                    </div>
                    <Badge className={importanceColors[client.importance]}>
                      {importanceLabels[client.importance]}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {client.client_telegram}
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Доход</div>
                      <div className="font-semibold text-lg">{client.total_revenue.toLocaleString()} ₽</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Покупки</div>
                      <div className="font-semibold text-lg">{client.purchase_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Средний чек</div>
                      <div className="font-semibold text-lg">{client.avg_check.toLocaleString()} ₽</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Последняя покупка</div>
                      <div className="font-medium">
                        {new Date(client.last_purchase).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>

                  {client.comments && (
                    <div className="text-sm bg-muted p-3 rounded-md">
                      <Icon name="MessageSquare" size={14} className="inline mr-2" />
                      {client.comments}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingClient(client);
                    setDialogOpen(true);
                  }}
                >
                  <Icon name="Edit" size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
          </DialogHeader>

          {editingClient && (
            <div className="space-y-4">
              <div>
                <Label>Важность</Label>
                <Select
                  value={editingClient.importance}
                  onValueChange={(v: any) => setEditingClient({ ...editingClient, importance: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкая</SelectItem>
                    <SelectItem value="medium">Средняя</SelectItem>
                    <SelectItem value="high">Высокая</SelectItem>
                    <SelectItem value="critical">Критичный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Комментарии</Label>
                <Textarea
                  value={editingClient.comments || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, comments: e.target.value })}
                  placeholder="Заметки о клиенте..."
                  rows={4}
                />
              </div>

              <Button
                onClick={() => updateClient(editingClient.id, {
                  importance: editingClient.importance,
                  comments: editingClient.comments
                })}
                className="w-full"
              >
                Сохранить
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={connectionDialog} onOpenChange={setConnectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить связь</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Клиент 1 (Telegram)</Label>
              <Input
                value={newConnection.from}
                onChange={(e) => setNewConnection({ ...newConnection, from: e.target.value })}
                placeholder="@username"
              />
            </div>

            <div>
              <Label>Клиент 2 (Telegram)</Label>
              <Input
                value={newConnection.to}
                onChange={(e) => setNewConnection({ ...newConnection, to: e.target.value })}
                placeholder="@username"
              />
            </div>

            <div>
              <Label>Тип связи</Label>
              <Input
                value={newConnection.type}
                onChange={(e) => setNewConnection({ ...newConnection, type: e.target.value })}
                placeholder="Партнёры, коллеги, родственники..."
              />
            </div>

            <div>
              <Label>Описание</Label>
              <Textarea
                value={newConnection.description}
                onChange={(e) => setNewConnection({ ...newConnection, description: e.target.value })}
                placeholder="Дополнительная информация..."
                rows={3}
              />
            </div>

            <Button onClick={addConnection} className="w-full">
              Добавить связь
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsTab;