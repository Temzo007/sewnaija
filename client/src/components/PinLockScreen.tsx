import { useState } from 'react';
import { validateTimePin } from '@/utils/timePin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Small timeout to allow UI update
    setTimeout(() => {
      if (validateTimePin(pin)) {
        // Mark the app as unlocked permanently
        localStorage.setItem('app_unlocked', 'true');
        onUnlock();
      } else {
        setError(true);
        setPin('');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-none shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <LockKeyhole className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold">Access Required</CardTitle>
          <CardDescription className="text-base">
            Enter the setup PIN provided by your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setError(false);
                }}
                className="text-center text-2xl tracking-[0.5em] h-14"
                placeholder="••••••••••"
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-destructive mt-2 text-center">
                  Incorrect PIN. Please try again.
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={pin.length !== 10 || loading}
            >
              {loading ? 'Verifying...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
