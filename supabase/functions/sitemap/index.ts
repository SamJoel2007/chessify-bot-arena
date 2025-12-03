import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://chessify.lovable.app'

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/bots', priority: '0.9', changefreq: 'weekly' },
  { path: '/puzzles', priority: '0.9', changefreq: 'weekly' },
  { path: '/community', priority: '0.8', changefreq: 'daily' },
  { path: '/leaderboards', priority: '0.8', changefreq: 'daily' },
  { path: '/blog', priority: '0.9', changefreq: 'daily' },
  { path: '/coach', priority: '0.7', changefreq: 'weekly' },
  { path: '/game-history', priority: '0.6', changefreq: 'weekly' },
  { path: '/friends', priority: '0.6', changefreq: 'weekly' },
  { path: '/certificates', priority: '0.5', changefreq: 'monthly' },
  { path: '/about', priority: '0.4', changefreq: 'monthly' },
  { path: '/auth', priority: '0.3', changefreq: 'monthly' },
]

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all published blog posts
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching blog posts:', error)
    }

    const currentDate = new Date().toISOString().split('T')[0]

    // Generate XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
    }

    // Add blog posts
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : new Date(post.published_at).toISOString().split('T')[0]
        
        sitemap += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
      }
    }

    sitemap += `</urlset>`

    console.log(`Generated sitemap with ${staticPages.length} static pages and ${blogPosts?.length || 0} blog posts`)

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
