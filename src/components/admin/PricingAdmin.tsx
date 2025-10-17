import { useEffect, useState } from 'react';
import { invokeApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

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

          <TabsContent value="tiers">
            <TiersTab />
          </TabsContent>

          <TabsContent value="packages">
            <PackagesTab />
          </TabsContent>

          <TabsContent value="funnels">
            <FunnelsTab />
          </TabsContent>

          <TabsContent value="mapping">
            <MappingTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TiersTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    slug: '',
    title: '',
    monthly_usd_cents: 2900,
    annual_usd_cents: 27840,
    features: '{"videos_per_month":10,"all_access":false}',
    price_id_month: '',
    price_id_year: '',
    blurb: '',
    faq: '[]',
    active: true
  });

  async function load() {
    const result = await invokeApi('/api/admin/plans/list');
    if (result.ok) {
      setRows(result.rows || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      const result = await invokeApi('/api/admin/plans/upsert', {
        method: 'POST',
        body: {
          slug: form.slug,
          title: form.title,
          monthly_usd_cents: Number(form.monthly_usd_cents),
          annual_usd_cents: Number(form.annual_usd_cents),
          features: JSON.parse(form.features || '{}'),
          active: !!form.active,
          price_id_month: form.price_id_month || null,
          price_id_year: form.price_id_year || null,
          blurb: form.blurb || '',
          faq: JSON.parse(form.faq || '[]')
        }
      });

      if (result.ok) {
        toast.success('Plan saved successfully');
        load();
        resetForm();
      } else {
        toast.error(result.error || 'Failed to save plan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save plan');
    }
  }

  async function deletePlan(slug: string) {
    if (!confirm(`Delete plan "${slug}"?`)) return;
    
    const result = await invokeApi('/api/admin/plans/delete', {
      method: 'POST',
      body: { slug }
    });

    if (result.ok) {
      toast.success('Plan deleted');
      load();
    } else {
      toast.error(result.error || 'Failed to delete plan');
    }
  }

  function resetForm() {
    setForm({
      slug: '',
      title: '',
      monthly_usd_cents: 0,
      annual_usd_cents: 0,
      features: '{}',
      price_id_month: '',
      price_id_year: '',
      blurb: '',
      faq: '[]',
      active: true
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 className="font-semibold mb-4">Create / Edit Tier</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="starter, growth, pro"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Starter Plan"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly">Monthly (cents)</Label>
              <Input
                id="monthly"
                type="number"
                placeholder="2900"
                value={form.monthly_usd_cents}
                onChange={(e) => setForm({ ...form, monthly_usd_cents: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="annual">Annual (cents)</Label>
              <Input
                id="annual"
                type="number"
                placeholder="27840"
                value={form.annual_usd_cents}
                onChange={(e) => setForm({ ...form, annual_usd_cents: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="features">Features (JSON)</Label>
            <Textarea
              id="features"
              rows={3}
              placeholder='{"videos_per_month":10,"all_access":false}'
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_month">Airwallex Price ID (Monthly)</Label>
              <Input
                id="price_month"
                placeholder="price_xxx"
                value={form.price_id_month}
                onChange={(e) => setForm({ ...form, price_id_month: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price_year">Airwallex Price ID (Annual)</Label>
              <Input
                id="price_year"
                placeholder="price_yyy"
                value={form.price_id_year}
                onChange={(e) => setForm({ ...form, price_id_year: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="blurb">Blurb</Label>
            <Textarea
              id="blurb"
              rows={2}
              placeholder="Perfect for getting started"
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="faq">FAQ (JSON Array)</Label>
            <Textarea
              id="faq"
              rows={2}
              placeholder='[{"q":"Question?","a":"Answer"}]'
              value={form.faq}
              onChange={(e) => setForm({ ...form, faq: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={!!form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-2" />
              Save Tier
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Existing Tiers</h3>
        <div className="space-y-2">
          {rows.map((r: any) => (
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setForm({
                        slug: r.slug,
                        title: r.title,
                        monthly_usd_cents: r.monthly_usd_cents,
                        annual_usd_cents: r.annual_usd_cents,
                        features: JSON.stringify(r.features || {}),
                        price_id_month: r.price_id_month || '',
                        price_id_year: r.price_id_year || '',
                        blurb: r.blurb || '',
                        faq: JSON.stringify(r.faq || []),
                        active: r.active
                      })}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePlan(r.slug)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    id: '',
    slug: '',
    title: '',
    summary: '',
    poster_url: '',
    active: true
  });
  const [lessonQuery, setLessonQuery] = useState('');
  const [selected, setSelected] = useState<any[]>([]);

  async function load() {
    const result = await invokeApi('/api/admin/packages/list');
    if (result.ok) {
      setRows(result.rows || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      const result = await invokeApi('/api/admin/packages/upsert', {
        method: 'POST',
        body: form.id ? form : {
          slug: form.slug,
          title: form.title,
          summary: form.summary,
          poster_url: form.poster_url,
          active: form.active
        }
      });

      if (result.ok) {
        toast.success('Package saved');
        load();
        resetForm();
      } else {
        toast.error(result.error || 'Failed to save package');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save package');
    }
  }

  async function setLessons(pkg: any) {
    const result = await invokeApi('/api/admin/package-lessons/set', {
      method: 'POST',
      body: {
        package_id: pkg.id,
        lessons: selected
      }
    });

    if (result.ok) {
      toast.success('Lessons updated');
      load();
    } else {
      toast.error(result.error || 'Failed to update lessons');
    }
  }

  function resetForm() {
    setForm({
      id: '',
      slug: '',
      title: '',
      summary: '',
      poster_url: '',
      active: true
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 className="font-semibold mb-4">Create / Edit Package</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pkg-slug">Slug</Label>
            <Input
              id="pkg-slug"
              placeholder="mindfulness-basics"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="pkg-title">Title</Label>
            <Input
              id="pkg-title"
              placeholder="Mindfulness Basics"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="pkg-summary">Summary</Label>
            <Textarea
              id="pkg-summary"
              rows={2}
              placeholder="Learn the fundamentals..."
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="pkg-poster">Poster URL</Label>
            <Input
              id="pkg-poster"
              placeholder="https://..."
              value={form.poster_url}
              onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pkg-active"
              checked={!!form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="pkg-active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-2" />
              Save Package
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="border-t pt-4 mt-6">
            <h4 className="font-semibold mb-2">Attach Lessons (Quick Add)</h4>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Enter lesson slugs (comma-separated)"
                value={lessonQuery}
                onChange={(e) => setLessonQuery(e.target.value)}
              />
              <Button
                onClick={() => {
                  const slugs = lessonQuery.split(',').map(s => s.trim()).filter(Boolean);
                  setSelected(slugs.map((slug, i) => ({ slug, order_index: i })));
                }}
              >
                Parse
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Selected: {selected.map(s => s.slug).join(', ') || '—'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Packages</h3>
        <div className="space-y-2">
          {rows.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.slug} · {p.lesson_count} lessons
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLessons(p)}
                    >
                      Save Lessons
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setForm(p)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {p.summary && (
                  <div className="text-xs text-muted-foreground">{p.summary}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MappingTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [pkgs, setPkgs] = useState<any[]>([]);
  const [plan, setPlan] = useState<string>('');
  const [sel, setSel] = useState<Record<string, boolean>>({});

  async function load() {
    const p = await invokeApi('/api/admin/plans/list');
    if (p.ok) setPlans(p.rows || []);

    const k = await invokeApi('/api/admin/packages/list');
    if (k.ok) setPkgs(k.rows || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const ids = pkgs.filter(x => sel[x.id]).map(x => x.id);
    const result = await invokeApi('/api/admin/plan-includes/set', {
      method: 'POST',
      body: { plan_slug: plan, package_ids: ids }
    });

    if (result.ok) {
      toast.success('Mapping saved!');
    } else {
      toast.error(result.error || 'Failed to save mapping');
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <h3 className="font-semibold">Plan ↔ Package Mapping</h3>
      
      <div className="flex gap-2">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex-1"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        >
          <option value="">Select a plan</option>
          {plans.map((p: any) => (
            <option key={p.slug} value={p.slug}>
              {p.title} ({p.slug})
            </option>
          ))}
        </select>
        <Button disabled={!plan} onClick={save}>
          <Save className="w-4 h-4 mr-2" />
          Save Mapping
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        {pkgs.map((p: any) => (
          <label
            key={p.id}
            className={`border rounded-md p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/50 ${
              sel[p.id] ? 'bg-primary/10 border-primary' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={!!sel[p.id]}
              onChange={(e) => setSel({ ...sel, [p.id]: e.target.checked })}
              className="rounded"
            />
            <div>
              <div className="font-medium text-sm">{p.title}</div>
              <div className="text-xs text-muted-foreground">
                {p.lesson_count} lessons
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function FunnelsTab() {
  const [funnels, setFunnels] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    id: '',
    slug: '',
    name: '',
    target_plan_slug: 'growth',
    config: '{"copy":{"headline":"Unlock all lessons","sub":"Join Growth"},"cta":"/pricing?highlight=growth"}'
  });
  const [attach, setAttach] = useState({ lesson_slug: '', funnel_slugs: '' });

  async function load() {
    const result = await invokeApi('/api/admin/funnels/list');
    if (result.ok) {
      setFunnels(result.rows || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      const result = await invokeApi('/api/admin/funnels/upsert', {
        method: 'POST',
        body: {
          ...form,
          config: JSON.parse(form.config || '{}')
        }
      });

      if (result.ok) {
        toast.success('Funnel saved');
        load();
        resetForm();
      } else {
        toast.error(result.error || 'Failed to save funnel');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save funnel');
    }
  }

  async function link() {
    const arr = attach.funnel_slugs.split(',').map(x => x.trim()).filter(Boolean);
    const result = await invokeApi('/api/admin/funnel-triggers/set', {
      method: 'POST',
      body: { lesson_slug: attach.lesson_slug, funnel_slugs: arr }
    });

    if (result.ok) {
      toast.success('Funnel triggers linked!');
      setAttach({ lesson_slug: '', funnel_slugs: '' });
    } else {
      toast.error(result.error || 'Failed to link triggers');
    }
  }

  function resetForm() {
    setForm({
      id: '',
      slug: '',
      name: '',
      target_plan_slug: 'growth',
      config: '{"copy":{"headline":"Unlock all lessons","sub":"Join Growth"},"cta":"/pricing?highlight=growth"}'
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 className="font-semibold mb-4">Create / Edit Funnel</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="f-slug">Slug</Label>
            <Input
              id="f-slug"
              placeholder="growth-upsell"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="f-name">Name</Label>
            <Input
              id="f-name"
              placeholder="Growth Upsell"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="f-target">Target Plan Slug</Label>
            <Input
              id="f-target"
              placeholder="growth"
              value={form.target_plan_slug}
              onChange={(e) => setForm({ ...form, target_plan_slug: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="f-config">Config (JSON)</Label>
            <Textarea
              id="f-config"
              rows={4}
              placeholder='{"copy":{"headline":"...","sub":"..."},"cta":"/pricing"}'
              value={form.config}
              onChange={(e) => setForm({ ...form, config: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-2" />
              Save Funnel
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Attach Funnel to Lesson</h3>
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="attach-lesson">Lesson Slug</Label>
            <Input
              id="attach-lesson"
              placeholder="intro-to-mindfulness"
              value={attach.lesson_slug}
              onChange={(e) => setAttach({ ...attach, lesson_slug: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="attach-funnels">Funnel Slugs (comma-separated)</Label>
            <Input
              id="attach-funnels"
              placeholder="growth-upsell, pro-upsell"
              value={attach.funnel_slugs}
              onChange={(e) => setAttach({ ...attach, funnel_slugs: e.target.value })}
            />
          </div>

          <Button onClick={link}>
            <Plus className="w-4 h-4 mr-2" />
            Link Funnels
          </Button>
        </div>

        <h3 className="font-semibold mb-2">Existing Funnels</h3>
        <div className="space-y-2">
          {funnels.map((f: any) => (
            <Card key={f.slug}>
              <CardContent className="pt-4">
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-muted-foreground">
                  {f.slug} → {f.target_plan_slug}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
