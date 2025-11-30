"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSettings, getSettings } from "@/lib/storage";

export default function SettingsPage() {
  const [craftToken, setCraftToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    if (settings) {
      setCraftToken(settings.craftToken);
      setOpenaiKey(settings.openaiKey);
    }
  }, []);

  const handleSave = () => {
    saveSettings({ craftToken, openaiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API keys to connect Memory Capsule with Craft and AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Your keys are stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="craft-token" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Craft API Token
            </label>
            <Input
              id="craft-token"
              type="password"
              placeholder="sk-..."
              value={craftToken}
              onChange={(e) => setCraftToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get this from the Craft Developer Portal.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="openai-key" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              OpenAI API Key
            </label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for generating insights.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
