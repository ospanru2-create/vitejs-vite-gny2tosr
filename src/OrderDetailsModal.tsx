import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface Order {
  id: string;
  title: string;
  category: string;
  price: string;
  description?: string;
  status?: string;
  created_at: string;
}

interface Bid {
  id: string;
  master_name: string;
  master_phone?: string;
  price: string;
  message?: string;
  created_at: string;
  rating?: number;
  review?: string;
}

interface OrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [masterName, setMasterName] = useState('');
  const [masterPhone, setMasterPhone] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      loadBids();
    }
  }, [order, isOpen]);

  const loadBids = async () => {
    if (!order) return;

    const localBids: Bid[] = JSON.parse(
      localStorage.getItem(`bids_${order.id}`) || '[]'
    );

    try {
      const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (data) {
        const combined = [
          ...data,
          ...localBids.filter((lb) => !data.some((d) => d.id === lb.id)),
        ];
        setBids(combined);
      } else {
        setBids(localBids);
      }
    } catch {
      setBids(localBids);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !masterName || !offerPrice) return;

    setIsSubmitting(true);

    const newBid: Bid = {
      id: Date.now().toString(),
      master_name: masterName,
      master_phone: masterPhone,
      price: offerPrice,
      message: message,
      created_at: new Date().toISOString(),
    };

    // 1. Сохраняем локально
    const localBids: Bid[] = JSON.parse(
      localStorage.getItem(`bids_${order.id}`) || '[]'
    );
    const updatedLocal = [newBid, ...localBids];
    localStorage.setItem(`bids_${order.id}`, JSON.stringify(updatedLocal));

    // 2. Сохраняем в Supabase
    try {
      await supabase.from('bids').insert([
        {
          order_id: order.id,
          master_name: masterName,
          master_phone: masterPhone,
          price: offerPrice,
          message: message,
        },
      ]);
    } catch (err) {
      console.warn('Supabase bid insert failed:', err);
    }

    setBids([newBid, ...bids]);
    setMessage('');
    setOfferPrice('');
    setIsSubmitting(false);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
        >
          ✕
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
            {order.category}
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            {order.title}
          </h2>
          <p className="text-emerald-600 font-extrabold text-lg mt-1">
            {order.price}
          </p>
        </div>

        {order.description && (
          <div className="bg-slate-50 p-3 rounded-lg mb-4 text-xs text-slate-600">
            {order.description}
          </div>
        )}

        <hr className="my-4 border-slate-100" />

        {/* Форма отклика для мастера */}
        <form
          onSubmit={handleSubmitBid}
          className="space-y-3 mb-6 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100"
        >
          <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-wider">
            Откликнуться на заказ
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Ваше имя *"
              required
              value={masterName}
              onChange={(e) => setMasterName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 bg-white"
            />
            <input
              type="tel"
              placeholder="Телефон (WhatsApp) *"
              required
              value={masterPhone}
              onChange={(e) => setMasterPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 bg-white"
            />
          </div>

          <input
            type="text"
            placeholder="Ваша цена (например, 15 000 ₸) *"
            required
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 bg-white"
          />

          <textarea
            placeholder="Комментарий к предложению (опыт, когда готовы приступить)..."
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 bg-white resize-none"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-md shadow-indigo-200"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить предложение'}
          </button>
        </form>

        {/* Список существующих предложений */}
        <div>
          <h3 className="font-bold text-xs text-slate-700 mb-3">
            Предложения мастеров ({bids.length}):
          </h3>

          {bids.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Пока нет откликов. Будьте первым!
            </p>
          ) : (
            <div className="space-y-2.5">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900">
                        {bid.master_name}
                      </span>
                      {bid.review && bid.rating && (
                        <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                          {'⭐'.repeat(bid.rating)} ({bid.rating}/5)
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold text-indigo-600">
                      {bid.price}
                    </span>
                  </div>

                  {bid.message && (
                    <p className="text-slate-600 text-[11px] bg-slate-50 p-2 rounded-lg">
                      {bid.message}
                    </p>
                  )}

                  {bid.review && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 italic">
                      Отзыв заказчика: "{bid.review}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
