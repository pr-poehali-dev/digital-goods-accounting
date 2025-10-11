import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import ClientsBubbles from '@/components/clients/ClientsBubbles';

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

const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'purchases' | 'recent'>('revenue');

  useEffect(() => {
    loadClients();
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

  const calculateAutoImportance = (client: Client, allClients: Client[]): 'low' | 'medium' | 'high' | 'critical' => {
    const sortedByRevenue = [...allClients].sort((a, b) => b.total_revenue - a.total_revenue);
    const sortedByPurchases = [...allClients].sort((a, b) => b.purchase_count - a.purchase_count);
    const totalClients = allClients.length;
    
    const revenueIndex = sortedByRevenue.findIndex(c => 
      c.client_telegram === client.client_telegram && 
      c.client_name === client.client_name
    );
    const purchaseIndex = sortedByPurchases.findIndex(c => 
      c.client_telegram === client.client_telegram && 
      c.client_name === client.client_name
    );
    
    const revenuePercent = (revenueIndex / totalClients) * 100;
    const purchasePercent = (purchaseIndex / totalClients) * 100;
    const bestPercent = Math.min(revenuePercent, purchasePercent);
    
    if (bestPercent < 5 || client.purchase_count >= 20) return 'critical';
    if (bestPercent < 15 || client.purchase_count >= 10) return 'high';
    if (bestPercent < 50 || client.purchase_count >= 5) return 'medium';
    return 'low';
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
    } catch (error) {
      toast.error('Ошибка обновления клиента');
    }
  };

  const clientsWithAutoImportance = clients.map(client => ({
    ...client,
    importance: calculateAutoImportance(client, clients)
  }));

  const filteredClients = clientsWithAutoImportance
    .filter(client => {
      const matchesSearch = client.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.client_telegram?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesImportance = importanceFilter === 'all' || client.importance === importanceFilter;
      return matchesSearch && matchesImportance;
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.total_revenue - a.total_revenue;
      if (sortBy === 'purchases') return b.purchase_count - a.purchase_count;
      if (sortBy === 'recent') return new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime();
      return 0;
    });

  const stats = {
    total: clientsWithAutoImportance.length,
    critical: clientsWithAutoImportance.filter(c => c.importance === 'critical').length,
    high: clientsWithAutoImportance.filter(c => c.importance === 'high').length,
    medium: clientsWithAutoImportance.filter(c => c.importance === 'medium').length,
    low: clientsWithAutoImportance.filter(c => c.importance === 'low').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Загрузка клиентов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
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

          <Button onClick={loadClients} variant="outline">
            <Icon name="RefreshCw" size={18} />
            Обновить
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={importanceFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportanceFilter('all')}
            >
              Все ({stats.total})
            </Button>
            <Button
              variant={importanceFilter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportanceFilter('critical')}
              className="gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Критичные ({stats.critical})
            </Button>
            <Button
              variant={importanceFilter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportanceFilter('high')}
              className="gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              Высокая ({stats.high})
            </Button>
            <Button
              variant={importanceFilter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportanceFilter('medium')}
              className="gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Средняя ({stats.medium})
            </Button>
            <Button
              variant={importanceFilter === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportanceFilter('low')}
              className="gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              Низкая ({stats.low})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Сортировка:</span>
            <Button
              variant={sortBy === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('revenue')}
            >
              <Icon name="TrendingUp" size={16} />
              По доходу
            </Button>
            <Button
              variant={sortBy === 'purchases' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('purchases')}
            >
              <Icon name="ShoppingCart" size={16} />
              По покупкам
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
            >
              <Icon name="Clock" size={16} />
              По дате
            </Button>
          </div>
        </div>
      </div>

      <ClientsBubbles clients={filteredClients} onClientUpdate={updateClient} />
    </div>
  );
};

export default ClientsTab;