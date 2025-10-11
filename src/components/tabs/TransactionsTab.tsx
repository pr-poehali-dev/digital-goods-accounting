import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import TransactionsTable from '@/components/dashboard/TransactionsTable';
import { toast } from 'sonner';

interface Transaction {
  id: number;
  transaction_code: string;
  product_id: number;
  product_name: string;
  client_telegram: string;
  client_name: string;
  amount: number;
  cost_price: number;
  profit: number;
  status: string;
  transaction_date: string;
  notes: string;
  currency: string;
}

interface TransactionsTabProps {
  transactions: Transaction[];
  transactionFilters: {
    status: string;
    product: string;
    dateFrom: string;
    dateTo: string;
    searchText: string;
  };
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  setTransactionFilters: (filters: any) => void;
  onDelete: (id: number) => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionsTab = ({
  transactions,
  transactionFilters,
  showFilters,
  setShowFilters,
  setTransactionFilters,
  onDelete,
  onEdit
}: TransactionsTabProps) => {
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (transactionFilters.status !== 'all' && t.status !== transactionFilters.status) return false;
      if (transactionFilters.product !== 'all' && t.product_id.toString() !== transactionFilters.product) return false;
      
      if (transactionFilters.dateFrom) {
        if (t.transaction_date < transactionFilters.dateFrom) return false;
      }
      
      if (transactionFilters.dateTo) {
        if (t.transaction_date > transactionFilters.dateTo) return false;
      }
      
      if (transactionFilters.searchText) {
        const searchLower = transactionFilters.searchText.toLowerCase();
        const matchesSearch = 
          t.transaction_code.toLowerCase().includes(searchLower) ||
          t.product_name.toLowerCase().includes(searchLower) ||
          t.client_telegram?.toLowerCase().includes(searchLower) ||
          t.client_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [transactions, transactionFilters]);

  const uniqueProducts = useMemo(() => {
    const products = new Map<number, string>();
    transactions.forEach(t => {
      if (!products.has(t.product_id)) {
        products.set(t.product_id, t.product_name);
      }
    });
    return Array.from(products.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  const exportTransactions = () => {
    const csv = [
      ['ID', 'Дата', 'Клиент', 'Товар', 'Сумма', 'Валюта', 'Прибыль', 'Статус'].join(';'),
      ...filteredTransactions.map(t => [
        t.transaction_code,
        t.transaction_date,
        t.client_telegram || t.client_name,
        t.product_name,
        t.amount,
        t.currency,
        t.profit,
        t.status
      ].join(';'))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Экспорт завершён');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Все транзакции</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icon name="Filter" size={16} className="mr-2" />
              Фильтры
            </Button>
            <Button variant="outline" size="sm" onClick={exportTransactions}>
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус</label>
                <Select value={transactionFilters.status} onValueChange={(v) => setTransactionFilters((prev: any) => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="completed">Завершена</SelectItem>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="failed">Отклонена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Товар</label>
                <Select value={transactionFilters.product} onValueChange={(v) => setTransactionFilters((prev: any) => ({ ...prev, product: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все товары</SelectItem>
                    {uniqueProducts.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата с</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={transactionFilters.dateFrom}
                  onChange={(e) => setTransactionFilters((prev: any) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата по</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={transactionFilters.dateTo}
                  onChange={(e) => setTransactionFilters((prev: any) => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Поиск</label>
                <input 
                  type="text" 
                  placeholder="ID, клиент, товар..."
                  className="w-full px-3 py-2 border rounded-md"
                  value={transactionFilters.searchText}
                  onChange={(e) => setTransactionFilters((prev: any) => ({ ...prev, searchText: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTransactionFilters({ status: 'all', product: 'all', dateFrom: '', dateTo: '', searchText: '' })}
              >
                Сбросить фильтры
              </Button>
              <span className="text-sm text-muted-foreground flex items-center">
                Найдено: {filteredTransactions.length} из {transactions.length}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
      <TransactionsTable 
        transactions={filteredTransactions} 
        showProfit 
        title="Все транзакции" 
        enablePagination 
        onDelete={onDelete} 
        onEdit={onEdit} 
      />
    </div>
  );
};

export default TransactionsTab;