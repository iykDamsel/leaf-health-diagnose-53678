import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { History, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryItem {
  id: string;
  plant_type: string;
  disease_name: string;
  severity_percentage: number;
  confidence_score: number;
  created_at: string;
}

const AnalysisHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('disease_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const plantEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      tomato: "🍅",
      potato: "🥔",
      pepper_bell: "🌶️"
    };
    return emojis[type] || "🌿";
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 0) return { label: "Healthy", variant: "default" as const };
    if (severity < 25) return { label: "Mild", variant: "secondary" as const };
    if (severity < 50) return { label: "Moderate", variant: "secondary" as const };
    return { label: "Severe", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">No analysis history yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <History className="w-6 h-6 text-primary" />
        Recent Analyses
      </h2>
      
      <div className="space-y-4">
        {history.map((item) => {
          const badge = getSeverityBadge(item.severity_percentage);
          
          return (
            <div
              key={item.id}
              className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{plantEmoji(item.plant_type)}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{item.disease_name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {item.plant_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              
              <div className="flex items-center justify-between mt-3 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Severity: <span className="font-semibold text-foreground">{item.severity_percentage}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    Confidence: <span className="font-semibold text-foreground">{item.confidence_score}%</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AnalysisHistory;
