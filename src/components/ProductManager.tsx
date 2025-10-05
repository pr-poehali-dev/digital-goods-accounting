import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  cost_price: number;
  sale_price: number;
  description: string;
  margin: number;
  margin_percent: number;
  currency?: string;
  cost_price_usd?: number;
}

const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cost_price: '',
    cost_price_usd: '',
    sale_price: '',
    description: '',
    currency: 'RUB',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts();
      setProducts(result.products || []);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      cost_price: parseFloat(formData.cost_price),
      cost_price_usd: formData.cost_price_usd ? parseFloat(formData.cost_price_usd) : null,
      sale_price: parseFloat(formData.sale_price),
      description: formData.description,
      currency: formData.currency,
    };

    try {
      if (editingProduct) {
        await updateProduct({ ...data, id: editingProduct.id });
        toast.success('Товар обновлён');
      } else {
        await createProduct(data);
        toast.success('Товар создан');
      }
      
      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      cost_price: product.cost_price.toString(),
      cost_price_usd: product.cost_price_usd ? product.cost_price_usd.toString() : '',
      sale_price: product.sale_price.toString(),
      description: product.description,
      currency: product.currency || 'RUB',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить товар?')) {
      try {
        await deleteProduct(id);
        toast.success('Товар удалён');
        loadProducts();
      } catch (error) {
        toast.error('Ошибка удаления');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', cost_price: '', cost_price_usd: '', sale_price: '', description: '', currency: 'RUB' });
    setEditingProduct(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Каталог товаров</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Валюта цен</Label>
                <RadioGroup value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="RUB" id="currency-rub" />
                      <Label htmlFor="currency-rub" className="font-normal cursor-pointer">₽ Рубли</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id="currency-usd" />
                      <Label htmlFor="currency-usd" className="font-normal cursor-pointer">$ Доллары</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost_price">Себестоимость в рублях (₽)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_price_usd">Себестоимость в долларах ($, необязательно)</Label>
                <Input
                  id="cost_price_usd"
                  type="number"
                  step="0.01"
                  placeholder="Оставьте пустым, если такая же как в рублях"
                  value={formData.cost_price_usd}
                  onChange={(e) => setFormData({ ...formData, cost_price_usd: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale_price">Цена продажи ({formData.currency === 'RUB' ? '₽' : '$'})</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  required
                />
              </div>

              {formData.cost_price && formData.sale_price && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">
                    Маржа: {formData.currency === 'RUB' ? '₽' : '$'}{(parseFloat(formData.sale_price) - parseFloat(formData.cost_price)).toFixed(2)}
                    {' '}
                    ({(((parseFloat(formData.sale_price) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price)) * 100).toFixed(1)}%)
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Сохранить' : 'Создать'}
                </Button>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead className="text-right">Себестоимость</TableHead>
                <TableHead className="text-right">Цена продажи</TableHead>
                <TableHead className="text-right">Маржа</TableHead>
                <TableHead className="text-right">Рентабельность</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.currency === 'USD' ? '$' : '₽'}{product.cost_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{product.currency === 'USD' ? '$' : '₽'}{product.sale_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">{product.currency === 'USD' ? '$' : '₽'}{product.margin.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium">{product.margin_percent.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        <Icon name="Edit2" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    </div>
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

export default ProductManager;