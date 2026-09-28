import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import CreateOrderModal from './CreateOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import MyOrdersModal from './MyOrdersModal';
import AuthModal from './AuthModal';

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');

  const categories = ['Все', 'Ремонт', 'Клининг', 'Перевозки', 'Сантехника', 'Электрика', 'Красота'];

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (selectedCategory !== 'Все') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Ошибка получения заказов:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight cursor-pointer" onClick={() => setSelectedCategory('Все')}>
              uslugikz<span className="text-gray-400 font-normal">.asia</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMyOrdersOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Мои заказы
            </button>
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Войти
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-200"
            >
              + Создать заказ
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Баннер */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <h2 className="text-3xl font-extrabold mb-2">Платформа поиска исполнителей и заказов</h2>
          <p className="text-blue-100 mb-6 max-w-xl">
            Публикуйте заказы или находите клиентов по всей Республике Казахстан быстро и без посредников.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition shadow-md"
          >
            Разместить задание
          </button>
        </div>

        {/* Категории */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Лента заказов */}
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {selectedCategory === 'Все' ? 'Все актуальные заказы' : `Заказы в категории: ${selectedCategory}`}
          </h3>
          <span className="text-sm text-gray-500">Всего: {orders.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Загрузка заказов из базы...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <p className="text-gray-500 mb-4">В этой категории пока нет опубликованных заказов.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100 transition"
            >
              Будьте первым — создайте заказ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg">
                      {order.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{order.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{order.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-black text-gray-900">
                    {order.budget ? `${order.budget.toLocaleString()} ₸` : 'Договорная'}
                  </span>
                  <span className="text-xs font-medium text-blue-600 hover:underline">Подробнее →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальные окна */}
      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onOrderCreated={fetchOrders}
      />
      <OrderDetailsModal 
        isOpen={!!selectedOrder} 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
      <MyOrdersModal 
        isOpen={isMyOrdersOpen} 
        onClose={() => setIsMyOrdersOpen(false)} 
      />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </div>
  );
}