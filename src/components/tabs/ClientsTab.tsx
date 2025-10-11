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

  const filteredClients = clients.filter(client => 
    client.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_telegram?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <ClientsBubbles clients={filteredClients} onClientUpdate={updateClient} />
    </div>
  );
};

export default ClientsTab;
