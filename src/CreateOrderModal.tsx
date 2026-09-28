import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ремонт');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('orders').insert([
      {
        title,
        category,
        budget: budget ? parseFloat(budget) : null,
        phone,
        description,
        status: 'active'
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при создании заказа: ' + error.message);
    } else {
      alert('Заказ успешно создан и сохранен в базе!');
      setTitle('');
      setBudget('');
      setPhone('');
      setDescription('');
      if (onOrderCreated) onOrderCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Создать заказ</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Что нужно сделать?</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Установка кондиционера" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="Ремонт">Ремонт</option>
              <option value="Клининг">Клининг</option>
              <option value="Перевозки">Грузоперевозки</option>
              <option value="Сантехника">Сантехника</option>
              <option value="Электрика">Электрика</option>
              <option value="Красота">Услуги красоты</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет (₸)</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="15000" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (707) 123-45-67" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подробное описание</label>
            <textarea 
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите детали заказа..." 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? 'Публикация...' : 'Опубликовать заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}