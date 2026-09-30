import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

export default function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  const [masterName, setMasterName] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('user_phone');
      const savedName = localStorage.getItem('master_name');
      if (savedPhone) setPhone(savedPhone);
      if (savedName) setMasterName(savedName);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('responses').insert([
      {
        order_id: order.id,
        master_name: masterName || 'Мастер',
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
      if (masterName) localStorage.setItem('master_name', masterName);
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
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10"
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

        {/* Галерея фото */}
        {order.images && order.images.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Фотографии объекта</h4>
            <div className="grid grid-cols-3 gap-2">
              {order.images.map((imgUrl: string, index: number) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Фото ${index + 1}`}
                  onClick={() => setSelectedImage(imgUrl)}
                  className="w-full h-24 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition"
                />
              ))}
            </div>
          </div>
        )}

        {/* Увеличенное фото */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img src={selectedImage} alt="Увеличенное фото" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
              <p className="text-center text-white text-xs mt-2">Нажмите в любом месте, чтобы закрыть</p>
            </div>
          </div>
        )}

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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ваше имя или название компании *</label>
              <input 
                type="text"
                required
                value={masterName}
                onChange={(e) => setMasterName(e.target.value)}
                placeholder="Иван Петров / Бригада Строитель"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ваша цена (₸)</label>
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Договорная"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ваш телефон *</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (707) 123-45-67"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
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