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
  const [selectedImportance, setSelectedImportance] = useState<Set<string>>(new Set(['all']));

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
    const totalClients = allClients.length;
    
    const revenueIndex = sortedByRevenue.findIndex(c => 
      c.client_telegram === client.client_telegram && 
      c.client_name === client.client_name
    );
    
    const revenuePercent = (revenueIndex / totalClients) * 100;
    
    if (revenuePercent < 5) return 'critical';
    if (revenuePercent < 15) return 'high';
    if (revenuePercent < 50) return 'medium';
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

  const toggleImportance = (importance: string) => {
    const newSelected = new Set(selectedImportance);
    if (importance === 'all') {
      setSelectedImportance(new Set(['all']));
    } else {
      newSelected.delete('all');
      if (newSelected.has(importance)) {
        newSelected.delete(importance);
      } else {
        newSelected.add(importance);
      }
      if (newSelected.size === 0) {
        setSelectedImportance(new Set(['all']));
      } else {
        setSelectedImportance(newSelected);
      }
    }
  };

  const filteredClients = clientsWithAutoImportance
    .filter(client => {
      const matchesSearch = client.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.client_telegram?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesImportance = selectedImportance.has('all') || selectedImportance.has(client.importance);
      return matchesSearch && matchesImportance;
    })
    .sort((a, b) => b.total_revenue - a.total_revenue);

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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedImportance.has('all') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleImportance('all')}
          >
            Все ({stats.total})
          </Button>
          <Button
            variant={selectedImportance.has('critical') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleImportance('critical')}
            className="gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Критичные ({stats.critical})
          </Button>
          <Button
            variant={selectedImportance.has('high') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleImportance('high')}
            className="gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Высокая ({stats.high})
          </Button>
          <Button
            variant={selectedImportance.has('medium') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleImportance('medium')}
            className="gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Средняя ({stats.medium})
          </Button>
          <Button
            variant={selectedImportance.has('low') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleImportance('low')}
            className="gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            Низкая ({stats.low})
          </Button>
        </div>
      </div>

      <ClientsBubbles clients={filteredClients} onClientUpdate={updateClient} />
    </div>
  );
};

export default ClientsTab;