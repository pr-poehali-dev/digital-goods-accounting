import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { getProducts, createTransaction } from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  cost_price: number;
  sale_price: number;
  margin: number;
  currency?: string;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TransactionForm = ({ open, onOpenChange, onSuccess }: TransactionFormProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    client_telegram: '',
    client_name: '',
    status: 'completed',
    notes: '',
    custom_amount: '',
    currency: 'RUB',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    try {
      const result = await getProducts();
      setProducts(result.products || []);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
  const saleAmount = formData.custom_amount ? parseFloat(formData.custom_amount) : (selectedProduct?.sale_price || 0);
  const costPrice = selectedProduct?.cost_price || 0;
  const calculatedProfit = saleAmount - costPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTransaction({
        product_id: parseInt(formData.product_id),
        client_telegram: formData.client_telegram,
        client_name: formData.client_name,
        status: formData.status,
        notes: formData.notes,
        custom_amount: formData.custom_amount ? parseFloat(formData.custom_amount) : undefined,
        currency: formData.currency,
        transaction_date: formData.transaction_date,
      });

      toast.success('Транзакция создана');
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Ошибка создания транзакции');
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
      currency: 'RUB',
      transaction_date: new Date().toISOString().split('T')[0],
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новая транзакция</DialogTitle>
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
                    {product.name} — {product.currency === 'USD' ? '$' : '₽'}{product.sale_price.toLocaleString()}
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
              <div className="space-y-2">
                <Label htmlFor="custom_amount">Сумма продажи (необязательно)</Label>
                <Input
                  id="custom_amount"
                  type="number"
                  step="0.01"
                  placeholder={`${formData.currency === 'USD' ? '$' : '₽'}${selectedProduct.sale_price.toLocaleString()} (базовая цена)`}
                  value={formData.custom_amount}
                  onChange={(e) => setFormData({ ...formData, custom_amount: e.target.value })}
                />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
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
                  Создание...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Создать транзакцию
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