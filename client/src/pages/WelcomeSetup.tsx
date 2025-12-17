import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/db";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Ruler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { INITIAL_DEFAULT_MEASUREMENTS } from "@/lib/types";

export default function WelcomeSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState(INITIAL_DEFAULT_MEASUREMENTS);
  const [newMeasure, setNewMeasure] = useState("");

  const handleSave = () => {
    db.setDefaultMeasurements(measurements);
    db.setSetupComplete(true);
    toast({ title: "Setup Complete", description: "Your tailoring preferences have been saved!" });
    setLocation("/");
  };

  const addMeasurement = () => {
    if (newMeasure.trim()) {
      setMeasurements([...measurements, { name: newMeasure, value: '' }]);
      setNewMeasure("");
    }
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-none shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Ruler className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold">Welcome to SewNaija</CardTitle>
          <CardDescription className="text-base">
            Let's set up your workspace. What measurements do you normally take for your customers?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-muted/30 p-4 rounded-lg space-y-3 max-h-[40vh] overflow-y-auto">
            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Default Measurements List</Label>
            {measurements.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between bg-card p-3 rounded-md border shadow-sm group">
                <span className="font-medium">{m.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                  onClick={() => removeMeasurement(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder="Add another (e.g. Neck Depth)" 
              value={newMeasure}
              onChange={(e) => setNewMeasure(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMeasurement()}
            />
            <Button onClick={addMeasurement} variant="outline" size="icon">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <Button onClick={handleSave} className="w-full h-12 text-lg font-semibold shadow-md mt-4">
            Save & Get Started <CheckCircle2 className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
