import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

export default function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchResponses();
    }
  }, [isOpen, order]);

  const fetchResponses = async () => {
    setLoadingResponses(true);
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResponses(data);
    }
    setLoadingResponses(false);
  };

  if (!isOpen || !order) return null;

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('responses').insert([
      {
        order_id: order.id,
        price: price ? Number(price) : null,
        comment,
        phone
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при отправке отклика: ' + error.message);
    } else {
      setSuccessMsg('Ваш отклик успешно отправлен!');
      fetchResponses(); // обновить список откликов
      setTimeout(() => {
        setSuccessMsg('');
        setShowResponseForm(false);
        setPrice('');
        setComment('');
        setPhone('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg">
            {order.category || 'Общее'}
          </span>
          <span className="text-xs text-gray-400">
            {order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : ''}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{order.title}</h2>
        
        <div className="text-2xl font-black text-blue-600 mb-4">
          {order.budget ? `${Number(order.budget).toLocaleString()} ₸` : 'Договорная'}
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Описание задания</h3>
          <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
            {order.description || 'Описание отсутствует'}
          </p>
        </div>

        {/* Список откликов мастеров */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
            <span>Отклики мастеров</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {responses.length}
            </span>
          </h3>

          {loadingResponses ? (
            <div className="text-xs text-gray-400 text-center py-2">Загрузка откликов...</div>
          ) : responses.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Пока нет откликов. Будьте первым!
            </div>
          ) : (
            <div className="space-y-2.5">
              {responses.map((res) => (
                <div key={res.id} className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-200 transition">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-blue-600">
                      {res.price ? `${Number(res.price).toLocaleString()} ₸` : 'Цена по договору'}
                    </span>
                    <a 
                      href={`tel:${res.phone}`}
                      className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-lg border border-green-200 hover:bg-green-100 transition"
                    >
                      📞 {res.phone}
                    </a>
                  </div>
                  {res.comment && (
                    <p className="text-xs text-gray-600 mt-1">{res.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Форма отклика */}
        {showResponseForm ? (
          <form onSubmit={handleSendResponse} className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl mb-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Ваше предложение</h3>

            {successMsg ? (
              <div className="p-3 bg-green-100 text-green-800 rounded-xl text-center text-xs font-semibold">
                {successMsg}
              </div>
            ) : (
              <>
                <div>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ваша цена (₸)"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Телефон для связи *"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <textarea 
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Комментарий (опыт, сроки, гарантия)..."
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
                  >
                    {loading ? 'Отправка...' : 'Отправить предложение'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResponseForm(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-300 transition"
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowResponseForm(true)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-blue-100"
            >
              Откликнуться
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-semibold"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}