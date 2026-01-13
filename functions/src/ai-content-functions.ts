/**
 * AI Content Functions
 * 
 * Functions for AI-powered content generation and suggestions
 */

import * as functions from 'firebase-functions';
import { db } from './firebase-init';

// Content topic templates for fallback suggestions
const TOPIC_TEMPLATES = {
  mindset: [
    'The power of reframing negative thoughts',
    'Building a growth mindset in challenging times',
    'How your beliefs shape your reality',
    'Overcoming imposter syndrome at work',
    'The science of positive self-talk'
  ],
  productivity: [
    'Time blocking for deep work',
    'The 2-minute rule for small tasks',
    'Building sustainable productivity habits',
    'Managing energy, not just time',
    'Creating systems that work for you'
  ],
  leadership: [
    'Leading with empathy in remote teams',
    'Building trust as a new leader',
    'Giving feedback that actually helps',
    'Navigating difficult conversations',
    'Developing your leadership presence'
  ],
  wellness: [
    'Morning routines that energize',
    'Managing stress without burning out',
    'The connection between sleep and success',
    'Building mental resilience',
    'Finding work-life harmony'
  ],
  relationships: [
    'Improving communication in relationships',
    'Setting healthy boundaries',
    'Building meaningful connections',
    'Navigating conflict constructively',
    'The art of active listening'
  ],
  career: [
    'Preparing for your next career move',
    'Building your personal brand',
    'Networking authentically',
    'Negotiating your worth',
    'Finding purpose in your work'
  ]
};

/**
 * AI Suggest Topics - Generate content topic suggestions
 * Used by ContentSuggestions component in admin
 */
export const aiSuggestTopics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { category, count = 5 } = data || {};

  try {
    // Check if user is admin
    const adminDoc = await db.collection('admins').doc(userId).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // Get recent blog posts to avoid duplicates
    const recentPosts = await db.collection('blog_posts')
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();
    
    const existingTopics = new Set(
      recentPosts.docs.map(doc => doc.data().title?.toLowerCase())
    );

    // Get analytics to understand popular content
    const viewsSnap = await db.collection('lesson_events')
      .where('event', '==', 'view')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    // Determine trending categories from views
    const categoryCount: Record<string, number> = {};
    viewsSnap.docs.forEach(doc => {
      const cat = doc.data().category || 'mindset';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Sort categories by popularity
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat);

    // Generate topics based on trending categories
    const suggestions: string[] = [];
    const targetCategory = category || sortedCategories[0] || 'mindset';
    
    // Get templates for target category
    const templates = TOPIC_TEMPLATES[targetCategory as keyof typeof TOPIC_TEMPLATES] 
      || TOPIC_TEMPLATES.mindset;

    // Filter out existing topics and add variation
    templates.forEach(topic => {
      if (!existingTopics.has(topic.toLowerCase()) && suggestions.length < count) {
        suggestions.push(topic);
      }
    });

    // If we need more, add from other categories
    if (suggestions.length < count) {
      const otherCategories = Object.keys(TOPIC_TEMPLATES).filter(c => c !== targetCategory);
      for (const cat of otherCategories) {
        const catTemplates = TOPIC_TEMPLATES[cat as keyof typeof TOPIC_TEMPLATES];
        for (const topic of catTemplates) {
          if (!existingTopics.has(topic.toLowerCase()) && suggestions.length < count) {
            suggestions.push(topic);
          }
        }
        if (suggestions.length >= count) break;
      }
    }

    // Format as readable text
    const formattedTopics = suggestions
      .slice(0, count)
      .map((topic, i) => `${i + 1}. ${topic}`)
      .join('\n');

    // Log the suggestion request
    await db.collection('ai_interactions').add({
      userId,
      type: 'content_suggestions',
      category: targetCategory,
      suggestions_count: suggestions.length,
      created_at: new Date().toISOString()
    });

    return {
      ok: true,
      topics: formattedTopics,
      category: targetCategory,
      count: suggestions.length
    };

  } catch (error) {
    console.error('AI suggest topics error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to generate suggestions');
  }
});
