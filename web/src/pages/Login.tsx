import React, { useState } from 'react';

import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: () => void;
}
export const Login = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-6">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome to NewsHub</h1>
          <p className="text-[var(--text-secondary)]">Stay informed with personalized news</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-shadow"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-shadow"
                required
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="w-full px-4 py-3 bg-[var(--accent-blue)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              Continue
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <button className="text-[var(--accent-blue)] font-medium hover:underline">Sign up</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
