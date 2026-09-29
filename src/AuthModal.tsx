import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'master'>('client');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // Регистрация
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role
          }
        }
      });

      setLoading(false);

      if (error) {
        alert('Ошибка при регистрации: ' + error.message);
      } else {
        alert('Регистрация прошла успешно! Если требуется подтверждение, проверьте ваш email.');
        if (phone) localStorage.setItem('user_phone', phone);
        onClose();
      }
    } else {
      // Вход
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      setLoading(false);

      if (error) {
        alert('Ошибка при входе: ' + error.message);
      } else {
        alert('Вы успешно вошли в систему!');
        if (data.user?.user_metadata?.phone) {
          localStorage.setItem('user_phone', data.user.user_metadata.phone);
        }
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {isSignUp ? 'Регистрация' : 'Вход в аккаунт'}
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6">
          {isSignUp ? 'Создайте профиль заказчика или мастера' : 'Введите ваши данные для входа на платформу'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              {/* Выбор роли */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    role === 'client' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Заказчик
                </button>
                <button
                  type="button"
                  onClick={() => setRole('master')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    role === 'master' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Исполнитель (Мастер)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Имя и Фамилия</label>
                <input 
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Руслан Оспанов"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Номер телефона</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (707) 123-45-67"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.kz"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Пароль</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-50 mt-2"
          >
            {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          {isSignUp ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-1 text-blue-600 font-bold hover:underline"
          >
            {isSignUp ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
}