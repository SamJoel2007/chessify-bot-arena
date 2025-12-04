import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, X, Save, Loader2, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PageSEO {
  id: string;
  page_path: string;
  page_name: string;
  keywords: string[];
  meta_description: string | null;
  meta_title: string | null;
  updated_at: string;
}

export default function AdminSEO() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageSEO | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for editing
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editMetaDescription, setEditMetaDescription] = useState("");
  const [editMetaTitle, setEditMetaTitle] = useState("");

  // New page form
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPagePath, setNewPagePath] = useState("");
  const [newPageName, setNewPageName] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "admin") {
      navigate("/admin/login");
      return;
    }

    fetchPages();
  };

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_seo_settings")
      .select("*")
      .order("page_name");

    if (error) {
      toast.error("Failed to fetch SEO settings");
      console.error(error);
    } else {
      setPages(data || []);
    }
    setLoading(false);
  };

  const selectPage = (page: PageSEO) => {
    setSelectedPage(page);
    setEditKeywords(page.keywords || []);
    setEditMetaDescription(page.meta_description || "");
    setEditMetaTitle(page.meta_title || "");
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (editKeywords.includes(newKeyword.trim().toLowerCase())) {
      toast.error("Keyword already exists");
      return;
    }
    setEditKeywords([...editKeywords, newKeyword.trim().toLowerCase()]);
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    setEditKeywords(editKeywords.filter(k => k !== keyword));
  };

  const savePage = async () => {
    if (!selectedPage) return;

    setSaving(selectedPage.id);
    const { error } = await supabase
      .from("page_seo_settings")
      .update({
        keywords: editKeywords,
        meta_description: editMetaDescription || null,
        meta_title: editMetaTitle || null,
      })
      .eq("id", selectedPage.id);

    if (error) {
      toast.error("Failed to save SEO settings");
      console.error(error);
    } else {
      toast.success("SEO settings saved successfully");
      fetchPages();
      setSelectedPage({
        ...selectedPage,
        keywords: editKeywords,
        meta_description: editMetaDescription,
        meta_title: editMetaTitle,
      });
    }
    setSaving(null);
  };

  const addNewPage = async () => {
    if (!newPagePath.trim() || !newPageName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from("page_seo_settings")
      .insert({
        page_path: newPagePath.trim(),
        page_name: newPageName.trim(),
        keywords: [],
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("A page with this path already exists");
      } else {
        toast.error("Failed to add page");
        console.error(error);
      }
    } else {
      toast.success("Page added successfully");
      setShowAddPage(false);
      setNewPagePath("");
      setNewPageName("");
      fetchPages();
    }
  };

  const deletePage = async (pageId: string) => {
    const { error } = await supabase
      .from("page_seo_settings")
      .delete()
      .eq("id", pageId);

    if (error) {
      toast.error("Failed to delete page");
      console.error(error);
    } else {
      toast.success("Page deleted successfully");
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
      }
      fetchPages();
    }
  };

  const filteredPages = pages.filter(page =>
    page.page_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">SEO Management</h1>
                <p className="text-muted-foreground">Manage keywords and meta tags for each page</p>
              </div>
              <Button onClick={() => setShowAddPage(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Page
              </Button>
            </div>

            {/* Add Page Form */}
            {showAddPage && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Page Path</label>
                      <Input
                        value={newPagePath}
                        onChange={(e) => setNewPagePath(e.target.value)}
                        placeholder="/example-page"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Page Name</label>
                      <Input
                        value={newPageName}
                        onChange={(e) => setNewPageName(e.target.value)}
                        placeholder="Example Page"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addNewPage}>Add Page</Button>
                    <Button variant="outline" onClick={() => setShowAddPage(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pages List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Pages
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search pages..."
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredPages.map((page) => (
                          <div
                            key={page.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                              selectedPage?.id === page.id
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-muted border-transparent"
                            }`}
                            onClick={() => selectPage(page)}
                          >
                            <div className="font-medium">{page.page_name}</div>
                            <div className="text-sm text-muted-foreground">{page.page_path}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {page.keywords?.length || 0} keywords
                            </div>
                          </div>
                        ))}
                        {filteredPages.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">No pages found</p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Page Editor */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedPage ? `Edit: ${selectedPage.page_name}` : "Select a page"}
                  </CardTitle>
                  {selectedPage && (
                    <CardDescription>
                      Path: {selectedPage.page_path}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedPage ? (
                    <div className="space-y-6">
                      {/* Meta Title */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Meta Title</label>
                        <Input
                          value={editMetaTitle}
                          onChange={(e) => setEditMetaTitle(e.target.value)}
                          placeholder="Page title for search engines..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {editMetaTitle.length}/60 characters (recommended)
                        </p>
                      </div>

                      {/* Meta Description */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Meta Description</label>
                        <Textarea
                          value={editMetaDescription}
                          onChange={(e) => setEditMetaDescription(e.target.value)}
                          placeholder="Brief description for search engines..."
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {editMetaDescription.length}/160 characters (recommended)
                        </p>
                      </div>

                      {/* Keywords */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Keywords</label>
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add a keyword..."
                            onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                          />
                          <Button onClick={addKeyword} variant="outline">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editKeywords.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive/20 transition-colors"
                              onClick={() => removeKeyword(keyword)}
                            >
                              {keyword}
                              <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                          {editKeywords.length === 0 && (
                            <p className="text-sm text-muted-foreground">No keywords added yet</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={savePage} disabled={saving === selectedPage.id}>
                          {saving === selectedPage.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deletePage(selectedPage.id)}
                        >
                          Delete Page
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a page from the list to edit its SEO settings</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}