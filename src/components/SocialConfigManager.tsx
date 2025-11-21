import { useState, useEffect } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  FileText,
} from 'lucide-react';

interface SocialConfig {
  id: string;
  platform: string;
  enabled: boolean;
  posting_template?: string;
  app_key?: string;
  app_secret?: string;
  access_token?: string;
  refresh_token?: string;
  account_id?: string;
  webhook_url?: string;
  last_test_status?: 'ok' | 'fail' | 'pending' | null;
  last_test_at?: string | null;
  version: number;
  updated_at: string;
}

const PLATFORM_LABELS: Record<string, { name: string; icon: any }> = {
  twitter: { name: 'X (Twitter)', icon: Twitter },
  linkedin: { name: 'LinkedIn', icon: Linkedin },
  facebook: { name: 'Facebook', icon: Facebook },
  instagram: { name: 'Instagram', icon: Instagram },
  youtube_community: { name: 'YouTube Community', icon: Youtube },
  medium: { name: 'Medium', icon: FileText },
};

const MASK = '••••••••';

export const SocialConfigManager = () => {
  const [configs, setConfigs] = useState<SocialConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-social-config');
      
      if (error) throw error;
      
      setConfigs(data);
    } catch (error: any) {
      console.error('Failed to load social configs:', error);
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (platform: string, field: keyof SocialConfig, value: any) => {
    setConfigs(configs.map(config => 
      config.platform === platform ? { ...config, [field]: value } : config
    ));
  };

  const saveConfig = async (config: SocialConfig) => {
    setSaving(config.platform);
    try {
      const payload: any = {
        platform: config.platform,
        enabled: config.enabled,
        posting_template: config.posting_template || '',
      };

      // Only send fields that have been changed (not masked)
      ['app_key', 'app_secret', 'access_token', 'refresh_token', 'account_id', 'webhook_url'].forEach(key => {
        const value = (config as any)[key];
        if (value !== undefined && value !== MASK) {
          payload[key] = value;
        }
      });

      const { data, error } = await supabase.functions.invoke('manage-social-config', {
        body: payload,
      });

      if (error) throw error;

      toast.success(`${PLATFORM_LABELS[config.platform].name} configuration saved`);
      await loadConfigs(); // Reload to get updated version
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async (platform: string) => {
    setTesting(platform);
    try {
      const { data, error } = await supabase.functions.invoke('manage-social-config/test', {
        body: { platform },
      });

      if (error) throw error;

      if (data.ok) {
        toast.success(`${PLATFORM_LABELS[platform].name} connection successful!`);
      } else {
        toast.error(`${PLATFORM_LABELS[platform].name} connection failed`);
      }
      
      await loadConfigs(); // Reload to get updated test status
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const clearSecrets = (platform: string) => {
    setConfigs(configs.map(config => 
      config.platform === platform
        ? {
            ...config,
            app_key: '__CLEAR__',
            app_secret: '__CLEAR__',
            access_token: '__CLEAR__',
            refresh_token: '__CLEAR__',
            account_id: '__CLEAR__',
            webhook_url: '__CLEAR__',
          }
        : config
    ));
    toast.info('Secrets marked for deletion. Click Save to confirm.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold">Social Media Configurations</h2>
        <p className="text-muted-foreground mt-2">
          Securely manage credentials for cross-posting to social platforms. All secrets are encrypted.
        </p>
      </div>

      {configs.map(config => {
        const PlatformIcon = PLATFORM_LABELS[config.platform].icon;
        
        return (
          <Card key={config.platform}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlatformIcon className="h-6 w-6 text-brand" />
                  <div>
                    <CardTitle>{PLATFORM_LABELS[config.platform].name}</CardTitle>
                    <CardDescription>
                      Configure API credentials and posting settings
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => updateField(config.platform, 'enabled', checked)}
                  />
                  <Label className="text-sm font-normal">
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Credentials Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${config.platform}-app-key`}>App Key / Client ID</Label>
                  <Input
                    id={`${config.platform}-app-key`}
                    type="password"
                    value={config.app_key || MASK}
                    onChange={(e) => updateField(config.platform, 'app_key', e.target.value)}
                    placeholder="Enter new value or leave unchanged"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave as {MASK} to keep existing. Type "__CLEAR__" to delete.
                  </p>
                </div>

                <div>
                  <Label htmlFor={`${config.platform}-app-secret`}>App Secret / Client Secret</Label>
                  <Input
                    id={`${config.platform}-app-secret`}
                    type="password"
                    value={config.app_secret || MASK}
                    onChange={(e) => updateField(config.platform, 'app_secret', e.target.value)}
                    placeholder="Enter new value or leave unchanged"
                  />
                </div>

                <div>
                  <Label htmlFor={`${config.platform}-access-token`}>Access Token</Label>
                  <Input
                    id={`${config.platform}-access-token`}
                    type="password"
                    value={config.access_token || MASK}
                    onChange={(e) => updateField(config.platform, 'access_token', e.target.value)}
                    placeholder="Enter new value or leave unchanged"
                  />
                </div>

                <div>
                  <Label htmlFor={`${config.platform}-refresh-token`}>
                    {config.platform === 'twitter' ? 'Access Token Secret' : 'Refresh Token'}
                  </Label>
                  <Input
                    id={`${config.platform}-refresh-token`}
                    type="password"
                    value={config.refresh_token || MASK}
                    onChange={(e) => updateField(config.platform, 'refresh_token', e.target.value)}
                    placeholder="Enter new value or leave unchanged"
                  />
                </div>

                <div>
                  <Label htmlFor={`${config.platform}-account-id`}>
                    Account/Page/Org ID
                  </Label>
                  <Input
                    id={`${config.platform}-account-id`}
                    type="password"
                    value={config.account_id || MASK}
                    onChange={(e) => updateField(config.platform, 'account_id', e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label htmlFor={`${config.platform}-webhook`}>Webhook URL (n8n/Zapier)</Label>
                  <Input
                    id={`${config.platform}-webhook`}
                    type="password"
                    value={config.webhook_url || MASK}
                    onChange={(e) => updateField(config.platform, 'webhook_url', e.target.value)}
                    placeholder="https://your-webhook.com"
                  />
                </div>
              </div>

              {/* Posting Template */}
              <div>
                <Label htmlFor={`${config.platform}-template`}>
                  Custom Posting Template (Optional)
                </Label>
                <Textarea
                  id={`${config.platform}-template`}
                  value={config.posting_template || ''}
                  onChange={(e) => updateField(config.platform, 'posting_template', e.target.value)}
                  placeholder="Override default format. Use {title}, {url}, {excerpt}"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available placeholders: {'{title}'}, {'{url}'}, {'{excerpt}'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => saveConfig(config)}
                  disabled={saving === config.platform}
                >
                  {saving === config.platform ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => testConnection(config.platform)}
                  disabled={testing === config.platform || !config.enabled}
                >
                  {testing === config.platform ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => clearSecrets(config.platform)}
                >
                  Clear All Secrets
                </Button>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  {config.last_test_status === 'ok' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Connection OK</span>
                    </>
                  )}
                  {config.last_test_status === 'fail' && (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">Connection Failed</span>
                    </>
                  )}
                  {config.last_test_status === 'pending' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">Test Pending</span>
                    </>
                  )}
                  {!config.last_test_status && (
                    <span className="text-muted-foreground">Not tested</span>
                  )}
                  {config.last_test_at && (
                    <span className="text-muted-foreground">
                      · {new Date(config.last_test_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Version {config.version} · Updated {new Date(config.updated_at).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Twitter/X:</h4>
            <p className="text-muted-foreground">
              Get credentials from <a href="https://developer.twitter.com" target="_blank" rel="noopener" className="text-brand underline">Twitter Developer Portal</a>. 
              Requires App Key, Secret, Access Token, and Token Secret. Ensure your app has Read & Write permissions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Using Webhooks (Recommended):</h4>
            <p className="text-muted-foreground">
              Set up an n8n or Zapier workflow and provide the webhook URL. This keeps API tokens outside your application and adds retry/queue functionality.
              The webhook will receive the platform name, post text, and credentials to handle posting.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Security:</h4>
            <p className="text-muted-foreground">
              All credentials are encrypted using AES-256-GCM before storage. Secrets are never sent to the client unmasked.
              Audit logs track all configuration changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
