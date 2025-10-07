import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/338f0226-d697-40a5-aef0-26885d9a1f23';

interface ExpenseType {
  id: number;
  name: string;
  description: string;
}

interface Expense {
  id: number;
  expense_type_id: number;
  expense_type_name: string;
  amount: number;
  description: string;
  start_date: string;
  end_date: string | null;
  distribution_type: string;
  status: string;
  currency?: string;
}

const ExpenseManager = () => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    expense_type_id: '',
    amount: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    distribution_type: 'one_time',
    currency: 'RUB',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const mockTypes = [
        { id: 1, name: 'Маркетинг', description: 'Расходы на рекламу' },
        { id: 2, name: 'Зарплаты', description: 'Выплаты сотрудникам' },
      ];
      
      const mockExpenses = [
        {
          id: 1,
          expense_type_id: 1,
          expense_type_name: 'Маркетинг',
          amount: 50000,
          description: 'Реклама в соцсетях',
          start_date: '2024-10-01',
          end_date: null,
          distribution_type: 'one_time',
          status: 'active',
          currency: 'RUB'
        }
      ];
      
      setExpenseTypes(mockTypes);
      setExpenses(mockExpenses);
      return;

      const [typesRes, expensesRes] = await Promise.all([
        fetch(`${API_URL}?action=types`),
        fetch(API_URL),
      ]);

      const typesData = await typesRes.json();
      const expensesData = await expensesRes.json();

      setExpenseTypes(typesData.expense_types || []);
      setExpenses(expensesData.expenses || []);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    }
  };

  const createType = async () => {
    if (!typeForm.name) {
      toast.error('Введите название типа расхода');
      return;
    }

    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_type',
          name: typeForm.name,
          description: typeForm.description,
        }),
      });

      toast.success('Тип расхода создан');
      setTypeDialogOpen(false);
      setTypeForm({ name: '', description: '' });
      loadData();
    } catch (error) {
      toast.error('Ошибка создания типа');
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async () => {
    if (!expenseForm.expense_type_id || !expenseForm.amount || !expenseForm.start_date) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_type_id: parseInt(expenseForm.expense_type_id),
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
          start_date: expenseForm.start_date,
          end_date: expenseForm.end_date || null,
          distribution_type: expenseForm.distribution_type,
          currency: expenseForm.currency,
        }),
      });

      toast.success('Расход добавлен');
      setExpenseDialogOpen(false);
      setExpenseForm({
        expense_type_id: '',
        amount: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        distribution_type: 'one_time',
        currency: 'RUB',
      });
      loadData();
    } catch (error) {
      toast.error('Ошибка добавления расхода');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Удалить этот расход?')) return;

    try {
      await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      toast.success('Расход удалён');
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button onClick={() => setExpenseDialogOpen(true)}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить расход
        </Button>
        <Button variant="outline" onClick={() => setTypeDialogOpen(true)}>
          <Icon name="FolderPlus" size={16} className="mr-2" />
          Новый тип расхода
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Расходы</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Расходов пока нет</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>Распределение</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.expense_type_name}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.description || '—'}</TableCell>
                    <TableCell className="font-semibold">{expense.currency === 'USD' ? '$' : '₽'}{expense.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(expense.start_date).toLocaleDateString('ru')}
                      {expense.end_date && ` — ${new Date(expense.end_date).toLocaleDateString('ru')}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expense.distribution_type === 'distributed' ? 'default' : 'secondary'}>
                        {expense.distribution_type === 'distributed' ? 'Распределённый' : 'Разовый'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый тип расхода</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type_name">Название</Label>
              <Input
                id="type_name"
                placeholder="Зарплата, реклама, аренда..."
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_description">Описание</Label>
              <Textarea
                id="type_description"
                placeholder="Дополнительная информация"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createType} disabled={loading} className="flex-1">
                Создать
              </Button>
              <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить расход</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense_type">Тип расхода</Label>
              <Select
                value={expenseForm.expense_type_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, expense_type_id: value })}
              >
                <SelectTrigger id="expense_type">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Валюта</Label>
              <RadioGroup value={expenseForm.currency} onValueChange={(value) => setExpenseForm({ ...expenseForm, currency: value })}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RUB" id="expense-rub" />
                    <Label htmlFor="expense-rub" className="font-normal cursor-pointer">₽ Рубли</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="USD" id="expense-usd" />
                    <Label htmlFor="expense-usd" className="font-normal cursor-pointer">$ Доллары</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма ({expenseForm.currency === 'RUB' ? '₽' : '$'})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="10000"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distribution">Тип распределения</Label>
              <Select
                value={expenseForm.distribution_type}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, distribution_type: value })}
              >
                <SelectTrigger id="distribution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">Разовый расход</SelectItem>
                  <SelectItem value="distributed">Распределённый по дням</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Дата начала</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={expenseForm.start_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, start_date: e.target.value })}
                />
              </div>

              {expenseForm.distribution_type === 'distributed' && (
                <div className="space-y-2">
                  <Label htmlFor="end_date">Дата окончания</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={expenseForm.end_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, end_date: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_description">Описание</Label>
              <Textarea
                id="expense_description"
                placeholder="Комментарий к расходу"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createExpense} disabled={loading} className="flex-1">
                Добавить
              </Button>
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManager;