import { useState } from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { ProgressBar } from '../components/ui/progress-bar';
import { Category } from '../types/index';

interface OnboardingProps {
  onComplete: (userType: string, interests: Category[]) => void;
}
type UserType = 'Student' | 'Professional' | 'Researcher' | 'Enthusiast' | 'Other';
const userTypes: {
  value: UserType;
  description: string;
}[] = [
  {
    value: 'Student',
    description: 'Learning and staying updated',
  },
  {
    value: 'Professional',
    description: 'Industry news and insights',
  },
  {
    value: 'Researcher',
    description: 'In-depth analysis and studies',
  },
  {
    value: 'Enthusiast',
    description: 'General interest and curiosity',
  },
  {
    value: 'Other',
    description: 'Just exploring',
  },
];
export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const categories: Category[] = [
    'Malware',
    'Phishing',
    'AI Agents',
    'Data Breach',
    'Vulnerability',
    'Social Engineering',
    'Cloud Security',
    'DevSecOps',
    'Zero Trust',
    'Ransomware',
  ];
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Category[]>([]);
  const totalSteps = 3;
  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
  };
  const handleInterestToggle = (interest: Category) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(userType || 'Other', selectedInterests);
    }
  };
  const handleSkip = () => {
    onComplete('Other', []);
  };
  const canProceed = () => {
    if (step === 2) return userType !== null;
    if (step === 3) return selectedInterests.length > 0;
    return true;
  };
  return (
    <div className="min-h-screen bg-morplo-gray-130 flex flex-col">
      <div className="w-full px-6 pt-6">
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentStep={step} totalSteps={totalSteps} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="welcome"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="text-center"
              >
                <h1 className="text-4xl font-bold text-morplo-gray-900 mb-4">
                  Welcome to NewsHub
                </h1>
                <p className="text-lg text-morplo-gray-600 mb-12 max-w-lg mx-auto">
                  Let's personalize your experience. We'll help you discover
                  news that matters to you.
                </p>
                <motion.button
                  onClick={handleNext}
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="px-8 py-4 bg-morplo-blue-100 text-white rounded-xl font-medium text-lg hover:bg-opacity-90 transition-colors"
                >
                  Get started
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="usertype"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                transition={{
                  duration: 0.3,
                }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-morplo-gray-900 mb-3">
                    What describes you best?
                  </h2>
                  <p className="text-morplo-gray-600">
                    This helps us tailor content to your needs
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  {userTypes.map((type, index) => (
                    <motion.button
                      key={type.value}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.05,
                      }}
                      onClick={() => handleUserTypeSelect(type.value)}
                      className={`p-5 rounded-xl text-left transition-all ${userType === type.value ? 'bg-morplo-blue-100 text-white shadow-md' : 'bg-white text-morplo-gray-900 hover:shadow-md'}`}
                    >
                      <div className="font-semibold mb-1">{type.value}</div>
                      <div
                        className={`text-sm ${userType === type.value ? 'text-white text-opacity-90' : 'text-morplo-gray-600'}`}
                      >
                        {type.description}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleSkip}
                    whileHover={{
                      scale: 1.01,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    className="flex-1 px-6 py-3 bg-white text-morplo-gray-600 rounded-xl font-medium hover:bg-morplo-gray-200 transition-colors"
                  >
                    Skip
                  </motion.button>
                  <motion.button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    whileHover={
                      canProceed()
                        ? {
                            scale: 1.01,
                          }
                        : {}
                    }
                    whileTap={
                      canProceed()
                        ? {
                            scale: 0.98,
                          }
                        : {}
                    }
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${canProceed() ? 'bg-morplo-blue-100 text-white hover:bg-opacity-90' : 'bg-morplo-gray-200 text-morplo-gray-500 cursor-not-allowed'}`}
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="interests"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                transition={{
                  duration: 0.3,
                }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-morplo-gray-900 mb-3">
                    Choose your interests
                  </h2>
                  <p className="text-morplo-gray-600">
                    Select topics you'd like to follow (choose at least one)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.04,
                      }}
                      onClick={() => handleInterestToggle(category)}
                      className={`p-4 rounded-xl font-medium transition-all ${selectedInterests.includes(category) ? 'bg-morplo-blue-100 text-white shadow-md' : 'bg-white text-morplo-gray-900 hover:shadow-md'}`}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleSkip}
                    whileHover={{
                      scale: 1.01,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    className="flex-1 px-6 py-3 bg-white text-morplo-gray-600 rounded-xl font-medium hover:bg-morplo-gray-200 transition-colors"
                  >
                    Skip
                  </motion.button>
                  <motion.button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    whileHover={
                      canProceed()
                        ? {
                            scale: 1.01,
                          }
                        : {}
                    }
                    whileTap={
                      canProceed()
                        ? {
                            scale: 0.98,
                          }
                        : {}
                    }
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${canProceed() ? 'bg-morplo-blue-100 text-white hover:bg-opacity-90' : 'bg-morplo-gray-200 text-morplo-gray-500 cursor-not-allowed'}`}
                  >
                    Complete setup
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
