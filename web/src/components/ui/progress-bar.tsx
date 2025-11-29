import { motion } from 'motion/react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}
export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[var(--accent-blue)] rounded-full"
        initial={{
          width: 0,
        }}
        animate={{
          width: `${progress}%`,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      />
    </div>
  );
};
