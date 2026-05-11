import type { Request, Response } from "express";

// AI Mentor Service - Powers intelligent, personalized content across the application
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "[REDACTED]";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Simple in-memory cache for resources
// In-memory cache for resources - renamed to force refresh
// In-memory cache for resources - final reset for validated links
const finalResourceCache = new Map<string, any>();

// Core system prompt that defines the AI Mentor's personality and behavior
const SYSTEM_PROMPT = `You are an AI Mentor embedded inside a dynamic learning platform called MentorGPT.

Your role is to act as a personal skill trainer who:
- Tracks user skills, progress, interests, goals, and time availability
- Analyzes quiz scores, project outcomes, and engagement patterns
- Recommends next best learning modules, courses, projects, and resources
- Aligns skill gaps to target career roles
- Adapts continuously based on user improvement, struggles, or goal changes

BEHAVIOR GUIDELINES:
- Be supportive, confident, and professional
- Never mention API keys, backend logic, or that you're an AI model
- Speak as if you're an embedded intelligence within the website
- Adapt tone and complexity based on user's skill level
- Keep responses concise but insightful
- Use bullet points, steps, or sections when helpful

RESPONSE RULES BY CONTEXT:
- CHAT: Act like a mentor, not a chatbot. Be conversational and encouraging.
- LEARNING_PATH: Provide step-by-step roadmaps with clear milestones.
- QUIZ_FEEDBACK: Explain mistakes gently, suggest improvements, reinforce strengths.
- DASHBOARD: Summarize progress and recommend the single best next action.
- EXPLANATION: Teach using simple language, analogies, and practical examples.

TONE:
- Supportive and encouraging
- Confident but not arrogant
- Professional but approachable
- Never robotic or generic

Your goal: Make every interaction feel personalized, intelligent, and valuable.`;

interface UserProfile {
    name?: string;
    targetRole: string;
    experienceLevel?: string;
    skills?: Array<{ skill: string; masteryScore: number; confidenceScore: number }>;
    weakSkills?: string[];
    goals?: string;
    availability?: number;
}

interface ChatContext {
    pageType: "chat" | "dashboard" | "learning_path" | "quiz_feedback" | "explanation";
    userMessage?: string;
    currentModule?: string;
    progressPercentage?: number;
    lastActivity?: string;
    recentQuizScore?: number;
    weakestSkill?: string;
    constraints?: {
        time?: number;
        difficulty?: string;
        deadline?: string;
    };
}

/**
 * Generate AI-powered response based on user profile and context
 */
export async function generateMentorResponse(
    profile: UserProfile,
    context: ChatContext
): Promise<string> {
    try {
        // Build context-aware user prompt
        const userPrompt = buildContextPrompt(profile, context);

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mentorgpt.app",
                "X-Title": "MentorGPT"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("OpenRouter API error:", error);
            return getFallbackResponse(context.pageType);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || getFallbackResponse(context.pageType);
    } catch (error) {
        console.error("AI Mentor error:", error);
        return getFallbackResponse(context.pageType);
    }
}

/**
 * Build a context-aware prompt based on user profile and current context
 */
