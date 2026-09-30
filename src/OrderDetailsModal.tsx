import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

export default function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('user_phone');
      if (savedPhone) {
        setPhone(savedPhone);
      }
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('responses').insert([
      {
        order_id: order.id,
        price: price ? Number(price) : null,
        phone,
        comment
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при отправке отклика: ' + error.message);
    } else {
      localStorage.setItem('user_phone', phone);
      alert('Ваш отклик успешно отправлен заказчику!');
      setPrice('');
      setComment('');
      setShowResponseForm(false);
      onClose();
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

        {/* Категория, Город и Дата */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              {order.category || 'Общее'}
            </span>
            {order.city && (
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                📍 {order.city}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : ''}
          </span>
        </div>

        {/* Заголовок и Бюджет */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{order.title}</h2>
        <div className="text-2xl font-black text-blue-600 mb-4">
          {order.budget ? `${Number(order.budget).toLocaleString()} ₸` : 'Договорная'}
        </div>

        {/* Описание заказа */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Описание задания</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {order.description || 'Заказчик не указал подробное описание.'}
          </p>
        </div>

        {/* Форма отклика мастера */}
        {showResponseForm ? (
          <form onSubmit={handleSubmitResponse} className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-900">Предложить свои услуги</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ваша цена (₸)</label>
              <input 
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Оставьте пустым, если согласны с бюджетом"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
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
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Комментарий к отклику</label>
              <textarea 
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите ваш опыт, сроки выполнения или уточняющие вопросы..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Отправить отклик'}
              </button>
              <button
                type="button"
                onClick={() => setShowResponseForm(false)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-300 transition"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowResponseForm(true)}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200"
            >
              Откликнуться на заказ
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}