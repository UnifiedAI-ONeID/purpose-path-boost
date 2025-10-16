import { useEffect, useState } from 'react';

export function useAdminAuth() {
  const [ok, setOk] = useState<boolean | null>(null);
  
  useEffect(() => {
    (async () => {
      // Call a tiny endpoint that checks admin session/JWT
      const r = await fetch('/api/admin/self').then(r => r.json()).catch(() => ({ ok: false }));
      setOk(!!r.ok);
      if (!r.ok) {
        location.href = '/auth?returnTo=/admin';
      }
    })();
  }, []);
  
  return ok;
}
