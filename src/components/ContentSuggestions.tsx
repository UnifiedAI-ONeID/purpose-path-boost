import { useEffect, useState } from 'react';
import { supabase } from '@/db';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentSuggestions() {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateSuggestions() {
    setLoading(true);
    setSuggestions('Generating AI-powered content suggestions...');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-topics');
      
      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again in a few minutes.');
          setSuggestions('Rate limit exceeded. Please try again later.');
        } else if (data.error.includes('usage limit')) {
          toast.error('AI usage limit reached. Please add credits to your workspace.');
          setSuggestions('AI usage limit reached. Please add credits.');
        } else {
          throw new Error(data.error);
        }
      } else {
        setSuggestions(data.topics || 'No suggestions generated');
        toast.success('Content suggestions generated!');
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
      setSuggestions('Error generating suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Content Suggestions
        </h2>
        <Button 
          onClick={generateSuggestions} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Ideas
            </>
          )}
        </Button>
      </div>

      {suggestions ? (
        <div className="prose prose-sm max-w-none">
          <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
            {suggestions}
          </pre>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Click "Generate Ideas" to get AI-powered content suggestions based on your social media performance.
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        Powered by Google Gemini AI • Analyzes your past 90 days of social metrics
      </div>
    </Card>
  );
}
