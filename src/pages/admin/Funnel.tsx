import { useState, useEffect } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Mail, Users, TrendingUp, Send } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

export default function FunnelManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, emailsSent: 0, pendingEmails: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load funnel stages
      const { data: stagesData } = await supabase
        .from('funnel_stages')
        .select('*')
        .order('order_index');
      
      if (stagesData) setStages(stagesData);

      // Load email templates
      const { data: templatesData } = await supabase
        .from('email_templates')
        .select('*, funnel_stages(name), email_attachments(*)');
      
      if (templatesData) setTemplates(templatesData);

      // Load stats
      const { count: usersCount } = await supabase
        .from('user_funnel_progress')
        .select('*', { count: 'exact', head: true });

      const { count: sentCount } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        emailsSent: sentCount || 0,
        pendingEmails: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load funnel data');
    }
  }

  async function handleSaveTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const templateData = {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        html_body: formData.get('html_body') as string,
        stage_id: (formData.get('stage_id') as string) || null,
        from_name: (formData.get('from_name') as string) || 'ZhenGrowth',
        from_email: (formData.get('from_email') as string) || 'hello@zhengrowth.com',
        active: true,
      };

      if (selectedTemplate) {
        // Update existing
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, templateId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const filePath = `${templateId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('email-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save attachment metadata
      const { error: metadataError } = await supabase
        .from('email_attachments')
        .insert({
          template_id: templateId,
          filename: file.name,
          storage_path: filePath,
          content_type: file.type,
          size_bytes: file.size,
        });

      if (metadataError) throw metadataError;

      toast.success('File uploaded successfully');
      loadData();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSendTestEmail(templateId: string) {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('zg_profiles')
        .select('id, email')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase.functions.invoke('funnel-send-email', {
        body: {
          profileId: profile.id,
          templateId: templateId,
          toEmail: profile.email,
        },
      });

      if (error) throw error;

      toast.success('Test email sent to your address');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  }

  async function processQueue() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('funnel-process-queue');
      
      if (error) throw error;

      toast.success(`Processed ${data.totalProcessed} emails (${data.emailsSent} sent, ${data.emailsFailed} failed)`);
      loadData();
    } catch (error: any) {
      console.error('Error processing queue:', error);
      toast.error(error.message || 'Failed to process queue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Funnel Management</h1>
            <p className="text-muted-foreground">Manage email campaigns and user journeys</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={processQueue} disabled={loading}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Process Queue
            </Button>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedTemplate(null); setShowTemplateDialog(true); }}>
                  <Mail className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedTemplate ? 'Edit' : 'Create'} Email Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input name="name" defaultValue={selectedTemplate?.name} required />
                  </div>
                  <div>
                    <Label>Funnel Stage</Label>
                    <select name="stage_id" className="w-full border rounded-md p-2" defaultValue={selectedTemplate?.stage_id || ''}>
                      <option value="">No stage (manual only)</option>
                      {stages.map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From Name</Label>
                      <Input name="from_name" defaultValue={selectedTemplate?.from_name || 'ZhenGrowth'} />
                    </div>
                    <div>
                      <Label>From Email</Label>
                      <Input name="from_email" type="email" defaultValue={selectedTemplate?.from_email || 'hello@zhengrowth.com'} />
                    </div>
                  </div>
                  <div>
                    <Label>Subject Line</Label>
                    <Input name="subject" defaultValue={selectedTemplate?.subject} required />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variables: {`{{name}}, {{email}}`}
                    </p>
                  </div>
                  <div>
                    <Label>HTML Body</Label>
                    <Textarea name="html_body" rows={12} defaultValue={selectedTemplate?.html_body} required />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use HTML and variables like {`{{name}}, {{email}}`}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Users in Funnel</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold">{stats.emailsSent}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Emails</p>
                <p className="text-2xl font-bold">{stats.pendingEmails}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Email Templates */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
          <div className="grid gap-4">
            {templates.map(template => (
              <Card key={template.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Stage: {template.funnel_stages?.name || 'Manual only'}
                    </p>
                    <p className="text-sm mt-2"><strong>Subject:</strong> {template.subject}</p>
                    {template.email_attachments && template.email_attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Attachments:</p>
                        <ul className="text-xs">
                          {template.email_attachments.map((att: any) => (
                            <li key={att.id}>📎 {att.filename} ({(att.size_bytes / 1024).toFixed(1)} KB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleSendTestEmail(template.id)} disabled={loading}>
                      Send Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedTemplate(template); setShowTemplateDialog(true); }}>
                      Edit
                    </Button>
                    <label className="cursor-pointer">
                      <Button size="sm" variant="outline" asChild disabled={uploadingFile}>
                        <span>
                          <Upload className="h-4 w-4" />
                        </span>
                      </Button>
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, template.id)} />
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
