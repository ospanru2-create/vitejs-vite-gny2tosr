import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ViewMasterModal from './ViewMasterModal';

interface MastersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MastersListModal({ isOpen, onClose }: MastersListModalProps) {
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [selectedMasterPhone, setSelectedMasterPhone] = useState<string | null>(null);

  const categories = ['Все', 'Ремонт и отделка', 'Сантехника', 'Электрика', 'Клининг', 'Перевозки', 'Универсальный мастер'];
  const cities = ['Все города', 'Астана', 'Алматы', 'Шымкент', 'Караганда', 'Актобе', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау', 'Актау'];

  useEffect(() => {
    if (isOpen) {
      fetchMasters();
    }
  }, [isOpen]);

  const fetchMasters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setMasters(data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const filteredMasters = masters.filter((m) => {
    const matchesCategory = selectedCategory === 'Все' || m.specialty === selectedCategory;
    const matchesCity = selectedCity === 'Все города' || m.city === selectedCity;
    return matchesCategory && matchesCity;
  });

  const cleanPhoneForWhatsapp = (p: string) => {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10 p-1"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">
          Каталог проверенных мастеров
        </h2>

        {/* Фильтры */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 shrink-0">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white"
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === 'Все города' ? '📍 Все города' : `📍 ${c}`}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat === 'Все' ? '🛠️ Все специализации' : cat}</option>
            ))}
          </select>
        </div>

        {/* Список мастеров */}
        <div className="overflow-y-auto pr-1 flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Загрузка мастеров...</div>
          ) : filteredMasters.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed text-gray-400 text-sm">
              В выбранном городе или категории пока нет зарегистрированных мастеров.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredMasters.map((m) => {
                const phoneDigits = cleanPhoneForWhatsapp(m.phone);
                const hasPortfolio = m.portfolio_images && m.portfolio_images.length > 0;

                return (
                  <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-blue-200 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {m.specialty || 'Универсал'}
                        </span>
                        {m.city && (
                          <span className="text-xs text-gray-500 font-medium">
                            📍 {m.city}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-1">{m.full_name || 'Мастер'}</h3>
                      
                      {m.experience && (
                        <p className="text-xs text-amber-700 font-semibold mb-2">
                          ⭐ Опыт: {m.experience}
                        </p>
                      )}

                      {m.about && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                          {m.about}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedMasterPhone(m.phone)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        {hasPortfolio ? `🖼️ Портфолио (${m.portfolio_images.length})` : 'Профиль'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {phoneDigits && (
                          <a 
                            href={`https://wa.me/${phoneDigits}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ backgroundColor: '#25D366' }}
                            className="text-[11px] text-white font-bold px-2.5 py-1.5 rounded-lg shadow-sm hover:opacity-90"
                          >
                            WA
                          </a>
                        )}
                        <a 
                          href={`tel:${m.phone}`}
                          className="text-[11px] bg-gray-100 text-gray-800 font-bold px-2.5 py-1.5 rounded-lg border border-gray-200"
                        >
                          📞
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Просмотр профиля */}
        <ViewMasterModal 
          isOpen={!!selectedMasterPhone}
          onClose={() => setSelectedMasterPhone(null)}
          phone={selectedMasterPhone || ''}
        />
      </div>
    </div>
  );
}