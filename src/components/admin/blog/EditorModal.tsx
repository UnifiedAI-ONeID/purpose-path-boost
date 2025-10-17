import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EditorModal({ initial, onSaved }: {
  initial?: any; 
  onSaved: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [post, setPost] = React.useState<any>(initial || { 
    slug: '', 
    title: '', 
    excerpt: '', 
    content: '',
    category: 'coaching',
    published: false,
    tags: []
  });

  const editor = useEditor({ 
    extensions: [StarterKit], 
    content: post.content || '' 
  });

  React.useEffect(() => {
    if (initial && open) {
      setPost(initial);
      editor?.commands.setContent(initial.content || '');
    }
  }, [initial, open]);

  async function save() {
    try {
      const content = editor?.getHTML() || '';
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Not authenticated');
        return;
      }

      const payload = {
        ...post,
        content,
        slug: post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Post saved successfully');
      setOpen(false);
      onSaved();
    } catch (e: any) {
      toast.error(`Failed to save: ${e.message}`);
    }
  }

  async function publish() {
    try {
      const content = editor?.getHTML() || '';
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Not authenticated');
        return;
      }

      const payload = {
        ...post,
        content,
        slug: post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        published: true,
        published_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('blog_posts')
        .upsert(payload);

      if (error) throw error;
      
      toast.success('Post published successfully');
      setOpen(false);
      onSaved();
    } catch (e: any) {
      toast.error(`Failed to publish: ${e.message}`);
    }
  }

  return (
    <>
      <button className="btn btn-cta" onClick={() => setOpen(true)}>
        {initial ? 'Edit' : 'New post'}
      </button>
      
      {open && (
        <div className="zg-sheet" onClick={() => setOpen(false)}>
          <div className="zg-card" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-4">
              {initial ? 'Edit Post' : 'New Post'}
            </h2>

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input 
                  className="input mt-1" 
                  value={post.title} 
                  onChange={e => setPost({ ...post, title: e.target.value })}
                  placeholder="Post title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Slug</label>
                <input 
                  className="input mt-1" 
                  value={post.slug} 
                  onChange={e => setPost({ ...post, slug: e.target.value })}
                  placeholder="post-url-slug"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Excerpt</label>
                <textarea 
                  className="input mt-1" 
                  rows={3} 
                  value={post.excerpt} 
                  onChange={e => setPost({ ...post, excerpt: e.target.value })}
                  placeholder="Brief summary"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="input mt-1" 
                  value={post.category} 
                  onChange={e => setPost({ ...post, category: e.target.value })}
                >
                  <option value="coaching">Coaching</option>
                  <option value="growth">Growth</option>
                  <option value="clarity">Clarity</option>
                  <option value="mindset">Mindset</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <div className="editor mt-1">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn" onClick={save}>
                Save Draft
              </button>
              <button className="btn btn-cta" onClick={publish}>
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
