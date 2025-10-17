import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminShell from '@/components/admin/AdminShell';
import EditorModal from '@/components/admin/blog/EditorModal';
import { toast } from 'sonner';
import '../../../lib/ui.css';

export default function BlogManager() {
  const { data: posts, refetch } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Post deleted');
      refetch();
    } catch (e: any) {
      toast.error(`Failed to delete: ${e.message}`);
    }
  }

  return (
    <AdminShell>
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Blog Manager</h1>
          <EditorModal onSaved={() => refetch()} />
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-muted">Title</th>
                  <th className="text-left py-2 pr-4 text-muted">Slug</th>
                  <th className="text-left py-2 pr-4 text-muted">Category</th>
                  <th className="text-left py-2 pr-4 text-muted">Status</th>
                  <th className="text-left py-2 pr-4 text-muted">Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(posts || []).map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 pr-4">{p.title}</td>
                    <td className="py-2 pr-4 text-muted">{p.slug}</td>
                    <td className="py-2 pr-4">{p.category}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-right">
                      <EditorModal initial={p} onSaved={() => refetch()} />
                      <button 
                        className="btn ml-2" 
                        onClick={() => deletePost(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
