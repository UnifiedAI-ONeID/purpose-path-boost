import React, { useEffect, useState } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { usePrefs } from "@/prefs/PrefsProvider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const [mounted, setMounted] = useState(false);
  
  // Ensure component only renders after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe hook call with error boundary
  let theme = 'light';
  try {
    const prefs = usePrefs();
    theme = prefs.theme;
  } catch (error) {
    console.warn('Sonner: PrefsProvider context not ready', error);
  }

  if (!mounted) {
    return null;
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
