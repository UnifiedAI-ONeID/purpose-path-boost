import { useState, useEffect } from 'react';
import { supabase } from '@/db';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Users, Globe, Palette } from 'lucide-react';

export default function Settings() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    const { data } = await supabase
      .from('organizations' as any)
      .select('*')
      .single();
    
    if (data) setOrg(data);
  }

  async function updateOrganization(updates: any) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations' as any)
        .update(updates)
        .eq('id', org.id);

      if (error) throw error;
      toast.success('Settings updated');
      loadOrganization();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="brand">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team & Roles
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
              <div className="space-y-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input 
                    defaultValue={org?.name} 
                    onBlur={(e) => updateOrganization({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input 
                    defaultValue={org?.slug} 
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug cannot be changed
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="brand" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Brand Settings</h3>
              <p className="text-muted-foreground">
                Customize your brand colors, logo, and theme settings
              </p>
              <Button className="mt-4">Upload Logo</Button>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Team Members & Roles</h3>
              <p className="text-muted-foreground mb-4">
                Manage user roles and permissions
              </p>
              <Button>Invite Team Member</Button>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Security & Compliance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Audit Logs</p>
                    <p className="text-sm text-muted-foreground">View security audit trail</p>
                  </div>
                  <Button variant="outline">View Logs</Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
