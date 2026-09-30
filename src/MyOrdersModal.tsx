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
  const [selectedOrderResponses, setSelectedOrderResponses] = useState<any[] | null>(null);
  const [activeOrderTitle, setActiveOrderTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('user_phone');
      if (savedPhone) {
        setPhoneFilter(savedPhone);
        handleSearch(savedPhone);
      }
    }
  }, [isOpen]);

  const handleSearch = async (phoneToSearch?: string) => {
    const targetPhone = phoneToSearch || phoneFilter;
    if (!targetPhone) return;

    setLoading(true);
    setIsSearched(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*, responses(*)')
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

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  const cleanPhoneForWhatsapp = (p: string) => {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10 p-1"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">
          {selectedOrderResponses ? 'Отклики мастеров' : 'Управление моими заказами'}
        </h2>

        {selectedOrderResponses ? (
          <div className="overflow-y-auto pr-1 flex-1">
            <button 
              onClick={() => setSelectedOrderResponses(null)}
              className="mb-3 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              ← Назад к списку заказов
            </button>

            <div className="bg-blue-50/60 p-3 rounded-xl mb-4 border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Заказ</span>
              <p className="text-sm font-bold text-gray-900">{activeOrderTitle}</p>
            </div>

            {selectedOrderResponses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">
                На этот заказ пока нет откликов от мастеров
              </div>
            ) : (
              <div className="space-y-3">
                {selectedOrderResponses.map((res) => {
                  const phoneDigits = cleanPhoneForWhatsapp(res.phone);
                  return (
                    <div key={res.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-gray-900">
                              👤 {res.master_name || 'Исполнитель'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 font-medium">Предложенная цена:</div>
                          <span className="text-lg font-black text-blue-600">
                            {res.price ? `${Number(res.price).toLocaleString()} ₸` : 'Договорная'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {phoneDigits && (
                            <a 
                              href={`https://wa.me/${phoneDigits}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ backgroundColor: '#25D366' }}
                              className="text-xs text-white font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 shadow-sm hover:opacity-90"
                            >
                              WhatsApp
                            </a>
                          )}
                          <a 
                            href={`tel:${res.phone}`}
                            className="text-xs bg-gray-100 text-gray-800 font-bold px-3 py-2 rounded-xl border border-gray-200 transition hover:bg-gray-200"
                          >
                            📞 {res.phone || 'Без номера'}
                          </a>
                        </div>
                      </div>

                      {res.comment && (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
                          <span className="font-semibold text-gray-500 block mb-1">Комментарий мастера:</span>
                          {res.comment}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex gap-2 mb-4 shrink-0">
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
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Поиск...' : 'Найти'}
              </button>
            </div>

            {isSearched && (
              <div className="overflow-y-auto pr-1 flex-1">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">
                    Заказов с таким номером телефона не найдено
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => {
                      const responsesCount = ord.responses ? ord.responses.length : 0;
                      return (
                        <div key={ord.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                  {ord.category || 'Общее'}
                                </span>
                                {ord.city && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                    📍 {ord.city}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base">{ord.title}</h3>
                            </div>
                            <span className="text-sm font-black text-blue-600 whitespace-nowrap">
                              {ord.budget ? `${Number(ord.budget).toLocaleString()} ₸` : 'Договорная'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setSelectedOrderResponses(ord.responses || []);
                                setActiveOrderTitle(ord.title);
                              }}
                              className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                            >
                              💬 Отклики ({responsesCount})
                            </button>

                            <div className="flex items-center gap-2">
                              <select
                                value={ord.status || 'open'}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 font-medium text-gray-700"
                              >
                                <option value="open">🟢 В поиске</option>
                                <option value="in_progress">🟡 В работе</option>
                                <option value="completed">🔵 Завершен</option>
                              </select>

                              <button
                                onClick={() => handleDeleteOrder(ord.id)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}