function buildContextPrompt(profile: UserProfile, context: ChatContext): string {
    const sections: string[] = [];

    // User Profile Section
    sections.push("USER PROFILE:");
    sections.push(`- Target Role: ${profile.targetRole}`);
    if (profile.experienceLevel) {
        sections.push(`- Experience Level: ${profile.experienceLevel}`);
    }
    if (profile.availability) {
        sections.push(`- Time Available: ${profile.availability} hours/week`);
    }

    if (profile.skills && profile.skills.length > 0) {
        const skillSummary = profile.skills
            .slice(0, 5)
            .map(s => `${s.skill}: ${s.masteryScore}%`)
            .join(", ");
        sections.push(`- Current Skills: ${skillSummary}`);
    }

    if (context.weakestSkill) {
        sections.push(`- Weakest Skill: ${context.weakestSkill}`);
    }

    // Context Section
    sections.push("\nCONTEXT:");
    sections.push(`- Page Type: ${context.pageType}`);

    if (context.currentModule) {
        sections.push(`- Current Module: ${context.currentModule}`);
    }

    if (context.progressPercentage !== undefined) {
        sections.push(`- Progress: ${context.progressPercentage}%`);
    }

    if (context.recentQuizScore !== undefined) {
        sections.push(`- Recent Quiz Score: ${context.recentQuizScore}%`);
    }

    if (context.constraints) {
        sections.push(`- Constraints: ${JSON.stringify(context.constraints)}`);
    }

    // User Request
    sections.push("\nUSER REQUEST:");
    if (context.userMessage) {
        sections.push(context.userMessage);
    } else {
        // Generate default request based on page type
        switch (context.pageType) {
            case "dashboard":
                sections.push("Summarize my progress and tell me the best next action to take.");
                break;
            case "learning_path":
                sections.push("Create a learning roadmap for my target role.");
                break;
            case "quiz_feedback":
                sections.push("Explain my quiz results and how I can improve.");
                break;
            case "explanation":
                sections.push(`Explain ${context.currentModule} in simple terms with examples.`);
                break;
            default:
                sections.push("How can I best achieve my learning goals?");
        }
    }

    return sections.join("\n");
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackResponse(pageType: string): string {
    const fallbacks: Record<string, string> = {
        chat: "I'm here to help you achieve your learning goals! Keep practicing and you'll see great progress.",
        dashboard: "You're making solid progress! Focus on your weakest skills to maximize your career readiness.",
        learning_path: "Continue with your current learning plan. Complete quizzes to unlock advanced modules.",
        quiz_feedback: "Review the questions you missed and try practicing similar problems to strengthen your understanding.",
        explanation: "This concept builds on your existing knowledge. Break it down into smaller steps and practice regularly."
    };

    return fallbacks[pageType] || "Keep up the great work on your learning journey!";
}

/**
 * Generate adaptive learning path recommendations
 */
export async function generateLearningPath(
    profile: UserProfile,
    skills: Array<{ skill: string; masteryScore: number }>
): Promise<{
    focus: string;
    weeklyPlan: Array<{ week: number; focus: string; tasks: string[] }>;
    rationale: string;
}> {
    const context: ChatContext = {
        pageType: "learning_path",
        userMessage: `Generate a 12-week learning path for ${profile.targetRole}. 
    Current skill levels: ${skills.map(s => `${s.skill} (${s.masteryScore}%)`).join(", ")}.
    
    Respond in this JSON format:
    {
      "focus": "Main learning focus for next month",
      "weeklyPlan": [
        {
          "week": 1,
          "focus": "Skill or topic name",
          "tasks": ["Specific task 1", "Specific task 2", "Specific task 3"]
        }
      ],
      "rationale": "Why this path makes sense for the user"
    }`
    };

    try {
        const response = await generateMentorResponse(profile, context);

        // Try to parse as JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        }

        // Fallback structure
        return {
            focus: "Foundation building and skill mastery",
            weeklyPlan: skills.slice(0, 4).map((skill, idx) => ({
                week: idx + 1,
                focus: skill.skill,
                tasks: [
                    `Complete ${skill.skill} fundamentals module`,
                    `Take practice quiz on ${skill.skill}`,
                    `Build a small project using ${skill.skill}`
                ]
            })),
            rationale: `Focus on strengthening your core ${profile.targetRole} skills systematically.`
        };
    } catch (error) {
        console.error("Learning path generation error:", error);
        return {
            focus: "Systematic skill development",
            weeklyPlan: [],
            rationale: "Build your skills progressively, starting with fundamentals."
        };
    }
}

/**
 * Generate personalized quiz feedback
 */
export async function generateQuizFeedback(
    profile: UserProfile,
    quizResults: {
        skill: string;
        score: number;
        correctCount: number;
        totalQuestions: number;
        weakTopics: string[];
    }
): Promise<string> {
    const context: ChatContext = {
        pageType: "quiz_feedback",
        recentQuizScore: quizResults.score,
        weakestSkill: quizResults.skill,
        userMessage: `I just completed a ${quizResults.skill} quiz. 
    Score: ${quizResults.score}% (${quizResults.correctCount}/${quizResults.totalQuestions} correct).
    Weak areas: ${quizResults.weakTopics.join(", ")}.
    
    Give me encouraging feedback and specific next steps to improve.`
    };

    return await generateMentorResponse(profile, context);
}

/**
 * Generate highly relevant YouTube resources for a specific week's tasks
 */
export async function generateWeekResources(params: {
    week: number;
    targetRole: string;
    skillLevel: string;
    timePerWeek: number;
    tasks: string[];
}): Promise<any> {
    const cacheKey = `${params.targetRole}-${params.week}-${params.skillLevel}-${params.tasks.join(",")}`;
    if (finalResourceCache.has(cacheKey)) {
        return finalResourceCache.get(cacheKey);
    }

    const systemPrompt = `You are an AI curriculum designer for a professional learning platform.

Your job is to recommend the BEST YouTube learning resources
that can be EMBEDDED inside a website.

STRICT RULES:
- ONLY recommend YouTube videos
- Prefer trusted educational channels (e.g., FreeCodeCamp, Traversy Media, Fireship, Programming with Mosh)
- For CYBERSECURITY/SOC roles, STRONGLY PREFER these channels: CyberWarLab, NetworkChuck, Black Hills Information Security
- Prefer videos that ALLOW EMBEDDING
- Avoid age-restricted, private, or members-only videos
- Avoid clickbait or low-quality creators
- Match the task concept precisely
- Adapt difficulty to the learner’s skill level (${params.skillLevel})

HIGH-QUALITY CANDIDATES (STRICTLY PREFER THESE FOR CYBERSECURITY):
- https://www.youtube.com/watch?v=lhaWbv5HfDM (Career Roadmap/Become a SOC Analyst)
- https://www.youtube.com/watch?v=hHpZZMvXuEg (SOC Analyst Training for Beginners)
- https://www.youtube.com/watch?v=SlJVyJRxtSk (Incident Response & SOC Operations)
- https://www.youtube.com/watch?v=9dlDcyg0d6U (SOC Master Class - Beginner Guide)
- https://www.youtube.com/watch?v=LbR5cqqaFVk (Splunk SIEM Crash Course)
- https://www.youtube.com/watch?v=GxFBa-wfSbs (SOC Analyst Mini-Course)
- https://www.youtube.com/watch?v=Z3S_re86W6A (Cybersecurity Incident Response Tutorial)
- https://www.youtube.com/watch?v=inWWhr5tn34 (Cybersecurity Career Advice)

CRITICAL: Some videos (like those from official news channels or certain corporate channels) RESTRICT embedding. 
ONLY recommend videos that are known to work in iframes. If you are unsure, stick to the HIGH-QUALITY CANDIDATES list above.

FOR EACH TASK:
- Recommend 1–2 YouTube videos
- Include:
  • video title
  • channel name
  • YouTube URL
  • duration
  • reason for recommendation

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "week": ${params.week},
  "resources": [
    {
      "task": "string",
      "videos": [
        {
          "title": "string",
          "channel": "string",
          "url": "string",
          "duration": "string",
          "reason": "string"
        }
      ]
    }
  ]
}

QUALITY BAR:
A learner must be able to complete the task
without searching outside the platform.`;

    const userPrompt = `Target Role: ${params.targetRole}
Skill Level: ${params.skillLevel}
Time per week: ${params.timePerWeek} hours
Tasks for Week ${params.week}:
${params.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Please provide the best YouTube tutorials for these specific tasks.`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mentorgpt.app",
                "X-Title": "MentorGPT"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.5,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI error: ${await response.text()}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        console.log("AI Resource Generation Result:", JSON.stringify(result, null, 2));

        finalResourceCache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Week resource generation error:", error);
        // Fallback: Return empty resources if AI fails
        return {
            week: params.week,
            resources: params.tasks.map(t => ({
                task: t,
                videos: []
            }))
        };
    }
}

export default {
    generateMentorResponse,
    generateLearningPath,
    generateQuizFeedback,
    generateWeekResources
};
