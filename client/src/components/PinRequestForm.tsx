import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sendPinRequest } from '@/utils/sendPinRequest';
import { useToast } from '@/hooks/use-toast';

interface PinRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PinRequestForm({ open, onOpenChange }: PinRequestFormProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp.trim()) return;
    setIsSubmitting(true);
    
    const success = await sendPinRequest(whatsapp);
    if (success) {
      toast({
        title: "Request Sent",
        description: "You will receive the PIN on WhatsApp shortly.",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Request Failed",
        description: "Unable to send request. Please try again later.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Access PIN</DialogTitle>
          <DialogDescription>
            Enter your WhatsApp number. You'll receive the PIN via WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                placeholder="e.g., +2348012345678"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +234 for Nigeria)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
