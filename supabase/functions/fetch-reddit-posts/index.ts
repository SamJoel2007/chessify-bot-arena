import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize text to prevent XSS - escape HTML special characters
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate Reddit username format (alphanumeric, underscores, hyphens, 3-20 chars)
function isValidRedditUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernamePattern.test(username);
}

// Validate image URL against trusted domains
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Only allow specific trusted image hosting domains
  const trustedDomains = [
    'i.redd.it',
    'i.imgur.com',
    'preview.redd.it'
  ];
  
  try {
    const parsedUrl = new URL(url);
    
    // Must be HTTPS
    if (parsedUrl.protocol !== 'https:') return false;
    
    // Must be from a trusted domain
    if (!trustedDomains.includes(parsedUrl.hostname)) return false;
    
    // Must have a valid image extension
    const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!validExtensions.test(parsedUrl.pathname)) return false;
    
    return true;
  } catch {
    return false;
  }
}

// Validate subreddit name
function isValidSubreddit(subreddit: string): boolean {
  if (!subreddit || typeof subreddit !== 'string') return false;
  const subredditPattern = /^[a-zA-Z0-9_]{3,21}$/;
  return subredditPattern.test(subreddit);
}

// Validate permalink format
function isValidPermalink(permalink: string): boolean {
  if (!permalink || typeof permalink !== 'string') return false;
  // Reddit permalinks start with /r/ and contain alphanumeric characters
  const permalinkPattern = /^\/r\/[a-zA-Z0-9_]+\/comments\/[a-zA-Z0-9]+\/[a-zA-Z0-9_]+\/?$/;
  return permalinkPattern.test(permalink);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching chess memes from Reddit...');
    
    // Fetch from Reddit API with proper headers
    const response = await fetch('https://www.reddit.com/r/AnarchyChess+chess+ChessMemes/hot.json?limit=50', {
      headers: {
        'User-Agent': 'web:chess-community-app:v1.0.0 (by /u/chesscommunity)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data?.data?.children || !Array.isArray(data.data.children)) {
      throw new Error('Invalid Reddit API response structure');
    }
    
    const posts = data.data.children;

    console.log(`Fetched ${posts.length} posts from Reddit`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process and store posts
    const processedPosts = [];
    let skippedCount = 0;
    
    for (const post of posts) {
      const postData = post?.data;
      
      // Skip if invalid post structure
      if (!postData || typeof postData !== 'object') {
        skippedCount++;
        continue;
      }
      
      // Skip if not an image or video post
      if (!postData.url || postData.is_self) {
        skippedCount++;
        continue;
      }
      
      // Validate the image URL strictly
      if (!isValidImageUrl(postData.url)) {
        console.log(`Skipping invalid image URL: ${postData.url?.substring(0, 50)}`);
        skippedCount++;
        continue;
      }
      
      // Validate author username
      if (!isValidRedditUsername(postData.author)) {
        console.log(`Skipping post with invalid author: ${postData.author}`);
        skippedCount++;
        continue;
      }
      
      // Validate subreddit
      if (!isValidSubreddit(postData.subreddit)) {
        console.log(`Skipping post with invalid subreddit: ${postData.subreddit}`);
        skippedCount++;
        continue;
      }
      
      // Validate permalink
      if (!isValidPermalink(postData.permalink)) {
        console.log(`Skipping post with invalid permalink`);
        skippedCount++;
        continue;
      }
      
      // Validate title exists and has reasonable length
      if (!postData.title || typeof postData.title !== 'string' || postData.title.length > 500) {
        console.log(`Skipping post with invalid title`);
        skippedCount++;
        continue;
      }
      
      // Check if this Reddit post already exists
      const externalUrl = `https://reddit.com${postData.permalink}`;
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('source', 'reddit')
        .eq('external_url', externalUrl)
        .maybeSingle();

      if (existing) {
        console.log(`Post already exists: ${postData.title.substring(0, 50)}`);
        continue;
      }

      // Sanitize all text fields before storing
      const sanitizedTitle = sanitizeText(postData.title.substring(0, 255));
      const sanitizedAuthor = sanitizeText(postData.author);
      const sanitizedSubreddit = sanitizeText(postData.subreddit);
      const sanitizedContent = postData.selftext 
        ? sanitizeText(postData.selftext.substring(0, 1000))
        : `Posted by u/${sanitizedAuthor} on r/${sanitizedSubreddit}`;

      // Insert new Reddit post with sanitized data
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          title: sanitizedTitle,
          content: sanitizedContent,
          image_url: postData.url, // Already validated
          source: 'reddit',
          external_url: externalUrl, // Constructed from validated permalink
          author_username: `u/${sanitizedAuthor}`,
          author_id: '00000000-0000-0000-0000-000000000000' // Placeholder for Reddit posts
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting post:', error);
        continue;
      }

      processedPosts.push(newPost);
    }

    console.log(`Successfully processed ${processedPosts.length} new posts, skipped ${skippedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedCount: processedPosts.length,
        skippedCount: skippedCount,
        posts: processedPosts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});