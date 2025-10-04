import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function MatchConsole() {
  const [ftpWatts, setFtpWatts] = useState(250);
  const [weightKg, setWeightKg] = useState(70);
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const findMatches = async () => {
    setLoading(true);
    setError("");
    
    const body = {
      ftp_watts: ftpWatts,
      weight_kg: weightKg,
      weekly_hours: weeklyHours
    };

    try {
      const res = await fetch(`/api/match/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

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
          <CardTitle>BuddyMatch Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="ftp-watts">FTP (watts)</Label>
              <Input
                id="ftp-watts"
                type="number"
                value={ftpWatts}
                onChange={(e) => setFtpWatts(Number(e.target.value))}
                data-testid="input-ftp-watts"
              />
            </div>
            <div>
              <Label htmlFor="weight-kg">Weight (kg)</Label>
              <Input
                id="weight-kg"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                data-testid="input-weight-kg"
              />
            </div>
            <div>
              <Label htmlFor="weekly-hours">Weekly Hours</Label>
              <Input
                id="weekly-hours"
                type="number"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                data-testid="input-weekly-hours"
              />
            </div>
          </div>

          <Button 
            onClick={findMatches} 
            disabled={loading}
            data-testid="button-find-matches"
          >
            {loading ? "Finding..." : "Find My Matches"}
          </Button>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded mt-4" data-testid="error-message">
              Error: {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 space-y-3">
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
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-muted-foreground text-center py-8" data-testid="empty-state">
              Enter your stats and click "Find My Matches" to see compatible riders
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How it works</h3>
        <p className="text-sm text-muted-foreground">
          This console simulates the matching algorithm with your custom parameters.
          The matching hierarchy applies: FTP w/kg → FTP watts → Weekly hours
        </p>
      </div>
    </div>
  );
}
