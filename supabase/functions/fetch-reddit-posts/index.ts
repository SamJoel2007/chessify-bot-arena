import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching chess memes from Reddit...');
    
    // Fetch from Reddit API
    const response = await fetch('https://www.reddit.com/r/AnarchyChess+chess+ChessMemes/hot.json?limit=50', {
      headers: {
        'User-Agent': 'ChessApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }

    const data = await response.json();
    const posts = data.data.children;

    console.log(`Fetched ${posts.length} posts from Reddit`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process and store posts
    const processedPosts = [];
    for (const post of posts) {
      const postData = post.data;
      
      // Skip if not an image or video post
      if (!postData.url || postData.is_self) continue;
      
      // Check if this Reddit post already exists
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('source', 'reddit')
        .eq('external_url', postData.url)
        .single();

      if (existing) {
        console.log(`Post already exists: ${postData.title}`);
        continue;
      }

      // Determine if it's an image
      const isImage = postData.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                     postData.url.includes('i.redd.it') ||
                     postData.url.includes('i.imgur.com');

      if (!isImage) continue;

      // Insert new Reddit post
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          title: postData.title.substring(0, 255),
          content: postData.selftext || `Posted by u/${postData.author} on r/${postData.subreddit}`,
          image_url: postData.url,
          source: 'reddit',
          external_url: `https://reddit.com${postData.permalink}`,
          author_username: `u/${postData.author}`,
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

    console.log(`Successfully processed ${processedPosts.length} new posts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedCount: processedPosts.length,
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
