import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(5000, "Content must be less than 5000 characters"),
});

export const AdminPostCreator = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      postSchema.parse({ title, content });
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please sign in to create posts");
        return;
      }

      const { error } = await supabase.from("posts").insert({
        title,
        content,
        author_id: session.user.id,
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to create post");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="p-6 mb-6 bg-gradient-card border-border/50">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New Post
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Post Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Post Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setContent("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};