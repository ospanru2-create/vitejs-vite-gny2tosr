import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ремонт и отделка');
  const [city, setCity] = useState('Астана');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('user_phone');
      if (savedPhone) setPhone(savedPhone);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3); // Максимум 3 фото
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const imageUrls: string[] = [];

    // Загрузка изображений в Supabase Storage
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('order-photos')
        .upload(fileName, file);

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('order-photos')
          .getPublicUrl(fileName);

        if (publicUrlData.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    // Сохранение заказа в базу
    const { error } = await supabase.from('orders').insert([
      {
        title,
        category,
        city,
        budget: budget ? Number(budget) : null,
        phone,
        description,
        images: imageUrls,
        status: 'open'
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при создании заказа: ' + error.message);
    } else {
      localStorage.setItem('user_phone', phone);
      alert('Заказ успешно создан!');
      setTitle('');
      setBudget('');
      setDescription('');
      setFiles([]);
      onOrderCreated();
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

        <h2 className="text-xl font-bold text-gray-900 mb-4">Создать новый заказ</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Что нужно сделать? *</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Ремонт смесителя, Уборка квартиры..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Ремонт и отделка">Ремонт и отделка</option>
                <option value="Сантехника">Сантехника</option>
                <option value="Электрика">Электрика</option>
                <option value="Клининг">Клининг</option>
                <option value="Перевозки">Перевозки</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Город</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Астана">Астана</option>
                <option value="Алматы">Алматы</option>
                <option value="Шымкент">Шымкент</option>
                <option value="Караганда">Караганда</option>
                <option value="Актобе">Актобе</option>
                <option value="Павлодар">Павлодар</option>
                <option value="Усть-Каменогорск">Усть-Каменогорск</option>
                <option value="Семей">Семей</option>
                <option value="Атырау">Атырау</option>
                <option value="Актау">Актау</option>
                <option value="Весь Казахстан">Весь Казахстан</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Бюджет (₸)</label>
              <input 
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Договорная"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Телефон *</label>
              <input 
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (707) 123-45-67"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Подробное описание</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Укажите подробности, ориентиры или требования..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Прикрепить фото (до 3 шт.)</label>
            <input 
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Опубликовать заказ'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}