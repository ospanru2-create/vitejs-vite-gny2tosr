import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import CreateOrderModal from './CreateOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import MyOrdersModal from './MyOrdersModal';
import AuthModal from './AuthModal';

export default function App() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Модальные окна
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const categories = ['Все', 'Ремонт и отделка', 'Сантехника', 'Электрика', 'Клининг', 'Перевозки'];

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, responses(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Фильтрация заказов по категории, поисковому запросу и актуальному статусу
  const filteredOrders = orders.filter((order) => {
    const matchesCategory = selectedCategory === 'Все' || order.category === selectedCategory;
    const matchesSearch = 
      order.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Показывать на главной только открытые заказы (или без статуса)
    const isActivelySearching = !order.status || order.status === 'open';

    return matchesCategory && matchesSearch && isActivelySearching;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Шапка сайта */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedCategory('Все'); setSearchQuery(''); }}>
            <span className="text-2xl font-black text-blue-600 tracking-tight">uslugikz</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">.asia</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMyOrdersOpen(true)}
              className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              Мои заказы
            </button>
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              Войти
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 transition"
            >
              + Создать заказ
            </button>
          </div>
        </div>
      </header>

      {/* Баннер */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Платформа поиска исполнителей и заказов
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto font-medium">
            Публикуйте заказы или находите клиентов по всей Республике Казахстан быстро и без посредников.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:bg-blue-50 transition text-sm sm:text-base"
            >
              Разместить задание
            </button>
          </div>
        </div>
      </section>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Фильтры и Поиск */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Поисковая строка */}
            <div className="w-full sm:w-80 relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по заказам..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 font-semibold">
              Найдено заказов: <span className="text-blue-600 font-bold">{filteredOrders.length}</span>
            </div>
          </div>

          {/* Кнопки категорий */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Список актуальных заказов */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Актуальные заказы</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Загрузка заказов...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 text-sm">
              В этой категории пока нет опубликованных заказов.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((ord) => {
                const responsesCount = ord.responses ? ord.responses.length : 0;
                return (
                  <div 
                    key={ord.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {ord.category || 'Общее'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('ru-RU') : ''}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-1">{ord.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                        {ord.description || 'Описание не указано'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                      <div className="text-lg font-black text-blue-600">
                        {ord.budget ? `${Number(ord.budget).toLocaleString()} ₸` : 'Договорная'}
                      </div>

                      <div className="flex items-center gap-3">
                        {responsesCount > 0 && (
                          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                            💬 {responsesCount}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          Подробнее →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Модальные окна */}
      <CreateOrderModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
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