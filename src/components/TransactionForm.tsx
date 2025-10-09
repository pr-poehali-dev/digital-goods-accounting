import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { getProducts, createTransaction, updateTransaction } from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  cost_price: number;
  sale_price: number;
  margin: number;
  currency?: string;
  cost_price_usd?: number;
  sale_price_usd?: number;
}

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

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
}

const TransactionForm = ({ open, onOpenChange, onSuccess, editingTransaction }: TransactionFormProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    client_telegram: '',
    client_name: '',
    status: 'completed',
    notes: '',
    custom_amount: '',
    custom_cost_price: '',
    currency: 'RUB',
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '1',
  });

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  useEffect(() => {
    if (open && editingTransaction) {
      console.log('🔍 editingTransaction:', editingTransaction);
      console.log('🔍 product_id:', editingTransaction.product_id);
      setTimeout(() => {
        const newData = {
          product_id: editingTransaction.product_id.toString(),
          client_telegram: editingTransaction.client_telegram || '',
          client_name: editingTransaction.client_name || '',
          status: editingTransaction.status,
          notes: editingTransaction.notes || '',
          custom_amount: editingTransaction.amount.toString(),
          custom_cost_price: editingTransaction.cost_price.toString(),
          currency: editingTransaction.currency || 'RUB',
          transaction_date: editingTransaction.transaction_date || new Date().toISOString().split('T')[0],
          quantity: '1',
        };
        console.log('📝 Setting formData:', newData);
        setFormData(newData);
      }, 100);
    } else if (open && !editingTransaction) {
      setFormData({
        product_id: '',
        client_telegram: '',
        client_name: '',
        status: 'completed',
        notes: '',
        custom_amount: '',
        custom_cost_price: '',
        currency: 'RUB',
        transaction_date: new Date().toISOString().split('T')[0],
        quantity: '1',
      });
    }
  }, [open, editingTransaction]);

  const loadProducts = async () => {
    try {
      const result = await getProducts();
      setProducts(result.products || []);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
  
  const quantity = parseInt(formData.quantity) || 1;
  
  const getSalePrice = () => {
    if (formData.custom_amount) return parseFloat(formData.custom_amount);
    if (!selectedProduct) return 0;
    return formData.currency === 'USD' 
      ? (selectedProduct.sale_price_usd || selectedProduct.sale_price) 
      : selectedProduct.sale_price;
  };
  
  const getCostPrice = () => {
    if (formData.custom_cost_price) return parseFloat(formData.custom_cost_price);
    if (!selectedProduct) return 0;
    return formData.currency === 'USD'
      ? (selectedProduct.cost_price_usd || selectedProduct.cost_price)
      : selectedProduct.cost_price;
  };
  
  const saleAmountPerItem = getSalePrice();
  const costPricePerItem = getCostPrice();
  const saleAmount = saleAmountPerItem * quantity;
  const costPrice = costPricePerItem * quantity;
  const calculatedProfit = saleAmount - costPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTransaction) {
        const response = await updateTransaction({
          id: editingTransaction.id,
          product_id: parseInt(formData.product_id),
          client_telegram: formData.client_telegram,
          client_name: formData.client_name,
          status: formData.status,
          notes: formData.notes,
          custom_amount: formData.custom_amount ? parseFloat(formData.custom_amount) : undefined,
          custom_cost_price: formData.custom_cost_price ? parseFloat(formData.custom_cost_price) : undefined,
          currency: formData.currency,
          transaction_date: formData.transaction_date,
        });
        
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success('Транзакция обновлена');
          resetForm();
          onSuccess();
          onOpenChange(false);
        }
      } else {
        const qty = parseInt(formData.quantity) || 1;
        let successCount = 0;
        let lastError = '';
        
        for (let i = 0; i < qty; i++) {
          try {
            const response = await createTransaction({
              product_id: parseInt(formData.product_id),
              client_telegram: formData.client_telegram,
              client_name: formData.client_name,
              status: formData.status,
              notes: formData.notes,
              custom_amount: formData.custom_amount ? parseFloat(formData.custom_amount) : undefined,
              custom_cost_price: formData.custom_cost_price ? parseFloat(formData.custom_cost_price) : undefined,
              currency: formData.currency,
              transaction_date: formData.transaction_date,
            });
            
            if (response.error) {
              lastError = response.error;
              console.error(`Ошибка создания транзакции ${i + 1}:`, response.error);
            } else {
              successCount++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err: any) {
            lastError = err?.message || 'Неизвестная ошибка';
            console.error(`Ошибка создания транзакции ${i + 1}:`, err);
          }
        }

        if (successCount === qty) {
          toast.success(`Создано транзакций: ${qty}`);
          resetForm();
          onSuccess();
          onOpenChange(false);
        } else if (successCount > 0) {
          toast.warning(`Создано ${successCount} из ${qty} транзакций`);
        } else {
          toast.error(lastError || 'Не удалось создать транзакции. Проверьте, что товар существует');
        }
      }
    } catch (error) {
      toast.error(editingTransaction ? 'Ошибка обновления транзакции' : 'Ошибка создания транзакций');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      client_telegram: '',
      client_name: '',
      status: 'completed',
      notes: '',
      custom_amount: '',
      custom_cost_price: '',
      currency: 'RUB',
      transaction_date: new Date().toISOString().split('T')[0],
      quantity: '1',
    });
  };

  const handleDialogClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent key={editingTransaction?.id || 'new'} className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Товар</Label>
            <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Выберите товар" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} — ₽{product.sale_price.toLocaleString()}{product.sale_price_usd ? ` / $${product.sale_price_usd.toLocaleString()}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Валюта платежа</Label>
                <RadioGroup value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="RUB" id="payment-rub" />
                      <Label htmlFor="payment-rub" className="font-normal cursor-pointer">₽ Рубли</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id="payment-usd" />
                      <Label htmlFor="payment-usd" className="font-normal cursor-pointer">$ Доллары</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_amount">Цена за шт (необязательно)</Label>
                  <Input
                    id="custom_amount"
                    type="number"
                    step="0.01"
                    placeholder={`${formData.currency === 'USD' ? '$' : '₽'}${selectedProduct ? (formData.currency === 'USD' ? (selectedProduct.sale_price_usd || selectedProduct.sale_price) : selectedProduct.sale_price).toLocaleString() : '0'}`}
                    value={formData.custom_amount}
                    onChange={(e) => setFormData({ ...formData, custom_amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_cost_price">Себестоимость за шт (необязательно)</Label>
                <Input
                  id="custom_cost_price"
                  type="number"
                  step="0.01"
                  placeholder={`${formData.currency === 'USD' ? '$' : '₽'}${selectedProduct ? (formData.currency === 'USD' ? (selectedProduct.cost_price_usd || selectedProduct.cost_price) : selectedProduct.cost_price).toLocaleString() : '0'}`}
                  value={formData.custom_cost_price}
                  onChange={(e) => setFormData({ ...formData, custom_cost_price: e.target.value })}
                />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Количество:</span>
                  <span className="font-semibold">{quantity} шт</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Цена продажи:</span>
                  <span className="font-semibold">{formData.currency === 'USD' ? '$' : '₽'}{saleAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Себестоимость:</span>
                  <span>{formData.currency === 'USD' ? '$' : '₽'}{costPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Прибыль:</span>
                  <span className="font-semibold text-green-600">{formData.currency === 'USD' ? '$' : '₽'}{calculatedProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_telegram">Telegram клиента</Label>
              <Input
                id="client_telegram"
                placeholder="@username"
                value={formData.client_telegram}
                onChange={(e) => setFormData({ ...formData, client_telegram: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Дата транзакции</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_name">Имя клиента (если нет Telegram)</Label>
            <Input
              id="client_name"
              placeholder="Введите имя"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Завершена</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="failed">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              placeholder="Дополнительная информация"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading || !formData.product_id}>
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  {editingTransaction ? 'Сохранение...' : 'Создание...'}
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  {editingTransaction ? 'Сохранить' : 'Создать транзакцию'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;