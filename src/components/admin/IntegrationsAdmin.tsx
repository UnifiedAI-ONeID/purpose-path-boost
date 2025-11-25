import { useEffect, useState, useCallback } from 'react';
import { invokeApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CalSettings {
  handle: string;
  eventType: string;
  theme: string;
}

interface YoutubeSettings {
  privacy_mode: boolean;
  captions: boolean;
  default_lang: string;
}

interface CnSettings {
  base_url: string;
}

interface Secret {
    key: string;
    updated_at: string;
}

interface SettingsState {
    settings?: { key: string; value: unknown }[];
    secrets?: Secret[];
}

interface ApiResponse<T> {
  data: T | null;
  error?: string;
}

export default function IntegrationsAdmin() {
  const [state, setState] = useState<SettingsState | null>(null);
  const [cal, setCal] = useState<CalSettings>({ handle: '', eventType: '', theme: 'auto' });
  const [yt, setYt] = useState<YoutubeSettings>({ privacy_mode: true, captions: true, default_lang: 'en' });
  const [cn, setCn] = useState<CnSettings>({ base_url: '' });
  const [secret, setSecret] = useState({ key: '', value: '' });

  const load = useCallback(async () => {
    const { data } = await invokeApi<SettingsState>('/api/admin/integrations/get');
    if (data) {
      setState(data);
      const map: Record<string, unknown> = {};
      (data.settings || []).forEach((r) => {
        map[r.key] = r.value;
      });
      if (map.calcom) setCal(map.calcom as CalSettings);
      if (map.youtube) setYt(map.youtube as YoutubeSettings);
      if (map.cn_video) setCn(map.cn_video as CnSettings);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, value: unknown) => {
    await invokeApi('/api/admin/integrations/set', {
      method: 'POST',
      body: { key, value }
    });
    toast.success('Settings saved');
    load();
  };

  const saveSecret = async () => {
    await invokeApi('/api/admin/integrations/secret/set', {
      method: 'POST',
      body: secret
    });
    toast.success('Secret saved');
    setSecret({ key: '', value: '' });
    load();
  };

  if (!state) return <Card className="p-6">Loading…</Card>;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Integrations</h2>

      {/* Cal.com */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-3">Cal.com Settings</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Handle</Label>
            <Input
              placeholder="zhengrowth"
              value={cal.handle}
              onChange={e => setCal({ ...cal, handle: e.target.value })}
            />
          </div>
          <div>
            <Label>Event Type</Label>
            <Input
              placeholder="clarity-call"
              value={cal.eventType}
              onChange={e => setCal({ ...cal, eventType: e.target.value })}
            />
          </div>
          <div>
            <Label>Theme</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={cal.theme}
              onChange={e => setCal({ ...cal, theme: e.target.value })}
            >
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <Button className="mt-3" onClick={() => save('calcom', cal)}>
          Save Cal.com Settings
        </Button>
      </div>

      {/* YouTube */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-3">YouTube Settings</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={yt.privacy_mode}
              onChange={e => setYt({ ...yt, privacy_mode: e.target.checked })}
            />
            Privacy Mode (youtube-nocookie)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={yt.captions}
              onChange={e => setYt({ ...yt, captions: e.target.checked })}
            />
            Force Captions
          </label>
          <div>
            <Label>Default Language</Label>
            <Input
              placeholder="en"
              value={yt.default_lang}
              onChange={e => setYt({ ...yt, default_lang: e.target.value })}
            />
          </div>
        </div>
        <Button className="mt-3" onClick={() => save('youtube', yt)}>
          Save YouTube Settings
        </Button>
      </div>

      {/* China Video */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-3">China Video Fallback</h3>
        <div>
          <Label>Base URL</Label>
          <Input
            placeholder="https://cdn-cn.example.com/lessons"
            value={cn.base_url}
            onChange={e => setCn({ ...cn, base_url: e.target.value })}
          />
        </div>
        <Button className="mt-3" onClick={() => save('cn_video', cn)}>
          Save China Video Settings
        </Button>
      </div>

      {/* Secrets */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Encrypted Secrets</h3>
        <p className="text-sm text-muted-foreground mb-3">
          These values are encrypted with AES-GCM and accessible only by Edge Functions.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Secret Key</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={secret.key}
              onChange={e => setSecret({ ...secret, key: e.target.value })}
            >
              <option value="">Select secret</option>
              <option value="CALCOM_API_KEY">CALCOM_API_KEY</option>
              <option value="AIRWALLEX_CLIENT_ID">AIRWALLEX_CLIENT_ID</option>
              <option value="AIRWALLEX_API_KEY">AIRWALLEX_API_KEY</option>
              <option value="AIRWALLEX_WEBHOOK_SECRET">AIRWALLEX_WEBHOOK_SECRET</option>
              <option value="YOUTUBE_API_KEY">YOUTUBE_API_KEY</option>
            </select>
          </div>
          <div>
            <Label>Value</Label>
            <Input
              type="password"
              placeholder="Enter secret value"
              value={secret.value}
              onChange={e => setSecret({ ...secret, value: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="mt-3"
          onClick={saveSecret}
          disabled={!secret.key || !secret.value}
        >
          Save Secret
        </Button>

        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">Stored Secrets:</h4>
          <ul className="text-xs space-y-1">
            {(state.secrets || []).map((s) => (
              <li key={s.key} className="text-muted-foreground">
                {s.key} · updated {new Date(s.updated_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
