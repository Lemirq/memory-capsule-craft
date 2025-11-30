import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Lightbulb, Sparkles, Target } from "lucide-react";
import { JournalAnalysis } from "@/lib/llm-service";

interface InsightsDisplayProps {
  analysis: JournalAnalysis;
}

export function InsightsDisplay({ analysis }: InsightsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-primary">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Emotional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Heart className="mr-2 h-5 w-5 text-rose-500" />
              Emotional Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mood</span>
                <span className="font-bold">{analysis.mood}/10</span>
              </div>
              <Progress value={analysis.mood * 10} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Stress Level</span>
                <span className="font-bold">{analysis.stress}/10</span>
              </div>
              <Progress value={analysis.stress * 10} className="h-2 bg-secondary" indicatorClassName="bg-orange-400" />
            </div>
            <div className="pt-2">
              <span className="text-sm text-muted-foreground">Dominant Emotion:</span>
              <div className="mt-1 text-lg font-medium text-primary">
                {analysis.emotion}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Themes & Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Brain className="mr-2 h-5 w-5 text-indigo-500" />
              Themes & Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2">
                {analysis.themes.map((theme, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
            {analysis.growth_signal && (
              <div className="flex items-start p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                <Target className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
                <p className="text-sm">
                  This entry indicates a moment of personal growth or realization.
                </p>
              </div>
            )}
            {analysis.gratitude && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Gratitude:</span>
                <p className="text-sm italic">"{analysis.gratitude}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reflections & Suggestions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
              Reflections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 list-disc pl-4 text-sm text-muted-foreground">
              {analysis.reflection_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 list-disc pl-4 text-sm text-muted-foreground">
              {analysis.tomorrow_suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
