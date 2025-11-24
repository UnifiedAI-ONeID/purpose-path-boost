
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
];

interface SecretStatus {
  [key: string]: boolean;
}

export default function AdminSecrets() {
  const [secrets, setSecrets] = useState<{ [key: string]: string }>({});
  const [statuses, setStatuses] = useState<SecretStatus>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const getStatuses = async () => {
      setLoading(true);
      try {
        const result: HttpsCallableResult<any> = await manageSecrets({ action: 'status' });
        if (result.data.success) {
          setStatuses(result.data.statuses);
        } else {
          toast.error(result.data.error || 'Failed to get secret statuses.');
        }
      } catch (error: any) {
        console.error("Error fetching secret statuses:", error);
        toast.error('An error occurred while fetching secret statuses.');
      }
      setLoading(false);
    };
    getStatuses();
  }, []);

  const handleSecretChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSecrets({
      ...secrets,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (key: string) => {
    const value = secrets[key];
    if (!value) {
      toast.warning('Please enter a value for the secret.');
      return;
    }

    setSaving(key);
    try {
      const result: HttpsCallableResult<any> = await manageSecrets({ action: 'set', key, value });
      if (result.data.success) {
        toast.success(`Secret "${labelFromKey(key)}" saved successfully.`);
        setSecrets(s => ({ ...s, [key]: '' })); // Clear input after save
        setStatuses(s => ({ ...s, [key]: true }));
      } else {
        toast.error(result.data.error || `Failed to save secret "${labelFromKey(key)}".`);
      }
    } catch (error: any) {
      console.error(`Error saving secret ${key}:`, error);
      toast.error(`An error occurred while saving the secret: ${error.message}`);
    }
    setSaving(null);
  };

  const labelFromKey = (key: string) => FIELDS.find(f => f.key === key)?.label || key;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Application Secrets</CardTitle>
        <CardDescription>
          Update secret keys for third-party integrations. For security, secrets are write-only and cannot be read back.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? <p>Loading secret statuses...</p> : FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id={key}
                name={key}
                type="password"
                value={secrets[key] || ''}
                onChange={handleSecretChange}
                placeholder={statuses[key] ? 'Value is set. Enter new value to overwrite.' : 'Enter secret value'}
                disabled={saving !== null}
              />
              <Button onClick={() => handleSave(key)} disabled={saving !== null}>
                {saving === key ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {statuses[key] && <p className="text-sm text-green-500 mt-1">This secret is currently set and active.</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
