import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

interface AnalysisResultProps {
  result: {
    disease_name: string;
    severity_percentage: number;
    confidence_score: number;
    recommendations: string;
    plant_type: string;
  };
}

const AnalysisResult = ({ result }: AnalysisResultProps) => {
  const getSeverityColor = (severity: number) => {
    if (severity === 0) return "text-green-600 dark:text-green-400";
    if (severity < 25) return "text-yellow-600 dark:text-yellow-400";
    if (severity < 50) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 0) return { label: "Healthy", variant: "default" as const };
    if (severity < 25) return { label: "Mild", variant: "secondary" as const };
    if (severity < 50) return { label: "Moderate", variant: "secondary" as const };
    return { label: "Severe", variant: "destructive" as const };
  };

  const plantEmoji = {
    tomato: "🍅",
    potato: "🥔",
    pepper_bell: "🌶️"
  }[result.plant_type] || "🌿";

  const severityBadge = getSeverityBadge(result.severity_percentage);

  return (
    <Card className="p-6 space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            {result.severity_percentage === 0 ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-600" />
            )}
            Analysis Results
          </h2>
          <span className="text-3xl">{plantEmoji}</span>
        </div>

        {/* Disease Name */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Detected Disease</span>
            <Badge variant={severityBadge.variant}>{severityBadge.label}</Badge>
          </div>
          <p className="text-2xl font-bold text-foreground">{result.disease_name}</p>
        </div>

        {/* Severity Percentage */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Infection Severity</span>
            <span className={`text-2xl font-bold ${getSeverityColor(result.severity_percentage)}`}>
              {result.severity_percentage}%
            </span>
          </div>
          <Progress value={result.severity_percentage} className="h-3" />
        </div>

        {/* Confidence Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Confidence Score
            </span>
            <span className="text-xl font-semibold">{result.confidence_score.toFixed(1)}%</span>
          </div>
          <Progress value={result.confidence_score} className="h-2" />
        </div>

        {/* Recommendations */}
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            💡 Recommendations
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.recommendations}</p>
        </div>
      </div>
    </Card>
  );
};

export default AnalysisResult;
