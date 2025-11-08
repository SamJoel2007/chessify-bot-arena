import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Trophy, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
                      onClick={() => toast.info("Download feature coming soon!")}
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
