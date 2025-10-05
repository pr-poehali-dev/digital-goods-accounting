import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockRevenueData = [
  { month: 'Янв', revenue: 24000, costs: 12000 },
  { month: 'Фев', revenue: 32000, costs: 15000 },
  { month: 'Мар', revenue: 28000, costs: 13000 },
  { month: 'Апр', revenue: 38000, costs: 16000 },
  { month: 'Май', revenue: 42000, costs: 18000 },
  { month: 'Июн', revenue: 45000, costs: 19000 },
];

const mockTransactions = [
  { id: 'TX-2001', date: '07.10.2024', client: 'ООО "Альфа"', product: 'Лицензия Premium', amount: 15000, status: 'completed', address: 'Москва, ул. Ленина 12' },
  { id: 'TX-2002', date: '06.10.2024', client: 'ИП Иванов', product: 'Подписка Basic', amount: 5000, status: 'completed', address: 'СПб, пр. Невский 45' },
  { id: 'TX-2003', date: '06.10.2024', client: 'ООО "Бета"', product: 'Модуль расширения', amount: 8500, status: 'pending', address: 'Казань, ул. Баумана 7' },
  { id: 'TX-2004', date: '05.10.2024', client: 'ООО "Гамма"', product: 'Консультация', amount: 12000, status: 'completed', address: 'Москва, ул. Тверская 88' },
  { id: 'TX-2005', date: '05.10.2024', client: 'ИП Петров', product: 'Лицензия Standard', amount: 9000, status: 'failed', address: 'Екатеринбург, ул. Малышева 3' },
];

const mockProductsData = [
  { name: 'Premium', sales: 45, revenue: 675000 },
  { name: 'Standard', sales: 78, revenue: 702000 },
  { name: 'Basic', sales: 124, revenue: 620000 },
  { name: 'Enterprise', sales: 12, revenue: 480000 },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCosts = mockRevenueData.reduce((sum, item) => sum + item.costs, 0);
  const profit = totalRevenue - totalCosts;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon name="Package" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Админ-панель</h1>
                <p className="text-sm text-muted-foreground">Магазин цифровых товаров</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Icon name="Plus" size={16} className="mr-2" />
              Новая транзакция
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="overview" className="gap-2">
              <Icon name="LayoutDashboard" size={16} />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Icon name="Receipt" size={16} />
              Транзакции
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <Icon name="MapPin" size={16} />
              Адреса
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="TrendingUp" size={16} />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Icon name="Package" size={16} />
              Товары
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-2">
              <Icon name="DollarSign" size={16} />
              Затраты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-primary animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon name="TrendingUp" size={16} />
                    Общий доход
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    ₽{totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">За последние 6 месяцев</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon name="Receipt" size={16} />
                    Транзакции
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {mockTransactions.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Активных операций</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon name="Wallet" size={16} />
                    Прибыль
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ₽{profit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Чистая прибыль</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-destructive animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} />
                    Затраты
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    ₽{totalCosts.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Общие расходы</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="BarChart3" size={18} />
                    Динамика доходов и затрат
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockRevenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0, 91%, 59%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(0, 91%, 59%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="month" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="costs" stroke="hsl(0, 91%, 59%)" strokeWidth={2} fill="url(#colorCosts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Package" size={18} />
                    Продажи по товарам
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockProductsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="sales" fill="hsl(195, 100%, 49%)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Activity" size={18} />
                  Последние транзакции
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Товар</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                        <TableCell>{transaction.client}</TableCell>
                        <TableCell className="text-muted-foreground">{transaction.product}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₽{transaction.amount.toLocaleString()}
                        </TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Все транзакции</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Icon name="Filter" size={16} className="mr-2" />
                    Фильтры
                  </Button>
                  <Button variant="outline" size="sm">
                    <Icon name="Download" size={16} className="mr-2" />
                    Экспорт
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID транзакции</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Товар</TableHead>
                      <TableHead>Адрес</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.client}</TableCell>
                        <TableCell>{transaction.product}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{transaction.address}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₽{transaction.amount.toLocaleString()}
                        </TableCell>
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
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreVertical" size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Адреса клиентов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon name="MapPin" size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.client}</p>
                          <p className="text-sm text-muted-foreground">{transaction.address}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Icon name="ExternalLink" size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Тренд продаж</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="month" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Доходность товаров</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockProductsData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis type="number" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Каталог товаров</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockProductsData.map((product, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Продаж</span>
                          <span className="font-semibold">{product.sales}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Доход</span>
                          <span className="font-semibold text-primary">
                            ₽{product.revenue.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle>Структура затрат</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 91%, 59%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 91%, 59%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" stroke="hsl(215, 16%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 16%, 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 91%)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area type="monotone" dataKey="costs" stroke="hsl(0, 91%, 59%)" strokeWidth={2} fill="url(#costsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Server" size={18} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Хостинг</p>
                    </div>
                    <p className="text-2xl font-bold">₽25,000</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Users" size={18} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Персонал</p>
                    </div>
                    <p className="text-2xl font-bold">₽58,000</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Megaphone" size={18} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Реклама</p>
                    </div>
                    <p className="text-2xl font-bold">₽10,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
