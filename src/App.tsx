import React, { useState, useEffect } from 'react';
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const savedOrders = JSON.parse(
          localStorage.getItem('local_orders') || '[]'
        );
        setOrders(savedOrders);
      } else {
        setOrders(data);
      }
    } catch {
      const savedOrders = JSON.parse(
        localStorage.getItem('local_orders') || '[]'
      );
      setOrders(savedOrders);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? order.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Шапка */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100">
            U
          </div>
          <span className="font-bold text-lg tracking-tight">Uslugi.kz</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            📍 Астана
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setRole('client')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                role === 'client'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Я заказчик
            </button>
            <button
              onClick={() => setRole('master')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                role === 'master'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Я мастер
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm transition active:scale-95"
          >
            + Разместить заказ
          </button>

          <button
            onClick={() => setIsMyOrdersOpen(true)}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
          >
            📋 Мои заказы
          </button>

          {currentUser ? (
            <div className="flex items-center space-x-2 border-l pl-3 ml-1 border-slate-200">
              <span className="text-xs font-semibold text-slate-700">
                {currentUser.user_metadata?.full_name ||
                  currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 hover:underline"
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition"
            >
              Войти
            </button>
          )}
        </div>
      </header>

      {/* Главная секция */}
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-slate-900 text-white p-8 rounded-2xl text-center shadow-lg mb-8">
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-300 font-medium border border-white/10">
            🔥 Сервис заказа услуг в Астане
          </span>
          <h1 className="text-2xl font-extrabold mt-4 mb-2 tracking-tight">
            {role === 'client'
              ? 'Найдите надежного мастера для любой задачи'
              : 'Зарабатывайте на выполнении заказов'}
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            Сантехника, ремонт, электрика, уборка и многое другое
          </p>

          <div className="bg-white p-2 rounded-xl flex gap-2 shadow-inner">
            <input
              type="text"
              placeholder="Поиск по заказам (например: ламинат, смеситель...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Категории */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900">Категории</h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              'Ремонт и отделка',
              'Сантехника',
              'Электрика',
              'Уборка',
              'Грузоперевозки',
              'Бытовой ремонт',
            ].map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                className={`p-2.5 rounded-xl text-xs font-medium border transition text-center ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Список заказов */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {selectedCategory
                ? `Заказы: ${selectedCategory}`
                : 'Все доступные заказы'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Найдено: {filteredOrders.length}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <p className="text-sm text-slate-500 mb-4">
                Пока нет созданных заказов в этой категории.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-50 border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
              >
                Будьте первым, кто создаст заказ!
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex justify-between items-start"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {order.category}
                      </span>
                      {order.status && order.status !== 'open' && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status === 'completed'
                            ? '✓ Выполнен'
                            : '⏳ В работе'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      {order.title}
                    </h4>
                    {order.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {order.description}
                      </p>
                    )}
                    <div className="text-xs text-slate-400 pt-1">
                      📍 Астана •{' '}
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-extrabold text-emerald-600">
                      {order.price}
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition active:scale-95"
                    >
                      {role === 'master' ? 'Откликнуться' : 'Подробнее'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Модальные окна */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={loadOrders}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        userRole={role}
        onClose={() => setSelectedOrder(null)}
      />

      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        onOrderUpdated={loadOrders}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
