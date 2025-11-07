import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Calendar, Clock, Users, Play, Loader2 } from "lucide-react";

const AdminEvent = () => {
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [startTime, setStartTime] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("name", "Winter ARC Chess")
        .single();

      if (event) {
        setEventData(event);
        if (event.start_time) {
          const date = new Date(event.start_time);
          setStartTime(date.toISOString().slice(0, 16));
        }
      }

      const { data: regs } = await supabase
        .from("event_registrations")
        .select("*, profiles(username, email)")
        .eq("event_name", "Winter ARC Chess")
        .order("created_at", { ascending: false });

      setRegistrations(regs || []);
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStartTime = async () => {
    if (!startTime) {
      toast({
        title: "Error",
        description: "Please select a start time",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ start_time: startTime })
        .eq("id", eventData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event start time updated",
      });
      fetchEventData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEvent = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "ongoing" })
        .eq("id", eventData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event started! Users can now join",
      });
      fetchEventData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleEndEvent = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "completed" })
        .eq("id", eventData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event ended",
      });
      fetchEventData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Management</h1>
            <p className="text-muted-foreground">Manage Winter ARC Chess event</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{registrations.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Event Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {eventData?.status?.replace("_", " ")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {eventData?.start_time 
                    ? new Date(eventData.start_time).toLocaleString()
                    : "Not set"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Controls</CardTitle>
              <CardDescription>Set event start time and control event status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Event Start Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={updating}
                  />
                  <Button onClick={handleUpdateStartTime} disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                {eventData?.status === "not_started" && (
                  <Button onClick={handleStartEvent} disabled={updating} className="gap-2">
                    <Play className="w-4 h-4" />
                    Start Event
                  </Button>
                )}
                {eventData?.status === "ongoing" && (
                  <Button onClick={handleEndEvent} disabled={updating} variant="destructive">
                    End Event
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>View all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="border-t">
                        <td className="p-3">{reg.full_name}</td>
                        <td className="p-3">{reg.email}</td>
                        <td className="p-3">{reg.phone_number}</td>
                        <td className="p-3">{new Date(reg.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminEvent;
