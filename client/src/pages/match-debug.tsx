import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MatchDebug() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMatches = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/match');
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>BuddyMatch Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={fetchMatches} 
              disabled={loading}
              data-testid="button-fetch-matches"
            >
              {loading ? "Loading..." : "Find My Matches"}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded mb-4" data-testid="error-message">
              Error: {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                Found {results.length} matches
              </h2>
              <ul className="space-y-2">
                {results.map((m) => (
                  <li 
                    key={m.id} 
                    className="border p-4 rounded-lg bg-card"
                    data-testid={`match-card-${m.id}`}
                  >
                    <div className="font-semibold text-lg">{m.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded mr-2">
                        {m.metric_used}
                      </span>
                      <span className="inline-block bg-secondary px-2 py-1 rounded">
                        {m.compatibility}% match
                      </span>
                    </div>
                    <div className="mt-2 text-sm">{m.match_reason}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {m.location} • {m.sensor_class}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-muted-foreground text-center py-8" data-testid="empty-state">
              Click "Find My Matches" to see compatible riders
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <p className="text-sm text-muted-foreground">
          This page uses the authenticated <code className="bg-background px-1 py-0.5 rounded">/api/match</code> endpoint
          which applies the 4-tier matching hierarchy:
        </p>
        <ol className="text-sm text-muted-foreground mt-2 ml-4 list-decimal">
          <li>FTP w/kg (if both have weight & FTP)</li>
          <li>FTP watts (fallback when w/kg unavailable)</li>
          <li>Weekly hours (when FTP data missing)</li>
          <li>Avg speed (final fallback)</li>
        </ol>
      </div>
    </div>
  );
}
