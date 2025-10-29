import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuth");
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">Welcome to the admin control panel</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-primary">0</p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Total Posts</h3>
                <p className="text-3xl font-bold text-secondary">0</p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Chat Messages</h3>
                <p className="text-3xl font-bold text-accent">0</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
