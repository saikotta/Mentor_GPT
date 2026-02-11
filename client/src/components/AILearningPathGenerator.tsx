import * as React from "react";
import { Wand2, Calendar, Target, CheckCircle2, Loader2, AlertCircle, Sparkles, Play } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateLearningPath, type LearningPathResponse } from "@/services/mentorApi";

/**
 * AI Learning Path Generator
 * 
 * Generates and displays a personalized 12-week learning roadmap
 * tailored to the user's current skills and target role.
 */
export function AILearningPathGenerator() {
    const [, setLocation] = useLocation();
    const [path, setPath] = React.useState<LearningPathResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function handleGenerate() {
        setLoading(true);
        setError(null);

        try {
            const data = await generateLearningPath();
            setPath(data);
        } catch (err: any) {
            console.error("Failed to generate path:", err);
            setError(err.message || "Unable to generate learning path");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Generator Card */}
            <Card className="rounded-3xl border-slate-200 bg-gradient-to-br from-blue-900 to-indigo-600 p-8 text-white shadow-2xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">
                    <Sparkles className="h-4 w-4" />
                    AI-Powered Roadmap
                </div>

                <h2 className="text-2xl font-bold mb-3">Generate Your Learning Path</h2>
                <p className="text-sm text-blue-100 mb-6">
                    Let your AI mentor analyze your skills and create a personalized 12-week roadmap
                    aligned with your target role.
                </p>

                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full rounded-2xl bg-white text-blue-900 font-bold hover:bg-blue-50 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Your Skills...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate My Roadmap
                        </>
                    )}
                </Button>

                {error && (
                    <div className="mt-4 rounded-xl bg-white/10 border border-white/20 p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-300 flex-shrink-0" />
                        <p className="text-sm text-blue-100">{error}</p>
                    </div>
                )}
            </Card>

            {/* Generated Path */}
            {path && (
                <div className="space-y-6">
                    {/* Focus Summary */}
                    <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-blue-50 p-3">
                                <Target className="h-6 w-6 text-blue-900" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Your Learning Focus</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                    {path.focus}
                                </p>
                                {path.rationale && (
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500 italic">
                                            <strong>Why this path:</strong> {path.rationale}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Weekly Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-900" />
                            <h3 className="text-lg font-bold text-slate-900">Week-by-Week Plan</h3>
                        </div>

                        <div className="grid gap-4">
                            {path.weeklyPlan.slice(0, 4).map((week) => (
                                <Card key={week.week} className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <Badge className="rounded-full bg-blue-100 text-blue-900 mb-2">
                                                Week {week.week}
                                            </Badge>
                                            <h4 className="text-base font-bold text-slate-900">{week.focus}</h4>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="rounded-xl bg-blue-900 text-white hover:bg-blue-800"
                                            onClick={() => setLocation(`/learning/week/${week.week}`)}
                                        >
                                            <Play className="h-3 w-3 mr-2 fill-current" />
                                            Start Week
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {week.tasks.map((task, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-slate-600">{task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {path.weeklyPlan.length > 4 && (
                            <Card className="rounded-2xl border-slate-200 bg-slate-50 p-6 text-center">
                                <p className="text-sm text-slate-600">
                                    <strong>{path.weeklyPlan.length - 4} more weeks</strong> planned for your learning journey
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
