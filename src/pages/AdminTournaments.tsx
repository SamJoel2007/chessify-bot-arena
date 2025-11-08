import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  max_participants: number | null;
  status: string;
  created_at: string;
}

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    max_participants: "",
    status: "upcoming",
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tournamentData = {
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        status: formData.status,
      };

      if (editingTournament) {
        const { error } = await supabase
          .from("tournaments")
          .update(tournamentData)
          .eq("id", editingTournament.id);

        if (error) throw error;
        toast({ title: "Tournament updated successfully" });
      } else {
        const { error } = await supabase
          .from("tournaments")
          .insert([tournamentData]);

        if (error) throw error;
        toast({ title: "Tournament created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;

    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Tournament deleted successfully" });
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || "",
      start_date: tournament.start_date.split("T")[0],
      end_date: tournament.end_date ? tournament.end_date.split("T")[0] : "",
      max_participants: tournament.max_participants?.toString() || "",
      status: tournament.status,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      max_participants: "",
      status: "upcoming",
    });
    setEditingTournament(null);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-foreground">Tournament Management</h1>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tournament
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTournament ? "Edit Tournament" : "Create New Tournament"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTournament
                        ? "Update the tournament details below."
                        : "Fill in the details to create a new tournament."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Tournament Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="end_date">End Date</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="max_participants">Max Participants</Label>
                          <Input
                            id="max_participants"
                            type="number"
                            value={formData.max_participants}
                            onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        {editingTournament ? "Update" : "Create"} Tournament
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading tournaments...</p>
            ) : tournaments.length === 0 ? (
              <p className="text-muted-foreground">No tournaments yet. Create one to get started!</p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Max Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournaments.map((tournament) => (
                      <TableRow key={tournament.id}>
                        <TableCell className="font-medium">{tournament.name}</TableCell>
                        <TableCell>{format(new Date(tournament.start_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {tournament.end_date
                            ? format(new Date(tournament.end_date), "MMM dd, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>{tournament.max_participants || "Unlimited"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            tournament.status === "upcoming" ? "bg-blue-500/10 text-blue-500" :
                            tournament.status === "ongoing" ? "bg-green-500/10 text-green-500" :
                            tournament.status === "completed" ? "bg-gray-500/10 text-gray-500" :
                            "bg-red-500/10 text-red-500"
                          }`}>
                            {tournament.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tournament)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tournament.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
