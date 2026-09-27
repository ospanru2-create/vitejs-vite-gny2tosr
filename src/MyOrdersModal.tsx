import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface Order {
  id: string;
  title: string;
  category: string;
  price: string;
  description?: string;
  status?: string;
  created_at: string;
  user_id?: string;
}

interface Bid {
  id: string;
  master_name: string;
  master_phone?: string;
  price: string;
  message?: string;
  created_at: string;
  rating?: number;
  review?: string;
}

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedOrderBids, setSelectedOrderBids] = useState<{
    [key: string]: Bid[];
  }>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'open' | 'in_progress' | 'completed'
  >('all');

  // Состояние для написания отзыва
  const [reviewingBidId, setReviewingBidId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadMyOrders();
    }
  }, [isOpen]);

  const loadMyOrders = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userOrders: Order[] = [];

    if (user) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) userOrders = data;
    }

    const localOrders: Order[] = JSON.parse(
      localStorage.getItem('local_orders') || '[]'
    );
    const combined = [
      ...userOrders,
      ...localOrders.filter((lo) => !userOrders.some((uo) => uo.id === lo.id)),
    ];

    setMyOrders(combined);

    for (const order of combined) {
      fetchBidsForOrder(order.id);
    }

    setLoading(false);
  };

  const fetchBidsForOrder = async (orderId: string) => {
    const localBids: Bid[] = JSON.parse(
      localStorage.getItem(`bids_${orderId}`) || '[]'
    );

    try {
      const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (data) {
        const combined = [
          ...data,
          ...localBids.filter((lb) => !data.some((d) => d.id === lb.id)),
        ];
        setSelectedOrderBids((prev) => ({ ...prev, [orderId]: combined }));
      } else {
        setSelectedOrderBids((prev) => ({ ...prev, [orderId]: localBids }));
      }
    } catch {
      setSelectedOrderBids((prev) => ({ ...prev, [orderId]: localBids }));
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const localOrders: Order[] = JSON.parse(
      localStorage.getItem('local_orders') || '[]'
    );
    const updatedLocal = localOrders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    localStorage.setItem('local_orders', JSON.stringify(updatedLocal));

    try {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase update status failed:', e);
    }

    loadMyOrders();
    if (onOrderUpdated) onOrderUpdated();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    const localOrders: Order[] = JSON.parse(
      localStorage.getItem('local_orders') || '[]'
    );
    const updatedLocal = localOrders.filter((o) => o.id !== orderId);
    localStorage.setItem('local_orders', JSON.stringify(updatedLocal));

    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }

    loadMyOrders();
    if (onOrderUpdated) onOrderUpdated();
  };

  const handleSaveReview = (orderId: string, bidId: string) => {
    const currentBids = selectedOrderBids[orderId] || [];
    const updatedBids = currentBids.map((b) =>
      b.id === bidId ? { ...b, rating, review: reviewText } : b
    );

    localStorage.setItem(`bids_${orderId}`, JSON.stringify(updatedBids));
    setSelectedOrderBids((prev) => ({ ...prev, [orderId]: updatedBids }));

    setReviewingBidId(null);
    setReviewText('');
    setRating(5);
  };

  const filteredOrders = myOrders.filter((order) => {
    const status = order.status || 'open';
    if (activeTab === 'all') return true;
    return status === activeTab;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Мои созданные заказы
        </h2>

        {/* Вкладки фильтрации */}
        <div className="flex gap-2 border-b border-slate-200 pb-3 mb-4 text-xs font-medium">
          {[
            { id: 'all', label: 'Все заказы' },
            { id: 'open', label: 'Открытые' },
            { id: 'in_progress', label: 'В работе' },
            { id: 'completed', label: 'Завершенные' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-4">Загрузка...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-sm text-slate-500">
              В этой вкладке пока нет заказов.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const bids = selectedOrderBids[order.id] || [];
              const currentStatus = order.status || 'open';

              return (
                <div
                  key={order.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {order.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            currentStatus === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentStatus === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {currentStatus === 'completed'
                            ? '✓ Выполнен'
                            : currentStatus === 'in_progress'
                            ? '⏳ В работе'
                            : '● Открыт'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {order.title}
                      </h3>
                    </div>
                    <span className="font-extrabold text-emerald-600">
                      {order.price}
                    </span>
                  </div>

                  {order.description && (
                    <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg">
                      {order.description}
                    </p>
                  )}

                  {/* Переключатель статуса */}
                  <div className="flex items-center justify-between border-t border-b border-slate-100 py-2 my-3 text-xs gap-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleStatusChange(order.id, 'open')}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                          currentStatus === 'open'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Открыт
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(order.id, 'in_progress')
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                          currentStatus === 'in_progress'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        В работе
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(order.id, 'completed')
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                          currentStatus === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Завершен
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-semibold px-2 py-1 hover:bg-red-50 rounded transition"
                    >
                      🗑 Удалить
                    </button>
                  </div>

                  <div className="pt-1">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">
                      Отклики мастеров ({bids.length}):
                    </h4>

                    {bids.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Ожидаем откликов...
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {bids.map((bid) => (
                          <div
                            key={bid.id}
                            className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    {bid.master_name}
                                  </span>
                                  {bid.master_phone && (
                                    <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                                      📞 {bid.master_phone}
                                    </span>
                                  )}
                                </div>
                                {bid.message && (
                                  <p className="text-slate-600 text-[11px]">
                                    {bid.message}
                                  </p>
                                )}
                              </div>

                              <div className="text-right flex-shrink-0 ml-3">
                                <div className="font-extrabold text-indigo-600 mb-1">
                                  {bid.price}
                                </div>
                                {bid.master_phone && (
                                  <a
                                    href={`tel:${bid.master_phone.replace(
                                      /\s+/g,
                                      ''
                                    )}`}
                                    className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition"
                                  >
                                    Позвонить
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Отображение отзыва или формы для отзыва */}
                            {bid.review ? (
                              <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px] text-amber-900 mt-2">
                                <div className="font-bold flex items-center gap-1 mb-0.5">
                                  {'⭐'.repeat(bid.rating || 5)} ({bid.rating}
                                  /5) — Ваш отзыв
                                </div>
                                <p className="italic">"{bid.review}"</p>
                              </div>
                            ) : (
                              currentStatus === 'completed' && (
                                <div className="border-t border-indigo-100 pt-2 mt-2">
                                  {reviewingBidId === bid.id ? (
                                    <div className="bg-white p-2.5 rounded-lg border border-indigo-200 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[11px]">
                                          Оценка:
                                        </span>
                                        <select
                                          value={rating}
                                          onChange={(e) =>
                                            setRating(Number(e.target.value))
                                          }
                                          className="border rounded px-1.5 py-0.5 text-xs font-bold text-amber-600 outline-none"
                                        >
                                          <option value={5}>
                                            ⭐⭐⭐⭐⭐ (5/5)
                                          </option>
                                          <option value={4}>
                                            ⭐⭐⭐⭐ (4/5)
                                          </option>
                                          <option value={3}>
                                            ⭐⭐⭐ (3/5)
                                          </option>
                                          <option value={2}>⭐⭐ (2/5)</option>
                                          <option value={1}>⭐ (1/5)</option>
                                        </select>
                                      </div>
                                      <textarea
                                        rows={2}
                                        placeholder="Напишите пару слов о работе мастера..."
                                        value={reviewText}
                                        onChange={(e) =>
                                          setReviewText(e.target.value)
                                        }
                                        className="w-full border border-slate-200 rounded p-1.5 text-xs outline-none resize-none"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          onClick={() =>
                                            setReviewingBidId(null)
                                          }
                                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                                        >
                                          Отмена
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleSaveReview(order.id, bid.id)
                                          }
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded text-[11px]"
                                        >
                                          Сохранить отзыв
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setReviewingBidId(bid.id);
                                        setRating(5);
                                        setReviewText('');
                                      }}
                                      className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1"
                                    >
                                      ⭐ Оставить отзыв о работе мастера
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
