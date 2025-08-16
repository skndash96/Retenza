'use client';

import { useState } from 'react';
import LoginButton from '@/components/ui/loginButton';

interface LoginFormProps {
  onLogin: (data: { phone: string; password: string; }) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({phone, password});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-accent-text mb-1">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full px-4 py-2 border border-accent-light rounded-md focus:outline-none focus:ring-2 focus:ring-accent-pink bg-background-light"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-accent-text mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-accent-light rounded-md focus:outline-none focus:ring-2 focus:ring-accent-pink bg-background-light"
        />
      </div>
    
      <LoginButton content="Log In" type="submit" />
    </form>
  );
}