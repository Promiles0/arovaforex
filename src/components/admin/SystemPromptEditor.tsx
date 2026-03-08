import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RotateCcw, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

export function SystemPromptEditor() {
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("assistant_config" as any)
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        const d = data as any;
        setPrompt(d.system_prompt || "");
        setOriginalPrompt(d.system_prompt || "");
        setConfigId(d.id);
        setLastUpdated(d.updated_at);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load system prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!configId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("assistant_config" as any)
        .update({
          system_prompt: prompt,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", configId);

      if (error) throw error;
      setOriginalPrompt(prompt);
      setLastUpdated(new Date().toISOString());
      toast.success("System prompt updated! Changes take effect immediately.");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save system prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(originalPrompt);
  };

  const hasChanges = prompt !== originalPrompt;
  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const charCount = prompt.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            System Prompt
          </CardTitle>
          <CardDescription>
            Customize the AI assistant's personality, knowledge, and behavior. Changes take effect immediately for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the system prompt..."
            className="min-h-[400px] font-mono text-sm"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
              {lastUpdated && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last saved: {format(new Date(lastUpdated), "MMM d, yyyy HH:mm")}
                </span>
              )}
            </div>
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Discard Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save & Apply"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt Writing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Define the assistant's <strong className="text-foreground">personality</strong> clearly (tone, style, emoji usage)</li>
            <li>• List all <strong className="text-foreground">platform features</strong> the assistant should know about</li>
            <li>• Specify <strong className="text-foreground">boundaries</strong> — what the assistant should NOT do (e.g., financial advice)</li>
            <li>• Include <strong className="text-foreground">formatting guidelines</strong> for consistent responses</li>
            <li>• Add <strong className="text-foreground">escalation paths</strong> (e.g., "direct to support@arovaforex.com")</li>
            <li>• Keep the prompt under 2000 words for optimal performance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
