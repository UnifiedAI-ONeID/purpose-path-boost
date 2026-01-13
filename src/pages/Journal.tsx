import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Calendar, Tag, Trash2, Search, ArrowLeft, Home, Sparkles, Heart, Edit2, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useJournal, JournalEntry, Mood, MOOD_OPTIONS, JOURNAL_PROMPTS } from '@/contexts/JournalContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface JournalFormData {
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  promptUsed?: string;
}

export default function Journal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, loading, addEntry, updateEntry, deleteEntry, toggleFavorite, searchEntries, getFavorites } = useJournal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<Mood | 'all'>('all');
  const [formData, setFormData] = useState<JournalFormData>({
    title: '',
    content: '',
    mood: 'neutral',
    tags: [],
    promptUsed: ''
  });
  const [newTag, setNewTag] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { from: '/journal' } });
    }
  }, [user, loading, navigate]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      mood: 'neutral',
      tags: [],
      promptUsed: ''
    });
    setNewTag('');
    setEditingEntry(null);
    setShowPrompts(false);
  };

  const handleAddTag = () => {
    if (!newTag.trim() || formData.tags.includes(newTag.trim())) return;
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleUsePrompt = (prompt: string) => {
    setFormData(prev => ({
      ...prev,
      title: prompt,
      promptUsed: prompt
    }));
    setShowPrompts(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in the title and content');
      return;
    }

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, formData);
      } else {
        await addEntry(formData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Journal save error:', err);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags || [],
      promptUsed: entry.promptUsed
    });
    setIsModalOpen(true);
  };

  const getMoodDisplay = (mood: Mood) => {
    const option = MOOD_OPTIONS.find(m => m.value === mood);
    return option || MOOD_OPTIONS[2]; // Default to neutral
  };

  const filteredEntries = () => {
    let result = entries;
    
    if (searchQuery) {
      result = searchEntries(searchQuery);
    }
    
    if (filterMood !== 'all') {
      result = result.filter(e => e.mood === filterMood);
    }
    
    return result;
  };

  const favorites = getFavorites();
  const displayEntries = filteredEntries();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jade-900 to-jade-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="py-12 text-center text-white">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gold-400" />
            <h2 className="text-2xl font-bold mb-2">Sign in to start journaling</h2>
            <p className="text-white/70 mb-6">Reflect on your journey and track your growth</p>
            <Button onClick={() => navigate('/auth')} className="bg-gold-500 hover:bg-gold-600 text-jade-900">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
      {/* Header */}
      <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-gold-400" />
                My Journal
              </h1>
              <p className="text-sm text-white/60">Reflect and grow</p>
            </div>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gold-500 hover:bg-gold-600 text-jade-900 font-semibold">
                <Plus className="h-4 w-4 mr-1" /> New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-jade-800 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gold-500" />
                  {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
                </DialogTitle>
                <DialogDescription>
                  Capture your thoughts, feelings, and insights
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Prompt suggestions */}
                {!editingEntry && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrompts(!showPrompts)}
                      className="text-jade-600 border-jade-200"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      {showPrompts ? 'Hide Prompts' : 'Need inspiration?'}
                    </Button>
                    {showPrompts && (
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {JOURNAL_PROMPTS.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleUsePrompt(prompt)}
                            className="w-full text-left text-sm p-2 rounded-md bg-jade-50 hover:bg-jade-100 text-jade-700 transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-jade-700">Title *</label>
                  <Input
                    placeholder="Give your entry a title..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-jade-700">Content *</label>
                  <Textarea
                    placeholder="Write your thoughts here..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="mt-1 min-h-[150px]"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-jade-700">How are you feeling?</label>
                  <div className="flex gap-2 mt-2">
                    {MOOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, mood: option.value }))}
                        className={cn(
                          "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                          formData.mood === option.value
                            ? "border-jade-500 bg-jade-50"
                            : "border-gray-200 hover:border-jade-300"
                        )}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="text-xs mt-1">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-jade-700">Tags</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                          {tag}
                          <button 
                            onClick={() => handleRemoveTag(tag)} 
                            className="ml-1 hover:text-red-500"
                            title="Remove tag"
                            aria-label={`Remove ${tag} tag`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-jade-600 hover:bg-jade-700"
                  >
                    {editingEntry ? 'Save Changes' : 'Save Entry'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-gold-400">{entries.length}</div>
              <div className="text-sm text-white/70">Total Entries</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-rose-400">{favorites.length}</div>
              <div className="text-sm text-white/70">Favorites</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-white">
                {entries.length > 0 
                  ? entries.filter(e => {
                      const entryDate = new Date(e.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return entryDate >= weekAgo;
                    }).length
                  : 0}
              </div>
              <div className="text-sm text-white/70">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <Select value={filterMood} onValueChange={(v) => setFilterMood(v as Mood | 'all')}>
            <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All moods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moods</SelectItem>
              {MOOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entries */}
        {loading ? (
          <div className="text-center py-12 text-white/60">Loading journal...</div>
        ) : displayEntries.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gold-400/50" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchQuery || filterMood !== 'all' ? 'No matching entries' : 'No journal entries yet'}
              </h3>
              <p className="text-white/60 mb-4">
                {searchQuery || filterMood !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start documenting your journey and insights'
                }
              </p>
              {!searchQuery && filterMood === 'all' && (
                <Button onClick={() => setIsModalOpen(true)} className="bg-gold-500 hover:bg-gold-600 text-jade-900">
                  <Plus className="h-4 w-4 mr-1" /> Write Your First Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayEntries.map((entry) => {
              const moodDisplay = getMoodDisplay(entry.mood);
              return (
                <Card key={entry.id} className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Mood indicator */}
                      <div className={cn(
                        "w-2 flex-shrink-0",
                        entry.mood === 'great' && "bg-green-500",
                        entry.mood === 'good' && "bg-emerald-500",
                        entry.mood === 'neutral' && "bg-gray-400",
                        entry.mood === 'low' && "bg-amber-500",
                        entry.mood === 'struggling' && "bg-red-500"
                      )} />
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{moodDisplay.emoji}</span>
                              <h3 className="font-semibold text-jade-800">{entry.title}</h3>
                              {entry.isFavorite && (
                                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                              {entry.content}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </span>
                              {entry.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-4 w-4" />
                                  {entry.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {entry.tags.length > 3 && (
                                    <span className="text-xs">+{entry.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleFavorite(entry.id)}
                              className={entry.isFavorite ? "text-rose-500" : "text-gray-400 hover:text-rose-500"}
                              title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart className={cn("h-4 w-4", entry.isFavorite && "fill-current")} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditEntry(entry)}
                              className="text-gray-400 hover:text-jade-600"
                              title="Edit entry"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                if (confirm('Delete this entry?')) deleteEntry(entry.id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}