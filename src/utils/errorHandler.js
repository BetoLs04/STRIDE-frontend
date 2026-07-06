import { toast } from 'react-toastify';

export const handleApiError = (error, context = 'Error al procesar la solicitud') => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    context;

  console.error(`[${context}]`, error);
  toast.error(message);

  return message;
};
