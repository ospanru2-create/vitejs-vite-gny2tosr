import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Астана');
  const [specialty, setSpecialty] = useState('Ремонт и отделка');
  const [experience, setExperience] = useState('');
  const [about, setAbout] = useState('');
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setFullName(data.full_name || user.user_metadata?.full_name || '');
      setPhone(data.phone || localStorage.getItem('user_phone') || '');
      setCity(data.city || 'Астана');
      setSpecialty(data.specialty || 'Ремонт и отделка');
      setExperience(data.experience || '');
      setAbout(data.about || '');
      setPortfolio(data.portfolio_images || []);
    } else {
      setFullName(user.user_metadata?.full_name || '');
      setPhone(localStorage.getItem('user_phone') || '');
    }
  };

  if (!isOpen || !user) return null;

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

  const handleUploadPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const newImages: string[] = [...portfolio];
    const selectedFiles = Array.from(e.target.files).slice(0, 5);

    for (const file of selectedFiles) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `portfolio_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;

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
            newImages.push(publicUrlData.publicUrl);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки портфолио:', err);
      }
    }

    setPortfolio(newImages);
    setUploading(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setPortfolio(portfolio.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const profileData = {
      id: user.id,
      full_name: fullName,
      phone,
      city,
      specialty,
      experience,
      about,
      portfolio_images: portfolio,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData);

    setSaving(false);

    if (error) {
      alert('Ошибка сохранения профиля: ' + error.message);
    } else {
      localStorage.setItem('master_name', fullName);
      localStorage.setItem('user_phone', phone);
      alert('Профиль и портфолио успешно сохранены!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">
          Профиль мастера / Исполнителя
        </h2>

        <form onSubmit={handleSave} className="overflow-y-auto pr-1 flex-1 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Имя / Название компании *</label>
            <input 
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иван Петров или ИП Оспанов"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Основная специализация</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Ремонт и отделка">Ремонт и отделка</option>
                <option value="Сантехника">Сантехника</option>
                <option value="Электрика">Электрика</option>
                <option value="Клининг">Клининг</option>
                <option value="Перевозки">Перевозки</option>
                <option value="Универсальный мастер">Универсальный мастер</option>
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Опыт работы</label>
              <input 
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Например: 5 лет"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">О себе и ваших услугах</label>
            <textarea 
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Опишите, какие виды работ выполняете, какое оборудование используете и даёте ли гарантию..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-700">Портфолио работ (фото выполненных заказов)</label>
              <span className="text-[10px] text-gray-400">{portfolio.length} / 10 фото</span>
            </div>

            {portfolio.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {portfolio.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 h-20">
                    <img src={imgUrl} alt={`Работы ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-80 hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input 
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadPortfolio}
              disabled={uploading}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {uploading && <p className="text-[10px] text-blue-600 font-semibold mt-1">Оптимизация и загрузка фото...</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить профиль'}
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