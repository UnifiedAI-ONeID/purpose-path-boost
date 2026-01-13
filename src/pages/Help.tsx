/**
 * @file Help - FAQ and Support page
 * Uses Jade & Gold design system
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, ArrowLeft, MessageCircle, Mail, Phone, 
  ChevronDown, ChevronUp, Search, Book, Video, Users, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEOHelmet } from '@/components/SEOHelmet';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I book my first coaching session?',
    answer: 'Navigate to the Coaching page, select a program that fits your needs, and click "Book a Free Call" to schedule your discovery session. Our coach will guide you through the process and help you choose the right program.'
  },
  {
    category: 'Getting Started',
    question: 'What happens during a discovery call?',
    answer: 'The discovery call is a free 30-minute session where we understand your goals, challenges, and aspirations. We\'ll discuss how coaching can help you and answer any questions about the process.'
  },
  {
    category: 'Coaching',
    question: 'What coaching programs do you offer?',
    answer: 'We offer several programs including Career Breakthrough (6-8 weeks), DreamBuilder (3 months), Life Mastery (6 months), and VIP 1:1 coaching. Each program is tailored to different goals and timeframes.'
  },
  {
    category: 'Coaching',
    question: 'Are sessions conducted in English or Chinese?',
    answer: 'Our coaching is bilingual! Sessions can be conducted in English, Mandarin Chinese (中文), or a mix of both - whatever makes you most comfortable.'
  },
  {
    category: 'Coaching',
    question: 'How long are coaching sessions?',
    answer: 'Standard coaching sessions are 60 minutes. Discovery calls are 30 minutes. Some VIP programs include extended 90-minute deep-dive sessions.'
  },
  {
    category: 'App Features',
    question: 'How do I track my goals?',
    answer: 'Use the Goals page to create and manage your goals. You can set milestones, track progress, and categorize goals by area (career, health, relationships, etc.). The Insights page shows your overall progress.'
  },
  {
    category: 'App Features',
    question: 'What is the Journal feature for?',
    answer: 'The Journal is your personal reflection space. Record your thoughts, track your mood, and build a daily journaling habit. Regular journaling helps with self-awareness and progress tracking.'
  },
  {
    category: 'App Features',
    question: 'How does the Community feature work?',
    answer: 'The Community is where you connect with other members on their growth journey. Share wins, ask questions, find accountability partners, and learn from others\' experiences.'
  },
  {
    category: 'Account',
    question: 'How do I update my profile?',
    answer: 'Go to Settings > Profile to update your name, avatar, timezone, and other preferences. You can also manage notification settings and change your password there.'
  },
  {
    category: 'Account',
    question: 'Can I cancel or reschedule a session?',
    answer: 'Yes, you can reschedule or cancel sessions up to 24 hours before the scheduled time. Go to My Sessions, find the session, and click the reschedule or cancel option.'
  },
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), as well as various local payment methods depending on your region. All payments are processed securely.'
  },
  {
    category: 'Payments',
    question: 'Do you offer refunds?',
    answer: 'We offer a satisfaction guarantee. If you\'re not satisfied after your first paid session, contact us within 7 days for a full refund. See our Terms of Service for full details.'
  }
];

const CATEGORIES = ['All', 'Getting Started', 'Coaching', 'App Features', 'Account', 'Payments'];

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Filter FAQs
  const filteredFAQs = FAQ_DATA.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <SEOHelmet
        title="Help & Support | Purpose Path"
        description="Get help with your coaching journey. Find answers to frequently asked questions and contact support."
      />

      <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
        {/* Header */}
        <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
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
                <HelpCircle className="h-6 w-6 text-gold-400" />
                Help & Support
              </h1>
              <p className="text-sm text-white/60">Find answers and get support</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
              <CardContent className="py-4 text-center">
                <Book className="h-6 w-6 mx-auto mb-2 text-gold-400" />
                <p className="text-sm font-medium text-white">Guides</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
              <CardContent className="py-4 text-center">
                <Video className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium text-white">Tutorials</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
              <CardContent className="py-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                <p className="text-sm font-medium text-white">Community</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
              onClick={() => navigate('/contact')}
            >
              <CardContent className="py-4 text-center">
                <MessageCircle className="h-6 w-6 mx-auto mb-2 text-rose-400" />
                <p className="text-sm font-medium text-white">Contact Us</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  selectedCategory === category 
                    ? 'bg-gold-500 hover:bg-gold-600 text-jade-900' 
                    : 'border-white/20 text-white/80 hover:bg-white/10'
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* FAQ List */}
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-jade-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-gold-500" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No matching questions found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0">
                    <button
                      className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 px-2 rounded transition-colors"
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    >
                      <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                      {expandedIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {expandedIndex === index && (
                      <div className="pb-4 px-2 text-gray-600 text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-jade-800 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-gold-500" />
                Still Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="mailto:support@zhengrowth.com"
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-jade-300 hover:bg-jade-50 transition-colors"
                >
                  <Mail className="h-5 w-5 text-jade-600" />
                  <div>
                    <p className="font-medium text-gray-800">Email Support</p>
                    <p className="text-sm text-gray-500">support@zhengrowth.com</p>
                  </div>
                </a>
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start border-gray-200 hover:border-jade-300 hover:bg-jade-50"
                  onClick={() => navigate('/contact')}
                >
                  <Calendar className="h-5 w-5 text-jade-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Schedule a Call</p>
                    <p className="text-sm text-gray-500">Book a support session</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
