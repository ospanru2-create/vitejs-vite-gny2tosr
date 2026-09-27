import React, { useState } from 'react';
import { supabase } from './supabase';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ремонт и отделка');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      alert('Пожалуйста, заполните заголовок и цену');
      return;
    }

    setLoading(true);

    // Получаем текущего авторизованного пользователя
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const formattedPrice = price.includes('₸') ? price : `${price} ₸`;

    const newOrder = {
      title,
      category,
      price: formattedPrice,
      description,
      phone,
      user_id: user?.id || null,
    };

    try {
      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) {
        console.warn('Ошибка базы данных Supabase:', error.message);
        // Резервное сохранение в локальный список
        const savedOrders = JSON.parse(
          localStorage.getItem('local_orders') || '[]'
        );
        localStorage.setItem(
          'local_orders',
          JSON.stringify([
            {
              ...newOrder,
              id: String(Date.now()),
              created_at: new Date().toISOString(),
            },
            ...savedOrders,
          ])
        );
      }
    } catch (err) {
      console.warn('Ошибка сети, сохранено локально:', err);
    }

    setLoading(false);
    onOrderCreated();
    onClose();

    setTitle('');
    setPrice('');
    setDescription('');
    setPhone('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-slate-900">Новый заказ</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название услуги *
            </label>
            <input
              type="text"
              required
              placeholder="Например: Установка смесителя"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Категория *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Ремонт и отделка">Ремонт и отделка</option>
              <option value="Сантехника">Сантехника</option>
              <option value="Электрика">Электрика</option>
              <option value="Уборка">Уборка</option>
              <option value="Грузоперевозки">Грузоперевозки</option>
              <option value="Бытовой ремонт">Бытовой ремонт</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Бюджет (₸) *
            </label>
            <input
              type="text"
              required
              placeholder="15000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Телефон для связи
            </label>
            <input
              type="tel"
              placeholder="+7 (707) 000-00-00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Детали заказа
            </label>
            <textarea
              rows={3}
              placeholder="Опишите подробности задачи..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm transition shadow-md active:scale-95"
          >
            {loading ? 'Публикация...' : 'Опубликовать заказ'}
          </button>
        </form>
      </div>
    </div>
  );
};
