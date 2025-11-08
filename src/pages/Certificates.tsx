import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Trophy, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";

interface Certificate {
  id: string;
  certificate_name: string;
  bot_defeated: string;
  bot_rating: number;
  earned_at: string;
  certificate_data: any;
}

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchCertificates(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const fetchCertificates = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadCertificate = async (cert: Certificate) => {
    try {
      // Create a temporary certificate element
      const certElement = document.createElement("div");
      certElement.style.width = "800px";
      certElement.style.padding = "60px";
      certElement.style.background = "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.1))";
      certElement.style.border = "8px solid hsl(var(--primary))";
      certElement.style.fontFamily = "system-ui, -apple-system, sans-serif";
      certElement.style.position = "absolute";
      certElement.style.left = "-9999px";
      
      certElement.innerHTML = `
        <div style="text-align: center; color: hsl(var(--foreground));">
          <div style="margin-bottom: 30px;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" stroke-width="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </div>
          <h1 style="font-size: 48px; font-weight: bold; margin-bottom: 20px; color: hsl(var(--primary));">
            Certificate of Achievement
          </h1>
          <div style="font-size: 20px; margin-bottom: 40px; color: hsl(var(--muted-foreground));">
            This certifies that
          </div>
          <div style="font-size: 36px; font-weight: bold; margin-bottom: 40px; color: hsl(var(--foreground));">
            ${user?.email || 'Chess Player'}
          </div>
          <div style="font-size: 20px; margin-bottom: 20px; line-height: 1.6; color: hsl(var(--muted-foreground));">
            has successfully defeated
          </div>
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px; color: hsl(var(--primary));">
            ${cert.bot_defeated}
          </div>
          <div style="font-size: 18px; margin-bottom: 40px; color: hsl(var(--muted-foreground));">
            Rating: ${cert.bot_rating} ELO
          </div>
          <div style="border-top: 2px solid hsl(var(--border)); padding-top: 30px; margin-top: 40px;">
            <div style="font-size: 16px; color: hsl(var(--muted-foreground));">
              ${cert.certificate_name}
            </div>
            <div style="font-size: 14px; margin-top: 10px; color: hsl(var(--muted-foreground));">
              Earned on ${formatDate(cert.earned_at)}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(certElement);
      
      // Generate canvas
      const canvas = await html2canvas(certElement, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      
      // Remove temporary element
      document.body.removeChild(certElement);
      
      // Download
      const link = document.createElement("a");
      link.download = `certificate-${cert.bot_defeated}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/90 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              My Certificates
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Certificates Yet</h2>
            <p className="text-muted-foreground mb-6">
              Defeat special bots to earn exclusive certificates!
            </p>
            <Button onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card
                key={cert.id}
                className="overflow-hidden bg-gradient-card border-primary/30 hover:border-primary/50 transition-all hover:shadow-glow"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Trophy className="w-12 h-12 text-gold" />
                    <Badge variant="secondary" className="text-xs">
                      {cert.bot_rating} ELO
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                      {cert.certificate_name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Defeated <span className="font-semibold text-foreground">{cert.bot_defeated}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Earned on {formatDate(cert.earned_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => downloadCertificate(cert)}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      Achievement Unlocked
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Certificates;
