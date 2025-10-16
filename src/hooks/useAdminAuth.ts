import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const [ok, setOk] = useState<boolean | null>(null);
  
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('api-admin-check-role');
      setOk(!error && data?.ok === true);
      if (!data?.ok) {
        location.href = '/auth?returnTo=/admin';
      }
    })();
  }, []);
  
  return ok;
}
