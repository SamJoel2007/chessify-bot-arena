import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export const RecentPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        (payload) => {
          if (payload.new && "post_id" in payload.new) {
            fetchComments(payload.new.post_id as string);
          }
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          const { count: likesCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { count: commentsCount } = await supabase
            .from("post_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          let userLiked = false;
          if (currentUserId) {
            const { data: likeData } = await supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", currentUserId)
              .single();
            userLiked = !!likeData;
          }

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_liked: userLiked,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error: any) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments((prev) => ({ ...prev, [postId]: data || [] }));
    } catch (error: any) {
      toast.error("Failed to load comments");
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!currentUserId) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: currentUserId });

        if (error) throw error;
      }
      fetchPosts();
    } catch (error: any) {
      toast.error("Failed to update like");
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      fetchComments(postId);
    }
  };

  const submitComment = async (postId: string) => {
    if (!currentUserId) {
      toast.error("Please sign in to comment");
      return;
    }

    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, user_id: currentUserId, content });

      if (error) throw error;

      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
      toast.success("Comment added");
    } catch (error: any) {
      toast.error("Failed to add comment");
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading posts...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No posts yet. Admins can create posts to share updates!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="p-6 bg-gradient-card border-border/50">
          <h3 className="text-2xl font-bold mb-2">{post.title}</h3>
          <p className="text-muted-foreground mb-4">{post.content}</p>
          <div className="text-xs text-muted-foreground mb-4">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </div>

          <div className="flex gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => toggleLike(post.id, post.user_liked)}
            >
              <Heart
                className={`w-5 h-5 ${post.user_liked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span>{post.likes_count}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => toggleComments(post.id)}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count}</span>
            </Button>
          </div>

          {expandedPost === post.id && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div className="space-y-3">
                {comments[post.id]?.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded bg-muted/30 border border-border/30"
                  >
                    <p className="text-sm">{comment.content}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment[post.id] || ""}
                  onChange={(e) =>
                    setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  className="flex-1"
                  rows={2}
                />
                <Button
                  size="icon"
                  onClick={() => submitComment(post.id)}
                  disabled={!newComment[post.id]?.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};