import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const [phoneFilter, setPhoneFilter] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Автозаполнение из localStorage, если ранее уже создавали заказ
    const savedPhone = localStorage.getItem('user_phone');
    if (savedPhone) {
      setPhoneFilter(savedPhone);
      handleSearch(savedPhone);
    }
  }, [isOpen]);

  const handleSearch = async (phoneToSearch?: string) => {
    const targetPhone = phoneToSearch || phoneFilter;
    if (!targetPhone) return;

    setLoading(true);
    setIsSearched(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('phone', targetPhone.trim())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Ошибка при изменении статуса: ' + error.message);
    } else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      alert('Ошибка при удалении: ' + error.message);
    } else {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Мои заказы</h2>

        {/* Поиск заказов по номеру телефона */}
        <div className="flex gap-2 mb-6">
          <input 
            type="tel"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            placeholder="Введите ваш номер телефона..."
            className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition"
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>
        </div>

        {/* Список найденных заказов */}
        {isSearched && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">
                Заказов с таким номером телефона не найдено
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                          {ord.category || 'Общее'}
                        </span>
                        <h3 className="font-bold text-gray-900 mt-1">{ord.title}</h3>
                      </div>
                      <span className="text-sm font-black text-blue-600">
                        {ord.budget ? `${Number(ord.budget).toLocaleString()} ₸` : 'Договорная'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      {/* Выбор статуса */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Статус:</span>
                        <select
                          value={ord.status || 'open'}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 font-medium text-gray-700"
                        >
                          <option value="open">🟢 В поиске</option>
                          <option value="in_progress">🟡 В работе</option>
                          <option value="completed">🔵 Завершен</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}