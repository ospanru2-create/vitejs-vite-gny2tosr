import { useState, useEffect } from 'react';
import { CreateOrderModal } from './CreateOrderModal';
import { OrderDetailsModal } from './OrderDetailsModal';
import { MyOrdersModal } from './MyOrdersModal';
import { AuthModal } from './AuthModal';
import { supabase } from './supabase';

interface Order {
  id: string;
  title: string;
  category: string;
  price: string;
  description?: string;
  phone?: string;
  status?: string;
  created_at: string;
}

export default function App() {
  const [role, setRole] = useState<'client' | 'master'>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const categories = [
    { id: 'remont', name: 'Ремонт и отделка', icon: '🔨' },
    { id: 'plumbing', name: 'Сантехника', icon: '🚰' },
    { id: 'electric', name: 'Электрика', icon: '⚡' },
    { id: 'cleaning', name: 'Уборка и клининг', icon: '🧹' },
    { id: 'auto', name: 'Автоуслуги', icon: '🚗' },
    { id: 'appliance', name: 'Ремонт техники', icon: '💻' },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesCategory = !selectedCategory || order.category === selectedCategory;
    const matchesSearch =
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.description && order.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory(null)}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-200">
                U
              </div>
              <span className="text-xl font-bold tracking-tight">Uslugi.kz</span>
            </div>
            
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setRole('client')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  role === 'client' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Заказчик
              </button>
              <button
                onClick={() => setRole('master')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  role === 'master' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Мастер
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === 'client' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-100 active:scale-95"
              >
                Создать заказ
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMyOrdersOpen(true)}
                  className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Мои заказы
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 to-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-4 border border-blue-400/20">
            100% Бесплатно — без комиссий
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Найдите проверенного мастера <br className="hidden sm:inline" /> за пару минут
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-2xl mx-auto">
            Сантехники, электрики, строители и клининг по всему Казахстану. Публикуйте заявку и выбирайте лучших!
          </p>

          <div className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Какая услуга вам нужна?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none text-sm"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all">
              Найти
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Популярные категории</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedCategory === cat.id
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <span className="text-2xl mb-2 block">{cat.icon}</span>
              <span className="text-sm font-semibold text-slate-800 block">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Orders Feed */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {selectedCategory
              ? `Заказы в категории: ${categories.find((c) => c.id === selectedCategory)?.name}`
              : 'Актуальные заказы'}
          </h2>
          <span className="text-sm text-slate-500 font-medium">Найдено: {filteredOrders.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Загрузка заказов...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 font-medium">Заказов пока нет. Будьте первыми, кто создаст заказ!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {order.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1">{order.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                    {order.description || 'Без описания'}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                  <span className="font-extrabold text-slate-900 text-lg">{order.price} ₸</span>
                  <span className="text-xs font-semibold text-blue-600 hover:underline">Подробнее →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {isModalOpen && (
        <CreateOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOrderCreated={fetchOrders}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          role={role}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {isMyOrdersOpen && (
        <MyOrdersModal
          isOpen={isMyOrdersOpen}
          onClose={() => setIsMyOrdersOpen(false)}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}