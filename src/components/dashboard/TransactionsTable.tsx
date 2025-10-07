import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';

interface Transaction {
  id: number;
  transaction_code: string;
  product_name: string;
  client_telegram: string;
  client_name: string;
  amount: number;
  profit: number;
  status: string;
  transaction_date: string;
  currency?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  showProfit?: boolean;
  maxRows?: number;
  title?: string;
}

const TransactionsTable = ({ 
  transactions, 
  showProfit = false, 
  maxRows, 
  title = 'Последние транзакции' 
}: TransactionsTableProps) => {
  const displayTransactions = maxRows ? transactions.slice(0, maxRows) : transactions;

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Activity" size={18} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Транзакций пока нет</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Товар</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                {showProfit && <TableHead className="text-right">Прибыль</TableHead>}
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{transaction.transaction_code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString('ru')}
                  </TableCell>
                  <TableCell>
                    {transaction.client_telegram ? (
                      <span className="text-primary">{transaction.client_telegram}</span>
                    ) : (
                      transaction.client_name || '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{transaction.product_name}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {transaction.currency === 'USD' ? '$' : '₽'}{transaction.amount.toLocaleString()}
                  </TableCell>
                  {showProfit && (
                    <TableCell className="text-right text-green-600 font-semibold">
                      {transaction.currency === 'USD' ? '$' : '₽'}{transaction.profit.toLocaleString()}
                    </TableCell>
                  )}
                  <TableCell>
                    {transaction.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Завершена
                      </Badge>
                    )}
                    {transaction.status === 'pending' && (
                      <Badge variant="secondary">Ожидает</Badge>
                    )}
                    {transaction.status === 'failed' && (
                      <Badge variant="destructive">Отклонена</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;