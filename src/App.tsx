import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import CreateOrderModal from './CreateOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import MyOrdersModal from './MyOrdersModal';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';
import MastersListModal from './MastersListModal';

export default function App() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [totalResponsesCount, setTotalResponsesCount] = useState(0);

  // Модальные окна
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMastersOpen, setIsMastersOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const categories = ['Все', 'Ремонт и отделка', 'Сантехника', 'Электрика', 'Клининг', 'Перевозки'];
  const cities = ['Все города', 'Астана', 'Алматы', 'Шымкент', 'Караганда', 'Актобе', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау', 'Актау'];

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, responses(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);

      const savedPhone = localStorage.getItem('user_phone');
      if (savedPhone) {
        const userOrders = data.filter((o: any) => o.phone === savedPhone.trim());
        const responsesTotal = userOrders.reduce((sum: number, ord: any) => {
          return sum + (ord.responses ? ord.responses.length : 0);
        }, 0);
        setTotalResponsesCount(responsesTotal);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.phone) {
        localStorage.setItem('user_phone', session.user.user_metadata.phone);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.phone) {
        localStorage.setItem('user_phone', session.user.user_metadata.phone);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    alert('Вы вышли из системы');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesCategory = selectedCategory === 'Все' || order.category === selectedCategory;
    const matchesCity = selectedCity === 'Все города' || order.city === selectedCity || order.city === 'Весь Казахстан';
    const matchesSearch = 
      order.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isActivelySearching = !order.status || order.status === 'open';

    return matchesCategory && matchesCity && matchesSearch && isActivelySearching;
  }).sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    if (sortBy === 'price_desc') {
      return (Number(b.budget) || 0) - (Number(a.budget) || 0);
    }
    if (sortBy === 'price_asc') {
      return (Number(a.budget) || 0) - (Number(b.budget) || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col justify-between">
      <div>
        {/* Шапка сайта */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedCategory('Все'); setSelectedCity('Все города'); setSearchQuery(''); }}>
              <span className="text-2xl font-black text-blue-600 tracking-tight">uslugikz</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">.asia</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button 
                onClick={() => setIsMastersOpen(true)}
                className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 px-2 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                🛠️ Мастера
              </button>

              <button 
                onClick={() => setIsMyOrdersOpen(true)}
                className="relative text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 px-2 py-2 rounded-xl hover:bg-gray-100 transition flex items-center gap-1"
              >
                Мои заказы
                {totalResponsesCount > 0 && (
                  <span className="bg-blue-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">
                    {totalResponsesCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-2 rounded-xl transition flex items-center gap-1"
                  >
                    👤 {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 px-1.5 py-2 hover:bg-red-50 rounded-xl transition"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 px-2.5 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  Войти
                </button>
              )}

              <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl shadow-md shadow-blue-200 transition"
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
            <div className="pt-2 flex justify-center gap-3">
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:bg-blue-50 transition text-sm sm:text-base"
              >
                Разместить задание
              </button>
              <button 
                onClick={() => setIsMastersOpen(true)}
                className="bg-blue-500/40 border border-white/30 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-blue-500/60 transition text-sm sm:text-base"
              >
                Найти мастера
              </button>
            </div>
          </div>
        </section>

        {/* Основной контент */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Фильтры и Поиск */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c === 'Все города' ? '📍 Все города' : `📍 ${c}`}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="newest">🕒 Сначала новые</option>
                  <option value="price_desc">💎 Сначала дорогие</option>
                  <option value="price_asc">🏷️ Сначала дешевые</option>
                </select>

                <div className="relative w-full">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по заказам..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm"
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
              </div>

              <div className="text-xs text-gray-500 font-semibold self-end md:self-center">
                Найдено заказов: <span className="text-blue-600 font-bold">{filteredOrders.length}</span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
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

          {/* Список заказов */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Актуальные заказы</h2>

            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Загрузка заказов...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 text-sm">
                В выбранном городе или категории пока нет опубликованных заказов.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((ord) => {
                  const responsesCount = ord.responses ? ord.responses.length : 0;
                  const imagesCount = ord.images ? ord.images.length : 0;
                  const viewsCount = ord.views || 0;
                  const isFeatured = ord.is_featured;

                  return (
                    <div 
                      key={ord.id}
                      className={`rounded-2xl p-5 transition flex flex-col justify-between ${
                        isFeatured 
                          ? 'bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-100/50 border-2 border-orange-500 shadow-md relative'
                          : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200'
                      }`}
                    >
                      <div>
                        {/* Верхняя панель */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isFeatured && (
                              <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider shadow-sm flex items-center gap-1 shrink-0">
                                🔥 СРОЧНО
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              isFeatured ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'text-blue-600 bg-blue-50'
                            }`}>
                              {ord.category || 'Общее'}
                            </span>
                            {ord.city && (
                              <span className="text-xs text-gray-700 bg-white/90 border border-gray-200 px-2 py-0.5 rounded-lg font-semibold">
                                📍 {ord.city}
                              </span>
                            )}
                            {imagesCount > 0 && (
                              <span className="text-xs text-amber-800 bg-amber-100/80 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                📷 {imagesCount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-gray-600 font-bold bg-white/80 border border-gray-200 px-2 py-0.5 rounded-md">
                              👁️️ {viewsCount}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                              {ord.created_at ? new Date(ord.created_at).toLocaleDateString('ru-RU') : ''}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{ord.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed font-medium">
                          {ord.description || 'Описание не указано'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 mt-2">
                        <div className="text-lg font-black text-blue-700">
                          {ord.budget ? `${Number(ord.budget).toLocaleString()} ₸` : 'Договорная'}
                        </div>

                        <div className="flex items-center gap-3">
                          {responsesCount > 0 && (
                            <span className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md">
                              💬 {responsesCount}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className={`text-xs font-bold transition px-3.5 py-2 rounded-xl shadow-sm ${
                              isFeatured 
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
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
      </div>

      {/* Подвал */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-blue-600">uslugikz</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">.asia</span>
            <span className="text-gray-400">© 2026</span>
          </div>

          <div className="flex gap-4 font-medium">
            <span>Астана</span>
            <span>•</span>
            <span>Алматы</span>
            <span>•</span>
            <span>Шымкент</span>
            <span>•</span>
            <span>Весь Казахстан</span>
          </div>

          <div className="text-gray-400">
            Платформа объявлений и услуг
          </div>
        </div>
      </footer>

      {/* Модальные окна */}
      <CreateOrderModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onOrderCreated={fetchOrders}
      />

      <OrderDetailsModal 
        isOpen={!!selectedOrder} 
        order={selectedOrder} 
        onClose={() => {
          setSelectedOrder(null);
          fetchOrders();
        }} 
      />

      <MyOrdersModal 
        isOpen={isMyOrdersOpen} 
        onClose={() => setIsMyOrdersOpen(false)} 
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user}
      />

      <MastersListModal 
        isOpen={isMastersOpen} 
        onClose={() => setIsMastersOpen(false)} 
      />
    </div>
  );
}