// The only module allowed to import sonner: one place to change the toast library.
// eslint-disable-next-line no-restricted-imports
import { toast as sonner } from 'sonner';

export const toast = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
};
