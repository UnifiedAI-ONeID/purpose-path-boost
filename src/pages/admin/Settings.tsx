
import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Users, Globe, Palette, Search, KeyRound, Database, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AdminSEO from '@/components/admin/AdminSEO';
import AdminSecrets from '@/components/admin/AdminSecrets';
import { seedCoachingPackages, seedFAQs, seedLessons, seedChallenges, seedTestimonials, seedAllExtended } from '@/lib/seed-data';
import { trackEvent } from '@/lib/trackEvent';

export default function Settings() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState<string | null>(null);
  const orgConfigRef = doc(db, 'settings', 'organization');

  useEffect(() => {
    trackEvent('admin_settings_view');
    loadOrganization();
  }, []);

  async function loadOrganization() {
    const docSnap = await getDoc(orgConfigRef);
    if (docSnap.exists()) {
      setOrg(docSnap.data());
    }
  }

  async function updateOrganization(updates: any) {
    setLoading(true);
    try {
      await setDoc(orgConfigRef, updates, { merge: true });
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
            <TabsTrigger value="seo">
              <Search className="h-4 w-4 mr-2" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="secrets">
              <KeyRound className="h-4 w-4 mr-2" />
              Secrets
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
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Data
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

          <TabsContent value="seo">
            <AdminSEO />
          </TabsContent>

          <TabsContent value="secrets">
            <AdminSecrets />
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

          <TabsContent value="data" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Seed Initial Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Populate the database with initial coaching packages and FAQs. 
                Existing items with matching slugs/questions will be skipped.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Coaching Packages</p>
                    <p className="text-sm text-muted-foreground">
                      Seed default coaching packages (Discovery, Single, Monthly, Quarterly)
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={seeding !== null}
                    onClick={async () => {
                      setSeeding('packages');
                      try {
                        const result = await seedCoachingPackages();
                        trackEvent('admin_seed_data', { type: 'packages', added: result.added });
                        toast.success(`Added ${result.added} packages, skipped ${result.skipped} existing`);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to seed packages');
                      } finally {
                        setSeeding(null);
                      }
                    }}
                  >
                    {seeding === 'packages' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Seed Packages
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">FAQs</p>
                    <p className="text-sm text-muted-foreground">
                      Seed default FAQ entries for the Help page
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={seeding !== null}
                    onClick={async () => {
                      setSeeding('faqs');
                      try {
                        const result = await seedFAQs();
                        toast.success(`Added ${result.added} FAQs, skipped ${result.skipped} existing`);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to seed FAQs');
                      } finally {
                        setSeeding(null);
                      }
                    }}
                  >
                    {seeding === 'faqs' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Seed FAQs
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Lessons</p>
                    <p className="text-sm text-muted-foreground">
                      Seed learning content and video lessons
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={seeding !== null}
                    onClick={async () => {
                      setSeeding('lessons');
                      try {
                        const result = await seedLessons();
                        toast.success(`Added ${result.added} lessons, skipped ${result.skipped} existing`);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to seed lessons');
                      } finally {
                        setSeeding(null);
                      }
                    }}
                  >
                    {seeding === 'lessons' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Seed Lessons
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Challenges</p>
                    <p className="text-sm text-muted-foreground">
                      Seed community challenges and competitions
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={seeding !== null}
                    onClick={async () => {
                      setSeeding('challenges');
                      try {
                        const result = await seedChallenges();
                        toast.success(`Added ${result.added} challenges, skipped ${result.skipped} existing`);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to seed challenges');
                      } finally {
                        setSeeding(null);
                      }
                    }}
                  >
                    {seeding === 'challenges' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Seed Challenges
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Testimonials</p>
                    <p className="text-sm text-muted-foreground">
                      Seed customer reviews and testimonials
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={seeding !== null}
                    onClick={async () => {
                      setSeeding('testimonials');
                      try {
                        const result = await seedTestimonials();
                        toast.success(`Added ${result.added} testimonials, skipped ${result.skipped} existing`);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to seed testimonials');
                      } finally {
                        setSeeding(null);
                      }
                    }}
                  >
                    {seeding === 'testimonials' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Seed Testimonials
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                  <div>
                    <p className="font-medium">Seed All Data</p>
                    <p className="text-sm text-muted-foreground">
                      Seed all content: packages, FAQs, lessons, challenges, testimonials
                    </p>
                  </div>
                  <Button
                    disabled={seeding !== null}
                    onClick={async () => {
                      setSeeding('all');
                      try {
                        const result = await seedAllExtended();
                        toast.success(
                          `Packages: ${result.packages.added}. FAQs: ${result.faqs.added}. ` +
                          `Lessons: ${result.lessons.added}. Challenges: ${result.challenges.added}. ` +
                          `Testimonials: ${result.testimonials.added}.`
                        );
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to seed data');
                      } finally {
                        setSeeding(null);
                      }
                    }}
                  >
                    {seeding === 'all' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Seed All
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
