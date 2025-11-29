import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
// @ts-ignore
import Aurora from '../components/Aurora';

interface RegisterPageProps {
  onRegister?: () => void;
  onLoginClick: () => void;
}

export const Register = ({ onRegister, onLoginClick }: RegisterPageProps) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    navigate('/onboarding', {
      state: {
        registrationData: {
          name,
          email,
          password,
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-morplo-gray-130 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <Aurora
          colorStops={['#00E5FF', '#2979FF', '#00E5FF']}
          speed={0.5}
        />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-morplo-gray-900 mb-2">
            Create an account
          </h1>
          <p className="text-morplo-gray-600">
            Join NewsHub to get personalized news
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-morplo-gray-900 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-morplo-gray-130 rounded-lg text-morplo-gray-900 placeholder-morplo-gray-50 focus:outline-none focus:ring-2 focus:ring-morplo-blue-100 transition-shadow"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-morplo-gray-900 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-morplo-gray-130 rounded-lg text-morplo-gray-900 placeholder-morplo-gray-50 focus:outline-none focus:ring-2 focus:ring-morplo-blue-100 transition-shadow"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-morplo-gray-900 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-morplo-gray-130 rounded-lg text-morplo-gray-900 placeholder-morplo-gray-50 focus:outline-none focus:ring-2 focus:ring-morplo-blue-100 transition-shadow"
                required
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-3 bg-morplo-blue-100 text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors cursor-pointer"
            >
              Continue to Onboarding
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-morplo-gray-600">
              Already have an account?{' '}
              <button 
                onClick={onLoginClick}
                className="text-morplo-blue-100 hover:underline font-medium cursor-pointer"
            > Sign in </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}