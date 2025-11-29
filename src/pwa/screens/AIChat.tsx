import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '../core/PWAProvider';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { Brain, Send, Sparkles, Loader2, User, Bot } from 'lucide-react';
import { toast } from 'sonner';

const suggestPwaAi = httpsCallable(functions, 'pwa-ai-suggest');

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AIChat() {
  const { isOnline, isGuest } = usePWA();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI growth coach. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !isOnline) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await suggestPwaAi({
        type: 'chat',
        message: input,
        context: {
          isGuest,
          previousMessages: messages.slice(-5) // Last 5 messages for context
        }
      });

      const data = result.data as { ok: boolean, response: string };

      if (data?.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response || 'I\'m here to help!',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error('Failed to get response');
      }
    } catch (err) {
      console.error('[AI Chat] Error:', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Help me set goals for this week',
    'Give me motivation',
    'What should I focus on today?',
    'Analyze my progress'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Coach</h1>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Beta
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <Card className={`p-3 max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </Card>
            {message.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <Card className="p-3 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="py-3 border-t border-b">
          <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt)}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="py-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={isOnline ? "Ask me anything..." : "You're offline"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={!isOnline || loading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || loading || !isOnline}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
