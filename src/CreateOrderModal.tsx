import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const TELEGRAM_BOT_TOKEN = '8458804133:AAF8BpkddexwjzopM0n-eWb4kLvhVD-aObc';
const TELEGRAM_CHAT_ID = '8781696457';

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ремонт и отделка');
  const [city, setCity] = useState('Астана');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
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
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      setFiles(selectedFiles);
    }
  };

  // Клиентская компрессия для iOS (HEIC / Large Images)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const sendTelegramNotification = async (orderTitle: string, orderCat: string, orderCity: string, orderBudget: string, orderPhone: string, orderDesc: string, featured: boolean) => {
    if (!TELEGRAM_BOT_TOKEN) return;

    const message = `${featured ? '🔥 <b>СРОЧНЫЙ ПРЕМИУМ ЗАКАЗ!</b>' : '🚨 <b>НОВЫЙ ЗАКАЗ на uslugikz.asia</b>'}\n\n` +
      `📌 <b>Заголовок:</b> ${orderTitle}\n` +
      `📂 <b>Категория:</b> ${orderCat}\n` +
      `📍 <b>Город:</b> ${orderCity}\n` +
      `💰 <b>Бюджет:</b> ${orderBudget ? `${orderBudget} ₸` : 'Договорная'}\n` +
      `📞 <b>Телефон:</b> ${orderPhone}\n` +
      `📝 <b>Описание:</b> ${orderDesc || 'Не указано'}\n\n` +
      `🔗 <a href="https://uslugikz.asia/">Перейти к заказу на сайте</a>`;

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (err) {
      console.error('Ошибка отправки в Telegram:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const imageUrls: string[] = [];

    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

        const { data, error } = await supabase.storage
          .from('order-photos')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('order-photos')
            .getPublicUrl(fileName);

          if (publicUrlData.publicUrl) {
            imageUrls.push(publicUrlData.publicUrl);
          }
        }
      } catch (err) {
        console.error('Ошибка сжатия/загрузки:', err);
      }
    }

    const { error } = await supabase.from('orders').insert([
      {
        title,
        category,
        city,
        budget: budget ? Number(budget) : null,
        phone,
        description,
        images: imageUrls,
        is_featured: isFeatured,
        status: 'open'
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при создании заказа: ' + error.message);
    } else {
      localStorage.setItem('user_phone', phone);
      sendTelegramNotification(title, category, city, budget, phone, description, isFeatured);

      alert('Заказ успешно создан!');
      setTitle('');
      setBudget('');
      setDescription('');
      setIsFeatured(false);
      setFiles([]);
      onOrderCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10 p-1 bg-white/80 rounded-full"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">Создать новый заказ</h2>

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 flex-1 space-y-4">
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

          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">🔥 Выделить как СРОЧНЫЙ / ПРЕМИУМ</span>
              <span className="text-[11px] text-amber-700 block">Заказ подсветится и закрепится вверху</span>
            </div>
            <input 
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
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
              {loading ? 'Публикация и сжатие фото...' : 'Опубликовать заказ'}
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