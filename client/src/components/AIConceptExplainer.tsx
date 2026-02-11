import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, Loader2, BookOpen, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { explainConcept, type ConceptExplanationResponse } from "@/services/mentorApi";

interface AIConceptExplainerProps {
    concept: string;
    skill?: string;
    onClose: () => void;
}

/**
 * AI Concept Explainer Modal
 * 
 * Provides simple, level-appropriate explanations of complex concepts
 * using the AI Mentor's knowledge.
 */
export function AIConceptExplainer({ concept, skill, onClose }: AIConceptExplainerProps) {
    const [explanation, setExplanation] = React.useState<ConceptExplanationResponse | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadExplanation();
    }, [concept, skill]);

    async function loadExplanation() {
        setLoading(true);

        try {
            const data = await explainConcept(concept, skill);
            setExplanation(data);
        } catch (error) {
            console.error("Failed to load explanation:", error);
            setExplanation({
                concept,
                explanation: "This concept builds on your existing knowledge. Break it down into smaller steps and practice regularly to master it.",
                examples: []
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
                    initial={{ scale: 0.95, x: 300 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0.95, x: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                    <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
                                    <Sparkles className="h-4 w-4" />
                                    AI Mentor Explains
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">{concept}</h2>
                                {skill && (
                                    <p className="text-sm text-slate-500 mt-1">Part of {skill}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-xl p-2 hover:bg-slate-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-16">
                                <div className="relative">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                                    <Sparkles className="h-5 w-5 text-amber-500 absolute top-0 right-0 animate-pulse" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">
                                    Your mentor is preparing a simple explanation...
                                </p>
                            </div>
                        ) : explanation ? (
                            <div className="space-y-6">
                                {/* Main Explanation */}
                                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="rounded-xl bg-blue-900 p-2">
                                            <BookOpen className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-blue-900 mb-2">In Simple Terms</h3>
                                        </div>
                                    </div>
                                    <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                        {explanation.explanation}
                                    </div>
                                </div>

                                {/* Examples */}
                                {explanation.examples.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                                            <Lightbulb className="h-4 w-4 text-amber-500" />
                                            Practical Examples
                                        </div>
                                        <div className="space-y-3">
                                            {explanation.examples.map((example, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl bg-slate-50 border border-slate-200 p-4"
                                                >
                                                    <p className="text-sm text-slate-700">{example}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <div className="pt-4">
                                    <Button
                                        onClick={onClose}
                                        className="w-full rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800"
                                    >
                                        Got It!
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
