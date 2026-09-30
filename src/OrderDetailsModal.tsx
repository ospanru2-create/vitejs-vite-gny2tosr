import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

export default function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  const [masterName, setMasterName] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem('master_name') || '';
      const savedPhone = localStorage.getItem('user_phone') || '';
      if (savedName) setMasterName(savedName);
      if (savedPhone) setPhone(formatPhone(savedPhone));
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // Автоматическое форматирование номера под +7 (7XX) XXX-XX-XX
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    let result = '+7 ';
    const body = numbers.startsWith('7') || numbers.startsWith('8') ? numbers.slice(1) : numbers;
    
    if (body.length > 0) result += '(' + body.substring(0, 3);
    if (body.length >= 3) result += ') ' + body.substring(3, 6);
    if (body.length >= 6) result += '-' + body.substring(6, 8);
    if (body.length >= 8) result += '-' + body.substring(8, 10);
    
    return result;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawPhone = phone.replace(/\D/g, '');

    if (rawPhone.length < 11) {
      alert('Пожалуйста, введите корректный 11-значный номер телефона.');
      return;
    }

    setLoading(true);

    // Проверка на повторный отклик с этого же номера
    const { data: existingResponses } = await supabase
      .from('responses')
      .select('id')
      .eq('order_id', order.id)
      .eq('phone', phone);

    if (existingResponses && existingResponses.length > 0) {
      setLoading(false);
      alert('Вы уже отправляли отклик на этот заказ!');
      return;
    }

    const { error } = await supabase.from('responses').insert([
      {
        order_id: order.id,
        master_name: masterName,
        phone,
        price: price ? Number(price) : null,
        comment
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при отправке отклика: ' + error.message);
    } else {
      localStorage.setItem('master_name', masterName);
      localStorage.setItem('user_phone', phone);
      alert('Ваш отклик успешно отправлен заказчику!');
      setComment('');
      setPrice('');
      onClose();
    }
  };

  const responsesCount = order.responses ? order.responses.length : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10 p-1 bg-white/80 rounded-full"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">Детали заказа</h2>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-blue-100">
                {order.category || 'Общее'}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                📍 {order.city || 'Астана'}
              </span>
            </div>

            <h3 className="text-lg font-black text-gray-900">{order.title}</h3>
            
            <div className="text-xl font-black text-blue-600 pt-1">
              {order.budget ? `${Number(order.budget).toLocaleString()} ₸` : 'Договорная цена'}
            </div>
          </div>

          {order.description && (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Описание задачи</span>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{order.description}</p>
            </div>
          )}

          {/* Галерея изображений */}
          {order.images && order.images.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Фотографии объекта</span>
              <div className="grid grid-cols-3 gap-2">
                {order.images.map((imgUrl: string, idx: number) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Фото ${idx + 1}`}
                    onClick={() => setSelectedImage(imgUrl)}
                    className="w-full h-20 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Форма отклика мастера */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Предложить свои услуги</span>
              <span className="text-xs font-normal text-gray-400">Уже откликов: {responsesCount}</span>
            </h4>

            <form onSubmit={handleSubmitResponse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ваше имя или название компании *</label>
                <input 
                  type="text"
                  required
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  placeholder="Например: ИП Оспанов или Руслан"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ваша цена (₸)</label>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Договорная"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ваш телефон *</label>
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (707) 123-45-67"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Комментарий к отклику</label>
                <textarea 
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Укажите ваш опыт, готовы ли выехать сегодня и есть ли инструмент..."
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {loading ? 'Отправка отклика...' : 'Отправить отклик заказчику'}
              </button>
            </form>
          </div>
        </div>

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
      </div>
    </div>
  );
}