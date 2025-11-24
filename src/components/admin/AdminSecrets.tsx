
import { useEffect, useState, ChangeEvent } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const manageSecrets = httpsCallable(functions, 'manage-secrets');

const FIELDS = [
  { key: 'AIRWALLEX_CLIENT_ID', label: 'Airwallex Client ID' },
  { key: 'AIRWALLEX_API_KEY', label: 'Airwallex API Key' },
  { key: 'VITE_UMAMI_ID', label: 'Umami Website ID' },
  { key: 'POSTHOG_KEY', label: 'PostHog Key' },
  { key: 'LINKEDIN_ACCESS_TOKEN', label: 'LinkedIn Access Token' },
  { key: 'FACEBOOK_PAGE_ID', label: 'Facebook Page ID' },
  { key: 'FACEBOOK_PAGE_ACCESS_TOKEN', label: 'Facebook Page Access Token' },
  { key: 'INSTAGRAM_BUSINESS_ID', label: 'Instagram Business Account ID' },
  { key: 'INSTAGRAM_GRAPH_TOKEN', label: 'Instagram Graph API Token' },
  { key: 'X_BEARER_TOKEN', label: 'X (Twitter) Bearer Token' }
];

interface SecretListResult {
    data: { key: string }[];
}

export default function AdminSecrets() {
  const [exists, setExists] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [vals, setVals] = useState<Record<string, string>>({});

  async function load() {
    try {
      const qs = FIELDS.map(f => f.key).join(',');
      
      const result: HttpsCallableResult<SecretListResult> = await manageSecrets({ keys: qs, action: 'list' });
      const data = result.data;

      const map: Record<string, boolean> = {};
      (data.data || []).forEach((it: { key: string }) => map[it.key] = true);
      setExists(map);
    } catch (error) {
      console.error('Error loading secrets:', error);
      toast.error('Failed to load secrets');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(k: string) {
    if (!vals[k]) {
      toast.error('Please enter a value');
      return;
    }

    setSaving(s => ({ ...s, [k]: true }));
    
    try {
      await manageSecrets({ key: k, value: vals[k], action: 'set' });

      toast.success('Secret saved successfully');
      setVals(v => ({ ...v, [k]: '' }));
      await load();
    } catch (error) {
      console.error('Error saving secret:', error);
      toast.error('Failed to save secret');
    } finally {
      setSaving(s => ({ ...s, [k]: false }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Secrets Manager</CardTitle>
        <CardDescription>
          Keys are encrypted at rest. Existing values are hidden (••••); re-save to rotate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <div key={f.key} className="border rounded-lg p-4 space-y-3">
              <Label htmlFor={f.key} className="text-sm font-medium">
                {f.label}
              </Label>
              <Input
                id={f.key}
                type="password"
                placeholder={exists[f.key] ? '•••••••• (set to rotate)' : 'enter value'}
                value={vals[f.key] || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              />
              <Button
                className="w-full"
                disabled={saving[f.key]}
                onClick={() => save(f.key)}
              >
                {saving[f.key] ? 'Saving…' : (exists[f.key] ? 'Update' : 'Save')}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
