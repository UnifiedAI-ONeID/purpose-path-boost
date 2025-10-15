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

// AES-256-GCM decryption
async function getKey(): Promise<CryptoKey> {
  const masterKeyB64 = Deno.env.get('SECRET_MASTER_KEY');
  if (!masterKeyB64) throw new Error('SECRET_MASTER_KEY not configured');
  
  const keyData = Uint8Array.from(atob(masterKeyB64), c => c.charCodeAt(0));
  if (keyData.length !== 32) throw new Error('SECRET_MASTER_KEY must be 32 bytes');
  
  return await crypto.subtle.importKey(
    'raw', keyData, { name: 'AES-GCM' }, false, ['decrypt']
  );
}

async function decryptSecret(encrypted: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
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

    // Get enabled platforms with credentials from database
    const { data: configs } = await supabase
      .from('social_configs')
      .select('*')
      .eq('enabled', true)
      .in('platform', platforms);

    if (!configs || configs.length === 0) {
      console.log('No enabled platforms found');
      return new Response(
        JSON.stringify({ error: 'No enabled platforms configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Post to each platform
    const results = await Promise.allSettled(
      configs.map(async (config) => {
        try {
          // Decrypt credentials
          const credentials = {
            appKey: config.app_key_enc ? await decryptSecret(config.app_key_enc) : undefined,
            appSecret: config.app_secret_enc ? await decryptSecret(config.app_secret_enc) : undefined,
            accessToken: config.access_token_enc ? await decryptSecret(config.access_token_enc) : undefined,
            refreshToken: config.refresh_token_enc ? await decryptSecret(config.refresh_token_enc) : undefined,
            accountId: config.account_id_enc ? await decryptSecret(config.account_id_enc) : undefined,
            webhookUrl: config.webhook_url_enc ? await decryptSecret(config.webhook_url_enc) : undefined,
          };

          let postId: string | null = null;
          let postUrl: string | null = null;
          let error: string | null = null;

          const postText = config.posting_template
            ? config.posting_template
                .replace('{title}', title)
                .replace('{url}', blogUrl)
                .replace('{excerpt}', excerpt)
            : `${title}\n\n${excerpt}\n\nRead more: ${blogUrl}`;

          switch (config.platform) {
            case 'twitter':
              ({ postId, postUrl, error } = await postToTwitter(postText, credentials));
              break;
            case 'linkedin':
              ({ postId, postUrl, error } = await postToLinkedIn(postText, credentials));
              break;
            case 'facebook':
              ({ postId, postUrl, error } = await postToFacebook(postText, credentials));
              break;
            default:
              throw new Error(`Unsupported platform: ${config.platform}`);
          }

          // Record the post in the database
          const { error: dbError } = await supabase
            .from('social_media_posts')
            .insert({
              blog_post_id: blogId,
              platform: config.platform,
              post_id: postId,
              post_url: postUrl,
              status: error ? 'failed' : 'posted',
              error_message: error,
              posted_at: error ? null : new Date().toISOString(),
            });

          if (dbError) {
            console.error(`Database error for ${config.platform}:`, dbError);
          }

          return { platform: config.platform, success: !error, postUrl, error };
        } catch (error: any) {
          console.error(`Error posting to ${config.platform}:`, error);
          
          // Record failed attempt
          await supabase
            .from('social_media_posts')
            .insert({
              blog_post_id: blogId,
              platform: config.platform,
              status: 'failed',
              error_message: error.message,
            });

          return { platform: config.platform, success: false, error: error.message };
        }
      })
    );

    const formattedResults = results.map((result) => {
      if (result.status === 'fulfilled') {
        return {
          platform: result.value.platform,
          status: result.status,
          success: result.value.success,
          postUrl: result.value.postUrl,
          error: result.value.error,
        };
      } else {
        return {
          platform: 'unknown',
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

async function postToTwitter(text: string, credentials: any) {
  if (!credentials.webhookUrl) {
    console.log("Twitter webhook URL not configured");
    return {
      postId: null,
      postUrl: null,
      error: "Twitter webhook URL not configured. Configure credentials in admin settings.",
    };
  }

  // Limit tweet to 280 characters
  const tweetText = text.length > 280 ? text.substring(0, 277) + '...' : text;

  try {
    // Send to webhook (e.g., n8n) which will handle Twitter OAuth posting
    const response = await fetch(credentials.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'twitter',
        text: tweetText,
        credentials: {
          apiKey: credentials.appKey,
          apiSecret: credentials.appSecret,
          accessToken: credentials.accessToken,
          accessTokenSecret: credentials.refreshToken, // Twitter uses this as token secret
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    const result = await response.json();
    
    return {
      postId: result.postId || `twitter_${Date.now()}`,
      postUrl: result.postUrl || "https://twitter.com",
      error: null,
    };
  } catch (error: any) {
    console.error("Twitter posting error:", error);
    return {
      postId: null,
      postUrl: null,
      error: error.message,
    };
  }
}

async function postToLinkedIn(text: string, credentials: any) {
  if (!credentials.accessToken) {
    console.log("LinkedIn access token not configured");
    return {
      postId: null,
      postUrl: null,
      error: "LinkedIn credentials not configured. Configure in admin settings.",
    };
  }

  // Use webhook if configured, otherwise return placeholder
  if (credentials.webhookUrl) {
    try {
      const response = await fetch(credentials.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'linkedin',
          text,
          credentials: {
            accessToken: credentials.accessToken,
            accountId: credentials.accountId,
          },
        }),
      });

      const result = await response.json();
      return {
        postId: result.postId || `linkedin_${Date.now()}`,
        postUrl: result.postUrl || "https://linkedin.com",
        error: null,
      };
    } catch (error: any) {
      return {
        postId: null,
        postUrl: null,
        error: error.message,
      };
    }
  }

  console.log("Would post to LinkedIn:", text);
  return {
    postId: `linkedin_${Date.now()}`,
    postUrl: "https://linkedin.com/simulated",
    error: null,
  };
}

async function postToFacebook(text: string, credentials: any) {
  if (!credentials.accessToken || !credentials.accountId) {
    console.log("Facebook credentials not configured");
    return {
      postId: null,
      postUrl: null,
      error: "Facebook credentials not configured. Configure in admin settings.",
    };
  }

  // Use webhook if configured
  if (credentials.webhookUrl) {
    try {
      const response = await fetch(credentials.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'facebook',
          text,
          credentials: {
            accessToken: credentials.accessToken,
            pageId: credentials.accountId,
          },
        }),
      });

      const result = await response.json();
      return {
        postId: result.postId || `facebook_${Date.now()}`,
        postUrl: result.postUrl || "https://facebook.com",
        error: null,
      };
    } catch (error: any) {
      return {
        postId: null,
        postUrl: null,
        error: error.message,
      };
    }
  }

  console.log("Would post to Facebook:", text);
  return {
    postId: `facebook_${Date.now()}`,
    postUrl: "https://facebook.com/simulated",
    error: null,
  };
}