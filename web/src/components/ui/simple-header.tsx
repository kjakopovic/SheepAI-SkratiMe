import { SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface SimpleHeaderProps {
  onSettingsClick?: () => void;
  showSettings?: boolean;
}
export const SimpleHeader = ({ onSettingsClick, }: SimpleHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-300 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <div className="flex items-center gap-3">
          <img src="image.png" alt="Skrati.Me Logo" className="w-24 h-8 object-contain" />
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

      </div>
    </header>
  );
};
