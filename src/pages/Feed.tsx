import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ExternalLink, RefreshCw, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  source: string;
  external_url: string | null;
  author_username: string | null;
  created_at: string;
  like_count?: number;
  user_has_liked?: boolean;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", image_url: "" });
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchPosts();
    
    // Subscribe to new posts
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_likes (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's likes if logged in
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        userLikes = likesData?.map(like => like.post_id) || [];
      }

      const postsWithLikes = postsData?.map(post => ({
        ...post,
        like_count: post.post_likes?.[0]?.count || 0,
        user_has_liked: userLikes.includes(post.id)
      })) || [];

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRedditPosts = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-reddit-posts');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Fetched ${data.processedCount} new chess memes!`,
      });
      
      fetchPosts();
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Reddit posts",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            like_count: currentlyLiked ? (post.like_count || 0) - 1 : (post.like_count || 0) + 1,
            user_has_liked: !currentlyLiked
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create posts",
        variant: "destructive",
      });
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          image_url: newPost.image_url || null,
          source: 'user',
          author_id: user.id,
          author_username: profile?.username || 'Anonymous'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      setIsCreateDialogOpen(false);
      setNewPost({ title: "", content: "", image_url: "" });
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Chess Feed</h1>
            <p className="text-muted-foreground">Memes, posts, and chess content</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchRedditPosts}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Fetch Reddit Memes
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Enter post title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="What's on your mind?"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL (optional)</Label>
                    <Input
                      id="image_url"
                      value={newPost.image_url}
                      onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <Button onClick={handleCreatePost} className="w-full">
                    Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to post or fetch from Reddit!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{post.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {post.author_username || 'Anonymous'} • {post.source === 'reddit' ? '🤖 Reddit' : '👤 User'}
                      </p>
                    </div>
                    {post.external_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(post.external_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {post.image_url && (
                  <div className="px-6">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full rounded-lg object-cover max-h-96"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <CardContent className="pt-4">
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                </CardContent>

                <CardFooter className="flex gap-4">
                  <Button
                    variant={post.user_has_liked ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleLike(post.id, post.user_has_liked || false)}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                    {post.like_count || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comments
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
