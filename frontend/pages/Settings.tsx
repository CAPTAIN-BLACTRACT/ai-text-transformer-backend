import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { useAuth } from "../contexts/AuthContext";
import { Key, Save, ExternalLink } from "lucide-react";

export default function Settings() {
  const [llmApiKey, setLlmApiKey] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateKeyMutation = useMutation({
    mutationFn: (apiKey: string) => backend.auth.updateLLMKey({ llmApiKey: apiKey }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "LLM API key updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
    onError: (error: any) => {
      console.error("Failed to update API key:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!llmApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }
    updateKeyMutation.mutate(llmApiKey);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your AI Text Transformer settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>LLM API Configuration</span>
            </CardTitle>
            <CardDescription>
              Enter your OpenAI API key to enable text transformations. Your key is stored securely and only used for your transformations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llmApiKey">Your LLM API Key</Label>
                <Input
                  id="llmApiKey"
                  type="password"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder={user?.hasLLMKey ? "••••••••••••••••" : "Enter your OpenAI API key"}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    OpenAI Platform
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
              <Button
                type="submit"
                disabled={updateKeyMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateKeyMutation.isPending ? "Saving..." : "Save API Key"}
              </Button>
            </form>

            {user?.hasLLMKey && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ API key is configured and ready to use
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Commands</CardTitle>
            <CardDescription>
              These are the transformation commands available in the browser extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">summarize</h4>
                <p className="text-sm text-muted-foreground">
                  Creates a concise summary of the selected text
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">improve_writing</h4>
                <p className="text-sm text-muted-foreground">
                  Enhances clarity, fixes grammar, and improves professionalism
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">make_shorter</h4>
                <p className="text-sm text-muted-foreground">
                  Distills text to its core message, making it more concise
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">tone_professional</h4>
                <p className="text-sm text-muted-foreground">
                  Rewrites text in a formal, professional tone
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
