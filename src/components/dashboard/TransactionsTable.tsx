import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  enablePagination?: boolean;
}

const TransactionsTable = ({ 
  transactions, 
  showProfit = false, 
  maxRows, 
  title = 'Последние транзакции',
  enablePagination = false
}: TransactionsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

  const totalPages = enablePagination ? Math.ceil(sortedTransactions.length / itemsPerPage) : 1;
  const startIndex = enablePagination ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = enablePagination ? startIndex + itemsPerPage : sortedTransactions.length;
  
  const displayTransactions = maxRows 
    ? sortedTransactions.slice(0, maxRows) 
    : sortedTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Activity" size={18} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enablePagination && sortedTransactions.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Показывать по:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">
              Показаны {startIndex + 1}-{Math.min(endIndex, sortedTransactions.length)} из {sortedTransactions.length}
            </span>
          </div>
        )}
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
                    {transaction.transaction_date ? new Date(transaction.transaction_date + 'T12:00:00').toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
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
        {enablePagination && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;