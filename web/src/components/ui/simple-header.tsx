import { SettingsIcon, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { useAuthActions } from '../../hooks/useAuthActions';

interface SimpleHeaderProps {
  onSettingsClick?: () => void;
  showSettings?: boolean;
}
export const SimpleHeader = ({ onSettingsClick, }: SimpleHeaderProps) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const fullName = user?.fullName;
  console.log(user)
  const userName = userString ? JSON.parse(userString) : null;
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-300 px-4 md:px-6 py-4">
      <div className=" mx-auto flex items-center justify-between">

        <div className="flex items-center gap-3">
          <img src="image.png" alt="Skrati.Me Logo" className="w-24 h-8 object-contain" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || 'Felix'}`}
              alt="User Avatar"
              className="w-8 h-8 rounded-full bg-gray-100"
            />
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {fullName || 'User Name'}
            </span>
          </div>

          <motion.button
            onClick={onSettingsClick}
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
            className="p-2 rounded-lg hover:bg-morplo-gray-130 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-morplo-gray-600" />
          </motion.button>

          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>

      </div>
    </header>
  );
};
