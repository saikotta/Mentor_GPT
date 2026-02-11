import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, TrendingUp, Lightbulb, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQuizFeedback, type QuizFeedbackResponse } from "@/services/mentorApi";

interface AIQuizFeedbackProps {
    skill: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    weakTopics: string[];
    onClose: () => void;
}

/**
 * AI-Powered Quiz Feedback Modal
 * 
 * Displays personalized feedback from the AI Mentor after completing a quiz.
 * Provides encouragement, specific insights, and actionable next steps.
 */
export function AIQuizFeedback({
    skill,
    score,
    correctCount,
    totalQuestions,
    weakTopics,
    onClose
}: AIQuizFeedbackProps) {
    const [feedback, setFeedback] = React.useState<QuizFeedbackResponse | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadFeedback();
    }, []);

    async function loadFeedback() {
        setLoading(true);

        try {
            const data = await getQuizFeedback({
                skill,
                score,
                correctCount,
                totalQuestions,
                weakTopics
            });
            setFeedback(data);
        } catch (error) {
            console.error("Failed to load feedback:", error);
            // Use fallback feedback
            setFeedback({
                feedback: "Review the questions you missed and practice similar problems to strengthen your understanding.",
                encouragement: score >= 60 ? "Good progress!" : "Keep practicing!",
                nextSteps: [
                    "Review incorrect questions",
                    "Practice more exercises",
                    "Try the quiz again"
                ]
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl"
                >
                    <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                    AI Mentor Feedback
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {skill} Assessment Results
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-xl p-2 hover:bg-slate-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Score Display */}
                        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-slate-600 mb-1">Your Score</div>
                                    <div className="text-4xl font-bold text-blue-900">{score}%</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {correctCount} out of {totalQuestions} correct
                                    </div>
                                </div>
                                <div className="h-16 w-16 rounded-full bg-blue-900 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center gap-3 py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <span className="text-sm font-medium text-slate-600">
                                    Your mentor is reviewing your performance...
                                </span>
                            </div>
                        ) : feedback ? (
                            <div className="space-y-6">
                                {/* Encouragement */}
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                                    <Badge className="bg-emerald-600 text-white mb-3">
                                        {feedback.encouragement}
                                    </Badge>
                                    <p className="text-sm leading-relaxed text-slate-700">
                                        {feedback.feedback}
                                    </p>
                                </div>

                                {/* Next Steps */}
                                {feedback.nextSteps.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                            Recommended Next Steps
                                        </div>
                                        <div className="space-y-2">
                                            {feedback.nextSteps.map((step, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                                                >
                                                    <div className="rounded-lg bg-blue-100 p-1.5">
                                                        <Lightbulb className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-700 flex-1">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={onClose}
                                        className="flex-1 rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800"
                                    >
                                        Continue Learning
                                    </Button>
                                    <Button
                                        onClick={() => window.location.reload()}
                                        variant="outline"
                                        className="rounded-2xl font-bold"
                                    >
                                        Retake Quiz
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
