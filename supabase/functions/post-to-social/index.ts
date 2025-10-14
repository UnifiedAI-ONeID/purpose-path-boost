import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SocialPostRequest {
  blogId: string;
  title: string;
  excerpt: string;
  slug: string;
  platforms: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { blogId, title, excerpt, slug, platforms }: SocialPostRequest = await req.json();

    console.log("Posting to social media:", { blogId, platforms });

    // Generate the blog post URL
    const blogUrl = `${req.headers.get('origin') || 'https://your-domain.com'}/blog/${slug}`;

    // Post to each platform
    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        try {
          let postId: string | null = null;
          let postUrl: string | null = null;
          let error: string | null = null;

          switch (platform) {
            case 'twitter':
              ({ postId, postUrl, error } = await postToTwitter(title, excerpt, blogUrl));
              break;
            case 'linkedin':
              ({ postId, postUrl, error } = await postToLinkedIn(title, excerpt, blogUrl));
              break;
            case 'facebook':
              ({ postId, postUrl, error } = await postToFacebook(title, excerpt, blogUrl));
              break;
            default:
              throw new Error(`Unsupported platform: ${platform}`);
          }

          // Record the post in the database
          const { error: dbError } = await supabase
            .from('social_media_posts')
            .insert({
              blog_post_id: blogId,
              platform,
              post_id: postId,
              post_url: postUrl,
              status: error ? 'failed' : 'posted',
              error_message: error,
              posted_at: error ? null : new Date().toISOString(),
            });

          if (dbError) {
            console.error(`Database error for ${platform}:`, dbError);
          }

          return { platform, success: !error, postUrl, error };
        } catch (error: any) {
          console.error(`Error posting to ${platform}:`, error);
          
          // Record failed attempt
          await supabase
            .from('social_media_posts')
            .insert({
              blog_post_id: blogId,
              platform,
              status: 'failed',
              error_message: error.message,
            });

          return { platform, success: false, error: error.message };
        }
      })
    );

    const formattedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          platform: platforms[index],
          status: result.status,
          success: result.value.success,
          postUrl: result.value.postUrl,
          error: result.value.error,
        };
      } else {
        return {
          platform: platforms[index],
          status: result.status,
          success: false,
          error: result.reason,
        };
      }
    });

    return new Response(
      JSON.stringify({ results: formattedResults }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in post-to-social function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function postToTwitter(title: string, excerpt: string, url: string) {
  // Twitter API credentials
  const apiKey = Deno.env.get("TWITTER_API_KEY");
  const apiSecret = Deno.env.get("TWITTER_API_SECRET");
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN");
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.log("Twitter credentials not configured");
    return {
      postId: null,
      postUrl: null,
      error: "Twitter credentials not configured",
    };
  }

  // Create tweet text (280 char limit)
  const tweetText = `${title}\n\n${excerpt.substring(0, 100)}...\n\nRead more: ${url}`;

  // In production, implement Twitter API v2 posting
  // For now, return simulated success
  console.log("Would post to Twitter:", tweetText);

  return {
    postId: `twitter_${Date.now()}`,
    postUrl: "https://twitter.com/simulated",
    error: null,
  };
}

async function postToLinkedIn(title: string, excerpt: string, url: string) {
  const accessToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");

  if (!accessToken) {
    console.log("LinkedIn credentials not configured");
    return {
      postId: null,
      postUrl: null,
      error: "LinkedIn credentials not configured",
    };
  }

  // Create LinkedIn post text
  const postText = `${title}\n\n${excerpt}\n\nRead the full article: ${url}`;

  // In production, implement LinkedIn API posting
  console.log("Would post to LinkedIn:", postText);

  return {
    postId: `linkedin_${Date.now()}`,
    postUrl: "https://linkedin.com/simulated",
    error: null,
  };
}

async function postToFacebook(title: string, excerpt: string, url: string) {
  const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");

  if (!accessToken || !pageId) {
    console.log("Facebook credentials not configured");
    return {
      postId: null,
      postUrl: null,
      error: "Facebook credentials not configured",
    };
  }

  // Create Facebook post text
  const postText = `${title}\n\n${excerpt}\n\nRead more: ${url}`;

  // In production, implement Facebook Graph API posting
  console.log("Would post to Facebook:", postText);

  return {
    postId: `facebook_${Date.now()}`,
    postUrl: "https://facebook.com/simulated",
    error: null,
  };
}