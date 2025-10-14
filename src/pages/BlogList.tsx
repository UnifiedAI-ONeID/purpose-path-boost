import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { track } from '@/analytics/events';

// In production, this would load from /src/blog/*.md files
const blogPosts = [
  {
    slug: '5-signs-you-need-career-coach',
    title: '5 Signs You Need a Career Coach (And How to Know If It\'s Right for You)',
    excerpt: 'Feeling stuck in your career? Here are 5 clear signs that professional coaching could be the breakthrough you need.',
    category: 'Clarity',
    date: '2025-01-15',
    readTime: '5 min read',
  },
  {
    slug: 'overcome-career-plateau',
    title: 'How to Overcome a Career Plateau and Reignite Your Growth',
    excerpt: 'Stuck in your current role? Learn proven strategies to break through plateaus and accelerate your career growth.',
    category: 'Growth',
    date: '2025-01-10',
    readTime: '7 min read',
  },
  {
    slug: 'find-your-purpose',
    title: 'Finding Your Purpose: A Practical Framework for Career Clarity',
    excerpt: 'Purpose isn\'t found, it\'s built. Here\'s a step-by-step framework to discover work that truly matters.',
    category: 'Purpose',
    date: '2025-01-05',
    readTime: '8 min read',
  },
  {
    slug: 'confidence-in-leadership',
    title: 'Building Unshakeable Confidence in Leadership Transitions',
    excerpt: 'Stepping into a leadership role? Here\'s how to build the confidence you need to succeed.',
    category: 'Mindset',
    date: '2025-01-01',
    readTime: '6 min read',
  },
];

const categories = ['All', 'Growth', 'Mindset', 'Clarity', 'Purpose'];

const BlogList = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground">
            Insights and strategies for professional growth
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              size="sm"
              onClick={() => track('blog_category_click', { category })}
            >
              <Tag className="h-4 w-4 mr-2" />
              {category}
            </Button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-medium transition-smooth">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="px-2 py-1 rounded-full bg-brand-accent/10 text-brand-accent font-medium">
                      {post.category}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <h2 className="text-2xl font-serif font-bold mb-2">{post.title}</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    <Button
                      asChild
                      variant="link"
                      className="p-0"
                      onClick={() => track('blog_read', { slug: post.slug })}
                    >
                      <Link to={`/blog/${post.slug}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-primary text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Get personalized guidance to achieve your goals
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/book-session">Book a Free Session</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogList;
