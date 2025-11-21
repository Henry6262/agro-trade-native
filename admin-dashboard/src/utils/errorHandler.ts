import { toast } from 'sonner';
import axios from 'axios';

export const handleApiError = (error: unknown, fallbackMessage = 'An error occurred') => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || fallbackMessage;
    const statusCode = error.response?.status;

    switch (statusCode) {
      case 400:
        toast.error('Invalid Request', { description: message });
        break;
      case 401:
        toast.error('Unauthorized', { description: 'Please log in again' });
        break;
      case 403:
        toast.error('Access Denied', { description: message });
        break;
      case 404:
        toast.error('Not Found', { description: message });
        break;
      case 409:
        toast.error('Conflict', { description: message });
        break;
      case 500:
        toast.error('Server Error', {
          description: 'Please try again or contact support',
        });
        break;
      default:
        toast.error('Error', { description: message });
    }
  } else if (error instanceof Error) {
    toast.error('Error', { description: error.message });
  } else {
    toast.error(fallbackMessage);
  }
};
