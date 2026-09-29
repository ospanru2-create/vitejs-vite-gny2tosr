import React, { useState } from 'react';
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
      setSuccessMsg('Ваш отклик успешно отправлен заказчику!');
      setTimeout(() => {
        setSuccessMsg('');
        setShowResponseForm(false);
        setPrice('');
        setComment('');
        setPhone('');
      }, 2000);
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

        {/* Форма отклика мастера */}
        {showResponseForm ? (
          <form onSubmit={handleSendResponse} className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl mb-4 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Откликнуться на задание</h3>

            {successMsg ? (
              <div className="p-3 bg-green-100 text-green-800 rounded-xl text-center text-sm font-medium">
                {successMsg}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ваше ценовое предложение (₸)</label>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={order.budget ? String(order.budget) : "Укажите вашу цену"}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ваш номер телефона *</label>
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (707) 123-45-67"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Комментарий к отклику</label>
                  <textarea 
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Расскажите о вашем опыте или предложите условия..."
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-50"
                  >
                    {loading ? 'Отправка...' : 'Предложить услуги'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResponseForm(false)}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition"
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowResponseForm(true)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-200"
            >
              Откликнуться на заказ
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