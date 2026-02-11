/**
 * AI Mentor API Service
 * 
 * Provides typed functions to interact with AI-powered backend endpoints.
 * All functions handle errors gracefully and return structured responses.
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface MentorChatResponse {
    reply: string;
    timestamp: string;
}

export interface LearningPathResponse {
    focus: string;
    weeklyPlan: Array<{
        week: number;
        focus: string;
        tasks: string[];
    }>;
    rationale: string;
}

export interface QuizFeedbackResponse {
    feedback: string;
    encouragement: string;
    nextSteps: string[];
}

export interface DashboardInsightsResponse {
    summary: string;
    progressPercent: number;
    focusArea: string;
    nextAction: string;
}

export interface ConceptExplanationResponse {
    explanation: string;
    concept: string;
    examples: string[];
}

export interface WeekResource {
    task: string;
    videos: Array<{
        title: string;
        channel: string;
        url: string;
        duration: string;
        reason: string;
    }>;
}

export interface WeekResourcesResponse {
    week: number;
    resources: WeekResource[];
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Send a message to the AI Mentor and receive personalized guidance
 */
export async function mentorChat(message: string): Promise<MentorChatResponse> {
    try {
        const response = await fetch("/api/mentor/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error(`Chat failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Mentor chat error:", error);
        throw new Error("Unable to connect to your mentor right now. Please try again.");
    }
}

/**
 * Generate a personalized learning path based on current skills
 */
export async function generateLearningPath(): Promise<LearningPathResponse> {
    try {
        const response = await fetch("/api/mentor/generate-path", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Path generation failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Learning path generation error:", error);
        throw new Error("Unable to generate your learning path. Please try again.");
    }
}

/**
 * Get personalized feedback on quiz performance
 */
export async function getQuizFeedback(params: {
    skill: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    weakTopics: string[];
}): Promise<QuizFeedbackResponse> {
    try {
        const response = await fetch("/api/mentor/quiz-feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`Feedback generation failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Quiz feedback error:", error);
        throw new Error("Unable to generate feedback. Please try again.");
    }
}

/**
 * Get AI-powered insights for the dashboard
 */
export async function getDashboardInsights(): Promise<DashboardInsightsResponse> {
    try {
        const response = await fetch("/api/mentor/dashboard-insights", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Insights fetch failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Dashboard insights error:", error);
        throw new Error("Unable to load insights. Please try again.");
    }
}

/**
 * Get a simple explanation of a complex concept
 */
export async function explainConcept(concept: string, skill?: string): Promise<ConceptExplanationResponse> {
    try {
        const response = await fetch("/api/mentor/explain", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ concept, skill }),
        });

        if (!response.ok) {
            throw new Error(`Explanation failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Concept explanation error:", error);
        throw new Error("Unable to explain this concept. Please try again.");
    }
}

/**
 * Get highly relevant YouTube resources for a specific week's tasks
 */
export async function getWeekResources(params: {
    week: number;
    targetRole: string;
    skillLevel: string;
    timePerWeek: number;
    tasks: string[];
}): Promise<WeekResourcesResponse> {
    try {
        const response = await fetch("/api/mentor/week-resources", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch resources: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Week resources fetch error:", error);
        throw new Error("Your mentor is currently unable to find relevant videos. Please try again.");
    }
}
