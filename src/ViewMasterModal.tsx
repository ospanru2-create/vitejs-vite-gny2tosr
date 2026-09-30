import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ReviewModal from './ReviewModal';

interface ViewMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
}

export default function ViewMasterModal({ isOpen, onClose, phone }: ViewMasterModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen && phone) {
      loadMasterData();
    }
  }, [isOpen, phone]);

  const loadMasterData = async () => {
    setLoading(true);

    // Загрузка профиля
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone.trim())
      .maybeSingle();

    setProfile(profileData || null);

    // Загрузка отзывов
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('master_phone', phone.trim())
      .order('created_at', { ascending: false });

    setReviews(reviewsData || []);
    setLoading(false);
  };

  if (!isOpen) return null;

  const cleanPhoneForWhatsapp = (p: string) => {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '');
  };

  const phoneDigits = cleanPhoneForWhatsapp(phone);

  // Средний рейтинг
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10 p-1 bg-white/80 rounded-full"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">
          Карточка исполнителя
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Загрузка карточки мастера...</div>
        ) : (
          <div className="overflow-y-auto pr-1 flex-1 space-y-4">
            {/* Шапка профиля */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-gray-900">{profile?.full_name || 'Мастер'}</h3>
                  {averageRating && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ⭐ {averageRating} ({reviews.length})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs font-bold text-blue-600 bg-white px-2.5 py-0.5 rounded-md border border-blue-100">
                    {profile?.specialty || 'Универсальный мастер'}
                  </span>
                  {profile?.city && (
                    <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
                      📍 {profile.city}
                    </span>
                  )}
                  {profile?.experience && (
                    <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      Опыт: {profile.experience}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsReviewOpen(true)}
                className="text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm transition whitespace-nowrap"
              >
                + Отзыв
              </button>
            </div>

            {/* Описание */}
            {profile?.about && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">О мастере и услугах</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {profile.about}
                </p>
              </div>
            )}

            {/* Портфолио работ */}
            {profile?.portfolio_images && profile.portfolio_images.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Портфолио выполненных работ</h4>
                <div className="grid grid-cols-3 gap-2">
                  {profile.portfolio_images.map((imgUrl: string, idx: number) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Портфолио ${idx + 1}`}
                      onClick={() => setSelectedImage(imgUrl)}
                      className="w-full h-24 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Блок Отзывов */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Отзывы заказчиков ({reviews.length})</h4>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">
                  У мастера пока нет отзывов. Вы можете стать первым!
                </div>
              ) : (
                <div className="space-y-2">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">👤 {rev.author_name}</span>
                        <span className="text-amber-500 font-bold">
                          {'⭐'.repeat(rev.rating || 5)}
                        </span>
                      </div>
                      <p className="text-gray-700">{rev.comment}</p>
                      <span className="text-[10px] text-gray-400 block pt-0.5">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ru-RU') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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

            {/* Кнопки связи */}
            <div className="flex gap-2 pt-2">
              {phoneDigits && (
                <a 
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: '#25D366' }}
                  className="flex-1 text-center text-xs text-white font-bold py-3 rounded-xl transition shadow-sm hover:opacity-90"
                >
                  💬 Открыть WhatsApp
                </a>
              )}
              <a 
                href={`tel:${phone}`}
                className="flex-1 text-center text-xs bg-gray-100 text-gray-800 font-bold py-3 rounded-xl border border-gray-200 transition hover:bg-gray-200"
              >
                📞 Позвонить
              </a>
            </div>
          </div>
        )}

        {/* Окно отзыва */}
        <ReviewModal 
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          masterPhone={phone}
          masterName={profile?.full_name || 'Мастер'}
          onReviewSubmitted={loadMasterData}
        />
      </div>
    </div>
  );
}