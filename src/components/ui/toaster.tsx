import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const [mounted, setMounted] = useState(false);
  
  // Ensure component only renders after mount to avoid SSR/hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe hook call with error boundary
  let toasts = [];
  try {
    const toastState = useToast();
    toasts = toastState.toasts;
  } catch (error) {
    console.warn('Toaster: Toast context not ready', error);
    return null;
  }

  if (!mounted) {
    return null;
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
