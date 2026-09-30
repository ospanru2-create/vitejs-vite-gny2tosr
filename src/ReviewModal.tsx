import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPhone: string;
  masterName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({ isOpen, onClose, masterPhone, masterName, onReviewSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('reviews').insert([
      {
        master_phone: masterPhone.trim(),
        author_name: authorName || 'Заказчик',
        rating,
        comment
      }
    ]);

    setLoading(false);

    if (error) {
      alert('Ошибка при сохранении отзыва: ' + error.message);
    } else {
      alert('Спасибо! Ваш отзыв успешно сохранен.');
      setComment('');
      setAuthorName('');
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative my-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10 p-1"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Оставить отзыв
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Мастер: <span className="font-bold text-gray-800">{masterName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Оценка работы</label>
            <div className="flex gap-2 justify-center bg-gray-50 p-3 rounded-xl border border-gray-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl transition transform hover:scale-110 focus:outline-none"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ваше имя</label>
            <input 
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Например: Арман"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Комментарий / Ваше впечатление *</label>
            <textarea 
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите, насколько быстро и качественно мастер выполнил работу..."
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить отзыв'}
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