import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Nudge {
  id: string;
  kind: 'toast' | 'banner' | 'modal';
  title: string;
  body: string;
  cta_label?: string;
  cta_href?: string;
}

export default function Nudges({ profileId }: { profileId: string }) {
  const [rows, setRows] = useState<Nudge[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/nudge/pull?profile_id=${profileId}`, {
          cache: 'no-store',
        });
        const json = await response.json();
        setRows(json.rows || []);
      } catch (error) {
        console.error('Failed to fetch nudges:', error);
      }
    })();
  }, [profileId]);

  if (!rows.length) return null;

  return (
    <>
      {rows.map((n) =>
        n.kind === 'toast' ? (
          <Toast key={n.id} n={n} onDismiss={() => dismiss(n.id, setRows)} />
        ) : n.kind === 'banner' ? (
          <Banner key={n.id} n={n} onDismiss={() => dismiss(n.id, setRows)} />
        ) : n.kind === 'modal' ? (
          <Modal key={n.id} n={n} onDismiss={() => dismiss(n.id, setRows)} />
        ) : null
      )}
    </>
  );
}

function Toast({ n, onDismiss }: { n: Nudge; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg px-4 py-3 flex gap-3 items-center max-w-md">
        <div className="flex-1">
          <div className="font-medium text-card-foreground">{n.title}</div>
          <div className="text-sm text-muted-foreground">{n.body}</div>
        </div>
        {n.cta_href && (
          <a className="btn btn-sm" href={n.cta_href}>
            {n.cta_label || 'Learn more'}
          </a>
        )}
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={onDismiss}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Banner({ n, onDismiss }: { n: Nudge; onDismiss: () => void }) {
  return (
    <div className="sticky top-0 z-[9998] bg-primary/10 border-b border-border px-4 py-2 text-sm">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div>
          <span className="font-medium">{n.title}</span> {n.body}
        </div>
        <div className="flex items-center gap-2">
          {n.cta_href && (
            <a className="btn btn-sm" href={n.cta_href}>
              {n.cta_label || 'Go'}
            </a>
          )}
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={onDismiss}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ n, onDismiss }: { n: Nudge; onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[10000] grid place-items-center p-4 animate-in fade-in"
      onClick={onDismiss}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-semibold text-card-foreground">{n.title}</div>
        <p className="text-sm text-muted-foreground mt-2">{n.body}</p>
        <div className="mt-4 flex gap-2">
          {n.cta_href && (
            <a className="btn flex-1" href={n.cta_href}>
              {n.cta_label || 'Continue'}
            </a>
          )}
          <button className="btn btn-ghost" onClick={onDismiss}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

async function dismiss(id: string, setRows: React.Dispatch<React.SetStateAction<Nudge[]>>) {
  try {
    await fetch('/api/nudge/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setRows((prev) => prev.filter((n) => n.id !== id));
  } catch (error) {
    console.error('Failed to dismiss nudge:', error);
  }
}
