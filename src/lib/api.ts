const API_URLS = {
  auth: 'https://functions.poehali.dev/0fe2adb1-b56f-4acd-aa46-246d52206d4d',
  products: 'https://functions.poehali.dev/52ef1750-02f0-482a-9d19-097377179e96',
  transactions: 'https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d',
  exchangeRate: 'https://functions.poehali.dev/b1cb12e6-ce2f-49f6-be71-4e60da826523',
};

export const checkAuth = async (telegramId: number) => {
  const response = await fetch(`${API_URLS.auth}?telegram_id=${telegramId}`);
  return response.json();
};

export const addAllowedUser = async (telegramId: number, username: string) => {
  const response = await fetch(`${API_URLS.auth}?action=add&telegram_id=${telegramId}&username=${username}`);
  return response.json();
};

export const getProducts = async () => {
  const response = await fetch(API_URLS.products);
  return response.json();
};

export const createProduct = async (data: {
  name: string;
  cost_price: number;
  sale_price: number;
  description: string;
  currency?: string;
}) => {
  const response = await fetch(API_URLS.products, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateProduct = async (data: {
  id: number;
  name: string;
  cost_price: number;
  sale_price: number;
  description: string;
  currency?: string;
}) => {
  const response = await fetch(API_URLS.products, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteProduct = async (id: number) => {
  const response = await fetch(`${API_URLS.products}?id=${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const getTransactions = async () => {
  const response = await fetch(API_URLS.transactions);
  return response.json();
};

export const getStats = async (dateFilter?: string, startDate?: string, endDate?: string) => {
  let url = `${API_URLS.transactions}?action=stats`;
  if (dateFilter) url += `&date_filter=${dateFilter}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  const response = await fetch(url);
  return response.json();
};

export const createTransaction = async (data: {
  product_id: number;
  client_telegram?: string;
  client_name?: string;
  status?: string;
  notes?: string;
  custom_amount?: number;
  currency?: string;
  transaction_date?: string;
}) => {
  const response = await fetch(API_URLS.transactions, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateTransactionStatus = async (id: number, status: string) => {
  const response = await fetch(API_URLS.transactions, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  return response.json();
};

export const getExchangeRate = async () => {
  const response = await fetch(API_URLS.exchangeRate);
  return response.json();
};