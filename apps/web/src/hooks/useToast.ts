import { toast } from "sonner";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const showToast = ({ title, description, variant }: ToastProps) => {
    const message = title || description || '';
    const options = title ? { description } : undefined;

    if (variant === 'destructive') {
      toast.error(message, options);
    } else {
      toast.success(message, options);
    }
  };

  return {
    toast: showToast,
  };
}
