import { useEffect, useState, useCallback } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

// Firebase callable functions
const listPlansFn = httpsCallable<void, { rows: Tier[] }>(functions, 'admin-plans-list');
const upsertPlanFn = httpsCallable<Tier, void>(functions, 'admin-plans-upsert');
const deletePlanFn = httpsCallable<{ slug: string }, void>(functions, 'admin-plans-delete');
const listPackagesFn = httpsCallable<void, { rows: Package[] }>(functions, 'admin-packages-list');
const upsertPackageFn = httpsCallable<Partial<Package>, void>(functions, 'admin-packages-upsert');
const setPackageLessonsFn = httpsCallable<{ package_id?: string; lessons: { slug: string; order_index: number }[] }, void>(functions, 'admin-package-lessons-set');
const setPlanIncludesFn = httpsCallable<{ plan_slug: string; package_ids: string[] }, void>(functions, 'admin-plan-includes-set');
const listFunnelsFn = httpsCallable<void, { rows: Funnel[] }>(functions, 'admin-funnels-list');
const upsertFunnelFn = httpsCallable<Partial<Funnel>, void>(functions, 'admin-funnels-upsert');
const setFunnelTriggersFn = httpsCallable<{ lesson_slug: string; funnel_slugs: string[] }, void>(functions, 'admin-funnel-triggers-set');

// Type definitions
interface Tier {
  slug: string;
  title: string;
  monthly_usd_cents: number;
  annual_usd_cents: number;
  features: Record<string, unknown>;
  price_id_month?: string | null;
  price_id_year?: string | null;
  blurb?: string;
  faq?: { q: string; a: string }[];
  active: boolean;
}

interface Package {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  poster_url?: string;
  active: boolean;
  lesson_count?: number;
}

interface Funnel {
  id: string;
  slug: string;
  name: string;
  target_plan_slug: string;
  config: Record<string, unknown>;
}

const initialTierFormState: Tier = {
  slug: '',
  title: '',
  monthly_usd_cents: 2900,
  annual_usd_cents: 27840,
  features: { videos_per_month: 10, all_access: false },
  price_id_month: '',
  price_id_year: '',
  blurb: '',
  faq: [],
  active: true
};

const initialPackageFormState: Partial<Package> = {
  slug: '',
  title: '',
  summary: '',
  poster_url: '',
  active: true
};

const initialFunnelFormState: Funnel = {
    id: '',
    slug: '',
    name: '',
    target_plan_slug: 'growth',
    config: { copy: { headline: 'Unlock all lessons', sub: 'Join Growth' }, cta: '/pricing?highlight=growth' }
};

