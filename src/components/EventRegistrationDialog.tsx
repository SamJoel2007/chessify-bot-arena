import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

interface EventRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export const EventRegistrationDialog = ({
  isOpen,
  onClose,
  userId,
}: EventRegistrationDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      checkExistingRegistration();
    }
  }, [isOpen, userId]);

  const checkExistingRegistration = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("user_id", userId)
      .eq("event_name", "Winter ARC Chess")
      .single();

    if (data && !error) {
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

    if (isAlreadyRegistered) {
      toast.info("You are already registered for this event");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("event_registrations")
      .insert({
        user_id: userId,
        event_name: "Winter ARC Chess",
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
      });

    setIsLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("You are already registered for this event");
        setIsAlreadyRegistered(true);
      } else {
        toast.error("Failed to register. Please try again.");
      }
    } else {
      toast.success("Successfully registered for Winter ARC Chess!");
      setIsAlreadyRegistered(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-gold" />
            <DialogTitle className="text-2xl">Winter ARC Chess Registration</DialogTitle>
          </div>
        </DialogHeader>

        {isAlreadyRegistered ? (
          <div className="py-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Already Registered!</h3>
              <p className="text-muted-foreground">
                You're all set for Winter ARC Chess event.
              </p>
            </div>
            <div className="space-y-3 bg-muted/50 rounded-lg p-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{phoneNumber}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Now"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
