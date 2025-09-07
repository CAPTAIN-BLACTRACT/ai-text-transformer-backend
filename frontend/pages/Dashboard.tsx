import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import backend from "~backend/client";
import { useAuth } from "../contexts/AuthContext";
import { Activity, FileText, Clock, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => backend.auth.getStats(),
  });

  const formatCommand = (command: string) => {
    return command.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.email}! Here's your transformation activity.
          </p>
        </div>

        {!user?.hasLLMKey && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">
                  <strong>Setup Required:</strong> Please configure your LLM API key in{" "}
                  <a href="/settings" className="underline">Settings</a> to start using transformations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transformations</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTransformations || 0}</div>
              <p className="text-xs text-muted-foreground">
                All-time text transformations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.hasLLMKey ? "Ready" : "Setup Required"}
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.hasLLMKey ? "LLM API key configured" : "LLM API key needed"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transformations</CardTitle>
            <CardDescription>Your last 5 text transformations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentTransformations && stats.recentTransformations.length > 0 ? (
              <div className="space-y-4">
                {stats.recentTransformations.map((transformation) => (
                  <div
                    key={transformation.id}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {formatCommand(transformation.command)}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(transformation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Original:</p>
                        <p className="text-sm bg-muted p-2 rounded">
                          {truncateText(transformation.selectedText)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transformed:</p>
                        <p className="text-sm bg-muted p-2 rounded">
                          {truncateText(transformation.transformedText)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No transformations yet</h3>
                <p className="text-muted-foreground">
                  Start using the browser extension to see your transformations here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