export default function PricingAdmin() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Funnel Management</CardTitle>
        <CardDescription>Manage subscription tiers, lesson packages, and upsell funnels</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tiers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="funnels">Funnels</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
          </TabsList>

          <TabsContent value="tiers"><TiersTab /></TabsContent>
          <TabsContent value="packages"><PackagesTab /></TabsContent>
          <TabsContent value="funnels"><FunnelsTab /></TabsContent>
          <TabsContent value="mapping"><MappingTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TiersTab() {
  const [rows, setRows] = useState<Tier[]>([]);
  const [form, setForm] = useState(initialTierFormState);
  const [featuresJson, setFeaturesJson] = useState(JSON.stringify(initialTierFormState.features, null, 2));
  const [faqJson, setFaqJson] = useState(JSON.stringify(initialTierFormState.faq, null, 2));

  const load = useCallback(async () => {
    try {
        const result = await listPlansFn();
        setRows(result.data.rows || []);
    } catch { toast.error('Failed to load tiers.') }
  }, []);

  useEffect(() => { load(); }, [load]);
  
  useEffect(() => {
    setFeaturesJson(JSON.stringify(form.features || {}, null, 2));
    setFaqJson(JSON.stringify(form.faq || [], null, 2));
  }, [form]);

  async function save() {
    try {
      const features = JSON.parse(featuresJson);
      const faq = JSON.parse(faqJson);
      const payload = { ...form, features, faq, monthly_usd_cents: Number(form.monthly_usd_cents), annual_usd_cents: Number(form.annual_usd_cents) };
      await upsertPlanFn(payload);
      toast.success('Plan saved successfully');
      load();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save plan. Check JSON validity.');
    }
  }

  async function deletePlan(slug: string) {
    if (!confirm(`Delete plan "${slug}"?`)) return;
    try {
        await deletePlanFn({ slug });
        toast.success('Plan deleted');
        load();
    } catch(err) { toast.error(err instanceof Error ? err.message : 'Failed to delete plan.'); }
  }

  function resetForm() {
    setForm(initialTierFormState);
  }
  
  function edit(tier: Tier) {
      setForm(tier);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 className="font-semibold mb-4">Create / Edit Tier</h3>
        <div className="space-y-4">
          <Label>Slug</Label>
          <Input placeholder="starter, growth, pro" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

          <Label>Title</Label>
          <Input placeholder="Starter Plan" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly (cents)</Label>
              <Input type="number" placeholder="2900" value={form.monthly_usd_cents} onChange={(e) => setForm({ ...form, monthly_usd_cents: +e.target.value })} />
            </div>
            <div>
              <Label>Annual (cents)</Label>
              <Input type="number" placeholder="27840" value={form.annual_usd_cents} onChange={(e) => setForm({ ...form, annual_usd_cents: +e.target.value })} />
            </div>
          </div>

          <Label>Features (JSON)</Label>
          <Textarea rows={3} placeholder='{}' value={featuresJson} onChange={(e) => setFeaturesJson(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Airwallex Price ID (Monthly)</Label>
              <Input placeholder="price_xxx" value={form.price_id_month || ''} onChange={(e) => setForm({ ...form, price_id_month: e.target.value })} />
            </div>
            <div>
              <Label>Airwallex Price ID (Annual)</Label>
              <Input placeholder="price_yyy" value={form.price_id_year || ''} onChange={(e) => setForm({ ...form, price_id_year: e.target.value })} />
            </div>
          </div>

          <Label>Blurb</Label>
          <Textarea rows={2} placeholder="Perfect for getting started" value={form.blurb || ''} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />

          <Label>FAQ (JSON Array)</Label>
          <Textarea rows={2} placeholder='[]' value={faqJson} onChange={(e) => setFaqJson(e.target.value)} />

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="active" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save}><Save className="w-4 h-4 mr-2" />Save Tier</Button>
            <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" />Reset</Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Existing Tiers</h3>
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.slug}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.slug} · ${(r.monthly_usd_cents / 100).toFixed(0)}/mo · ${(r.annual_usd_cents / 100).toFixed(0)}/yr
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => edit(r)}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePlan(r.slug)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PackagesTab() {
  const [rows, setRows] = useState<Package[]>([]);
  const [form, setForm] = useState<Partial<Package>>(initialPackageFormState);
  const [lessonQuery, setLessonQuery] = useState('');
  const [selected, setSelected] = useState<{ slug: string, order_index: number }[]>([]);

  const load = useCallback(async () => {
    try {
      const result = await listPackagesFn();
      setRows(result.data.rows || []);
    } catch { toast.error('Failed to load packages')}
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    try {
      await upsertPackageFn(form);
      toast.success('Package saved');
      load();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save package');
    }
  }

  async function setLessons(pkg: Package) {
    try {
      await setPackageLessonsFn({ package_id: pkg.id, lessons: selected });
      toast.success('Lessons updated');
      load();
    } catch(err) { toast.error(err instanceof Error ? err.message : 'Failed to update lessons'); }
  }

  function resetForm() {
    setForm(initialPackageFormState);
    setSelected([]);
    setLessonQuery('');
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 className="font-semibold mb-4">Create / Edit Package</h3>
        <div className="space-y-4">
          <Label>Slug</Label>
          <Input placeholder="mindfulness-basics" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

          <Label>Title</Label>
          <Input placeholder="Mindfulness Basics" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <Label>Summary</Label>
          <Textarea rows={2} placeholder="Learn the fundamentals..." value={form.summary || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} />

          <Label>Poster URL</Label>
          <Input placeholder="https://..." value={form.poster_url || ''} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} />

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="pkg-active" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <Label htmlFor="pkg-active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save}><Save className="w-4 h-4 mr-2" />Save Package</Button>
            <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" />Reset</Button>
          </div>

          <div className="border-t pt-4 mt-6">
            <h4 className="font-semibold mb-2">Attach Lessons (Quick Add)</h4>
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="Enter lesson slugs (comma-separated)" value={lessonQuery} onChange={(e) => setLessonQuery(e.target.value)} />
              <Button onClick={() => {
                  const slugs = lessonQuery.split(',').map(s => s.trim()).filter(Boolean);
                  setSelected(slugs.map((slug, i) => ({ slug, order_index: i })));
                }}>Parse</Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Selected: {selected.map(s => s.slug).join(', ') || '—'}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Packages</h3>
        <div className="space-y-2">
          {rows.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.slug} · {p.lesson_count} lessons</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLessons(p)}>Save Lessons</Button>
                    <Button size="sm" variant="ghost" onClick={() => setForm(p)}><Edit2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                {p.summary && <div className="text-xs text-muted-foreground">{p.summary}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MappingTab() {
  const [plans, setPlans] = useState<Tier[]>([]);
  const [pkgs, setPkgs] = useState<Package[]>([]);
  const [plan, setPlan] = useState<string>('');
  const [sel, setSel] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const p = await listPlansFn();
    setPlans(p.data.rows || []);
    const k = await listPackagesFn();
    setPkgs(k.data.rows || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const ids = pkgs.filter(x => sel[x.id]).map(x => x.id);
    try {
      await setPlanIncludesFn({ plan_slug: plan, package_ids: ids });
      toast.success('Mapping saved!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save mapping'); }
  }

  return (
    <div className="mt-4 space-y-4">
      <h3 className="font-semibold">Plan ↔ Package Mapping</h3>
      <div className="flex gap-2">
        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex-1" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="">Select a plan</option>
          {plans.map((p) => (<option key={p.slug} value={p.slug}>{p.title} ({p.slug})</option>))}
        </select>
        <Button disabled={!plan} onClick={save}><Save className="w-4 h-4 mr-2" />Save Mapping</Button>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        {pkgs.map((p) => (
          <label key={p.id} className={`border rounded-md p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/50 ${sel[p.id] ? 'bg-primary/10 border-primary' : ''}`}>
            <input type="checkbox" checked={!!sel[p.id]} onChange={(e) => setSel({ ...sel, [p.id]: e.target.checked })} className="rounded" />
            <div>
              <div className="font-medium text-sm">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.lesson_count} lessons</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function FunnelsTab() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [form, setForm] = useState<Partial<Funnel>>(initialFunnelFormState);
  const [configJson, setConfigJson] = useState(JSON.stringify(initialFunnelFormState.config, null, 2));
  const [attach, setAttach] = useState({ lesson_slug: '', funnel_slugs: '' });

  const load = useCallback(async () => {
    try {
      const result = await listFunnelsFn();
      setFunnels(result.data.rows || []);
    } catch { toast.error('Failed to load funnels'); }
  }, []);

  useEffect(() => { load(); }, [load]);
  
  useEffect(() => {
      setConfigJson(JSON.stringify(form.config || {}, null, 2));
  }, [form]);

  async function save() {
    try {
      const config = JSON.parse(configJson);
      await upsertFunnelFn({ ...form, config });
      toast.success('Funnel saved');
      load();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save funnel. Check JSON validity.');
    }
  }

  async function link() {
      const arr = attach.funnel_slugs.split(',').map(x => x.trim()).filter(Boolean);
      try {
        await setFunnelTriggersFn({ lesson_slug: attach.lesson_slug, funnel_slugs: arr });
        toast.success('Funnel triggers linked!');
        setAttach({ lesson_slug: '', funnel_slugs: '' });
      } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to link triggers'); }
  }

  function resetForm() {
    setForm(initialFunnelFormState);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 className="font-semibold mb-4">Create / Edit Funnel</h3>
        <div className="space-y-4">
          <Label>Slug</Label>
          <Input placeholder="growth-upsell" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

          <Label>Name</Label>
          <Input placeholder="Growth Upsell" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <Label>Target Plan Slug</Label>
          <Input placeholder="growth" value={form.target_plan_slug || ''} onChange={(e) => setForm({ ...form, target_plan_slug: e.target.value })} />

          <Label>Config (JSON)</Label>
          <Textarea rows={4} placeholder='{}' value={configJson} onChange={(e) => setConfigJson(e.target.value)} />

          <div className="flex gap-2">
            <Button onClick={save}><Save className="w-4 h-4 mr-2" />Save Funnel</Button>
            <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" />Reset</Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Attach Funnel to Lesson</h3>
        <div className="space-y-4 mb-6">
          <Label>Lesson Slug</Label>
          <Input placeholder="intro-to-mindfulness" value={attach.lesson_slug} onChange={(e) => setAttach({ ...attach, lesson_slug: e.target.value })} />

          <Label>Funnel Slugs (comma-separated)</Label>
          <Input placeholder="growth-upsell, pro-upsell" value={attach.funnel_slugs} onChange={(e) => setAttach({ ...attach, funnel_slugs: e.target.value })} />

          <Button onClick={link}><Plus className="w-4 h-4 mr-2" />Link Funnels</Button>
        </div>

        <h3 className="font-semibold mb-2">Existing Funnels</h3>
        <div className="space-y-2">
          {funnels.map((f) => (
            <Card key={f.slug}>
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.slug} → {f.target_plan_slug}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setForm(f)}><Edit2 className="w-3 h-3" /></Button>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
