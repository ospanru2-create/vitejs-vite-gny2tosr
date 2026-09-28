import React from 'react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

export default function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg">
            {order.category || 'Общее'}
          </span>
          <span className="text-xs text-gray-400">
            {order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : ''}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">{order.title}</h2>
        
        <div className="text-2xl font-black text-blue-600 mb-6">
          {order.budget ? `${Number(order.budget).toLocaleString()} ₸` : 'Договорная'}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Описание задачи</h3>
          <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
            {order.description}
          </p>
        </div>

        {order.phone && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-medium">Контакты заказчика</div>
              <div className="text-lg font-bold text-gray-900">{order.phone}</div>
            </div>
            <a 
              href={`tel:${order.phone}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Позвонить
            </a>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}