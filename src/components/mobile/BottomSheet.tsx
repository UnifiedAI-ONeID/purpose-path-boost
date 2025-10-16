import { useEffect } from 'react';

export default function BottomSheet({ open, onClose, children, title }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Sheet */}
      <div className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-card shadow-2xl border-t border-border max-h-[85svh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto my-3" />
        
        {title && (
          <div className="px-4 pb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}
        
        <div className="px-4 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}