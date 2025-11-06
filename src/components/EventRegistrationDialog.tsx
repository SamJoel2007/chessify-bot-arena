import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export const EventRegistrationDialog = ({ isOpen, onClose, userId }: EventRegistrationDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      checkIfRegistered();
    }
  }, [isOpen, userId]);

  const checkIfRegistered = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("user_id", userId)
      .eq("event_name", "Winter ARC Chess")
      .single();

    if (data) {
      setIsAlreadyRegistered(true);
      setFullName(data.full_name);
      setEmail(data.email);
      setPhoneNumber(data.phone_number);
    } else {
      setIsAlreadyRegistered(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error("Please sign in to register");
      return;
    }

    if (!fullName || !email || !phoneNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("event_registrations")
        .insert({
          user_id: userId,
          event_name: "Winter ARC Chess",
          full_name: fullName,
          email: email,
          phone_number: phoneNumber,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("You are already registered for this event");
          setIsAlreadyRegistered(true);
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully registered for Winter ARC Chess!");
        setIsAlreadyRegistered(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Winter ARC Chess Registration</DialogTitle>
          <DialogDescription>
            {isAlreadyRegistered 
              ? "You are already registered for this event!" 
              : "Enter your details to register for the tournament"}
          </DialogDescription>
        </DialogHeader>
        
        {isAlreadyRegistered ? (
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{fullName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone Number</Label>
                <p className="font-medium">{phoneNumber}</p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full mt-6">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register Now"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
