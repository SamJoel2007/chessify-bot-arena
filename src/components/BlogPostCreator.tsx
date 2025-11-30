import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, Quote, Heading2, Heading3, X, Upload
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BlogPostCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = ["Openings", "Tactics", "Endgames", "Strategy", "Analysis", "Tips", "News"];

export const BlogPostCreator = ({ onSuccess, onCancel }: BlogPostCreatorProps) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("best chess openings for beginners, best chess openings for white, chess openings for beginners, best chess openings for black, chess openings for black");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFeaturedImage(null);
    setImagePreview(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const insertMarkdown = (syntax: string, placeholder: string = "") => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    let newText = "";
    let cursorOffset = 0;

    switch (syntax) {
      case "h2":
        newText = `\n## ${textToInsert}\n`;
        cursorOffset = 4;
        break;
      case "h3":
        newText = `\n### ${textToInsert}\n`;
        cursorOffset = 5;
        break;
      case "bold":
        newText = `**${textToInsert}**`;
        cursorOffset = 2;
        break;
      case "italic":
        newText = `*${textToInsert}*`;
        cursorOffset = 1;
        break;
      case "ul":
        newText = `\n- ${textToInsert}\n`;
        cursorOffset = 3;
        break;
      case "ol":
        newText = `\n1. ${textToInsert}\n`;
        cursorOffset = 4;
        break;
      case "link":
        newText = `[${textToInsert}](url)`;
        cursorOffset = textToInsert.length + 3;
        break;
      case "image":
        newText = `![${textToInsert}](image-url)`;
        cursorOffset = textToInsert.length + 4;
        break;
      case "quote":
        newText = `\n> ${textToInsert}\n`;
        cursorOffset = 3;
        break;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  const handleSubmit = async (status: "draft" | "pending_review") => {
    if (!title || !category || !excerpt || !content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      let imageUrl = null;
      if (featuredImage) {
        const fileExt = featuredImage.name.split(".").pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(`blog/${fileName}`, featuredImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(`blog/${fileName}`);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("blog_posts").insert({
        title,
        slug,
        category,
        tags,
        excerpt,
        content,
        meta_description: metaDescription || excerpt,
        meta_keywords: metaKeywords || tags.join(", "),
        featured_image_url: imageUrl,
        author_id: user.id,
        author_name: profile?.username || "Anonymous",
        status,
      });

      if (error) throw error;

      toast.success(
        status === "draft"
          ? "Draft saved successfully!"
          : "Article submitted for review successfully!"
      );
      onSuccess();
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast.error("Failed to create blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Create New Article</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter article title"
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tags (press Enter)"
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for SEO and preview"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="SEO meta description (optional, defaults to excerpt)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="Comma-separated keywords (optional)"
            />
          </div>

          <div>
            <Label>Featured Image</Label>
            {imagePreview ? (
              <div className="relative mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Image</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Column - Editor */}
        <div className="space-y-4">
          <Label>Content * (Markdown)</Label>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("h2", "Heading")}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("h3", "Subheading")}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("bold", "bold text")}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("italic", "italic text")}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("ul", "list item")}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("ol", "list item")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("link", "link text")}
              title="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("image", "alt text")}
              title="Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("quote", "quote")}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Editor Tabs */}
          <Tabs defaultValue="write" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-2">
              <Textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content in Markdown..."
                rows={20}
                className="font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-2">
              <div className="prose max-w-none p-4 border rounded-lg min-h-[500px] bg-card">
                <ReactMarkdown>{content || "*Preview will appear here...*"}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit("draft")}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("pending_review")} disabled={isSubmitting}>
          Submit for Review
        </Button>
      </div>
    </div>
  );
};
