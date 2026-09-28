import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyOrders();
    }
  }, [isOpen]);

  const fetchMyOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Мои заказы</h2>

        <div className="overflow-y-auto flex-1 pr-2 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Заказов пока нет</div>
          ) : (
            orders.map((item) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                  <span className="text-blue-600 font-bold">
                    {item.budget ? `${Number(item.budget).toLocaleString()} ₸` : 'Договорная'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                <div className="text-xs text-gray-400">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}