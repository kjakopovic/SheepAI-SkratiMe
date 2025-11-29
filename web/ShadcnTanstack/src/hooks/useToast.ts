import { toast } from 'react-toastify';

enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warn',
  INFO = 'info',
}

enum ToastDuration {
  SHORT = 1000,
  MEDIUM = 2000,
  LONG = 5000,
}

export interface ToastProps {
  text: string;
  type: ToastType;
  duration?: ToastDuration;
}

const useToast = () => {
  const showToast = (toastProps: ToastProps) =>
    toast[toastProps.type](toastProps.text, {
      autoClose: toastProps?.duration || ToastDuration.MEDIUM,
      position: 'bottom-right',
      closeOnClick: true,
    });

  return { showToast, ToastType, ToastDuration };
};

export default useToast;
