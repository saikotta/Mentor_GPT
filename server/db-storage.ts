import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, isDatabaseConnected } from "./db";
import * as schema from "@shared/schema";
import {
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Skill, type SkillPrerequisite,
  type UserSkill, type LearningPath,
  type PathWeek, type PathTask,
  type Resource, type ResourceSkill,
  type ResourceFeedback,
  type Question, type Assessment,
  type AssessmentAttempt,
  type Rubric, type ProjectSubmission,
  type EvaluationResult,
  type Recommendation, type RecommendationExperiment,
  type Notification, type NotificationPreference,
  type EventLog, type FunnelStep, type MetricSnapshot
} from "@shared/schema";
import { IStorage } from "./storage";
import { EventEmitter } from "events";
import { randomUUID } from "crypto";

/**
 * DatabaseStorage - PostgreSQL implementation of IStorage using Drizzle ORM
 */
export class DatabaseStorage extends EventEmitter implements IStorage {

  // ============================================
  // User Methods
  // ============================================

  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password,
      role: "student",
      createdAt: new Date(),
      lastLogin: null
    };
    await db.insert(schema.users).values(user);
    return user;
  }

  // ============================================
  // Profile Methods
  // ============================================

  async getProfile(userId: string): Promise<Profile | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
    return result[0];
  }

  async createProfile(insertProfile: InsertProfile & { userId: string }): Promise<Profile> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const profile: Profile = {
      id,
      userId: insertProfile.userId,
      careerGoal: insertProfile.careerGoal,
      skillInterests: insertProfile.skillInterests || [],
      availability: insertProfile.availability || 5,
      learningPreference: insertProfile.learningPreference || "mixed",
      pace: insertProfile.pace || "balanced",
      isPublic: insertProfile.isPublic || false
    };
    await db.insert(schema.profiles).values(profile);
    return profile;
  }

  async updateProfile(userId: string, update: Partial<InsertProfile>): Promise<Profile> {
    if (!db) throw new Error("Database not connected");
    const existing = await this.getProfile(userId);
    if (!existing) throw new Error("Profile not found");

    await db.update(schema.profiles)
      .set(update)
      .where(eq(schema.profiles.userId, userId));

    return { ...existing, ...update };
  }

  // ============================================
  // Skill Methods
  // ============================================

  async getSkills(): Promise<Skill[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.skills);
  }

  async getSkill(id: string): Promise<Skill | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.skills).where(eq(schema.skills.id, id)).limit(1);
    return result[0];
  }

  async getPrerequisites(skillId: string): Promise<SkillPrerequisite[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.skillPrerequisites)
      .where(eq(schema.skillPrerequisites.skillId, skillId));
  }

  // ============================================
  // User Skill Mastery Methods
  // ============================================

  async getUserSkills(userId: string): Promise<UserSkill[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.userSkills).where(eq(schema.userSkills.userId, userId));
  }

  async getUserSkill(userId: string, skillId: string): Promise<UserSkill | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.userSkills)
      .where(and(
        eq(schema.userSkills.userId, userId),
        eq(schema.userSkills.skillId, skillId)
      ))
      .limit(1);
    return result[0];
  }

  async updateSkillMastery(userId: string, skillId: string, performance: number, weight: number): Promise<UserSkill> {
    if (!db) throw new Error("Database not connected");
    const existing = await this.getUserSkill(userId, skillId);
    const oldMastery = existing?.masteryScore ?? 0;
    const newMastery = Math.round(weight * performance * 100 + (1 - weight) * oldMastery);
    const level = newMastery >= 80 ? "Advanced" : newMastery >= 50 ? "Intermediate" : "Beginner";

    if (existing) {
      await db.update(schema.userSkills)
        .set({
          masteryScore: newMastery,
          level,
          lastUpdated: new Date()
        })
        .where(eq(schema.userSkills.id, existing.id));
      return { ...existing, masteryScore: newMastery, level, lastUpdated: new Date() };
    } else {
      const id = randomUUID();
      const userSkill: UserSkill = {
        id,
        userId,
        skillId,
        masteryScore: newMastery,
        confidenceScore: 50,
        level,
        lastUpdated: new Date(),
        evidenceJson: null
      };
      await db.insert(schema.userSkills).values(userSkill);
      return userSkill;
    }
  }

  async inferSkillMastery(userId: string, events: any[]): Promise<UserSkill[]> {
    if (!db) throw new Error("Database not connected");
    const updatedSkills: UserSkill[] = [];

    for (const event of events) {
      const { skillId, type, score } = event;
      const existing = await this.getUserSkill(userId, skillId);

      let alpha = type === "diagnostic" ? 1.0 : type === "assessment" ? 0.5 : type === "project" ? 0.4 : 0.15;
      const oldMastery = existing?.masteryScore ?? 0;
      const newMastery = Math.round((alpha * score * 100) + (1 - alpha) * oldMastery);
      const confidenceBoost = type === "diagnostic" ? 30 : type === "project" ? 15 : type === "assessment" ? 20 : 10;
      const newConfidence = Math.min(100, (existing?.confidenceScore ?? 0) + confidenceBoost);
      const level = newMastery >= 80 ? "Advanced" : newMastery >= 50 ? "Intermediate" : "Beginner";

      const userSkill: UserSkill = {
        id: existing?.id || randomUUID(),
        userId,
        skillId,
        masteryScore: Math.max(0, Math.min(100, newMastery)),
        confidenceScore: newConfidence,
        level,
        lastUpdated: new Date(),
        evidenceJson: { lastEvent: event }
      };

      if (existing) {
        await db.update(schema.userSkills)
          .set(userSkill)
          .where(eq(schema.userSkills.id, existing.id));
      } else {
        await db.insert(schema.userSkills).values(userSkill);
      }

      updatedSkills.push(userSkill);
      this.emit("MASTERY_UPDATED", userId, userSkill);
    }

    return updatedSkills;
  }

  async checkPrerequisites(userId: string, skillId: string): Promise<{ met: boolean; unmet: any[] }> {
    const prereqs = await this.getPrerequisites(skillId);
    const unmet = [];
    for (const p of prereqs) {
      const us = await this.getUserSkill(userId, p.prerequisiteId);
      if (!us || us.masteryScore < p.minMastery) {
        const s = await this.getSkill(p.prerequisiteId);
        unmet.push({ skillId: p.prerequisiteId, name: s?.name, current: us?.masteryScore || 0, required: p.minMastery });
      }
    }
    return { met: unmet.length === 0, unmet };
  }

  // ============================================
  // Learning Path Methods
  // ============================================

  async getLearningPath(userId: string): Promise<LearningPath | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.learningPaths)
      .where(and(
        eq(schema.learningPaths.userId, userId),
        eq(schema.learningPaths.status, "active")
      ))
      .limit(1);
    return result[0];
  }

  async getLearningPathById(pathId: string): Promise<LearningPath | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.learningPaths)
      .where(eq(schema.learningPaths.id, pathId))
      .limit(1);
    return result[0];
  }

  async getPathWeeks(pathId: string): Promise<PathWeek[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.pathWeeks)
      .where(eq(schema.pathWeeks.pathId, pathId))
      .orderBy(schema.pathWeeks.weekNumber);
  }

  async getPathTasks(weekId: string): Promise<PathTask[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.pathTasks)
      .where(eq(schema.pathTasks.weekId, weekId))
      .orderBy(schema.pathTasks.priority);
  }

  async getAllPathTasks(pathId: string): Promise<PathTask[]> {
    const weeks = await this.getPathWeeks(pathId);
    const tasks: PathTask[] = [];
    for (const w of weeks) {
      const weekTasks = await this.getPathTasks(w.id);
      tasks.push(...weekTasks);
    }
    return tasks;
  }

  async getCompletedTaskCount(userId: string): Promise<number> {
    if (!db) throw new Error("Database not connected");
    // Get all paths for user, then count completed tasks
    const paths = await db.select().from(schema.learningPaths)
      .where(eq(schema.learningPaths.userId, userId));

    let count = 0;
    for (const p of paths) {
      const tasks = await this.getAllPathTasks(p.id);
      count += tasks.filter(t => t.status === "completed").length;
    }
    return count;
  }

  async generatePath(userId: string, options?: {
    horizonWeeks?: number;
    constraints?: { timePerWeek?: number; preferredFormats?: string[] };
    triggeredBy?: string;
  }): Promise<{ path: LearningPath; weeks: any[]; rationale: string }> {
    if (!db) throw new Error("Database not connected");

    // For now, delegate to a simplified version - full logic can be migrated later
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error("Profile not found");

    // Pause existing path
    const existing = await this.getLearningPath(userId);
    if (existing) {
      await db.update(schema.learningPaths)
        .set({ status: "paused" })
        .where(eq(schema.learningPaths.id, existing.id));
    }

    const horizonWeeks = options?.horizonWeeks ?? 6;
    const pathId = randomUUID();
    const version = existing ? ((existing as any).version ?? 0) + 1 : 1;
    const rationale = `Your ${horizonWeeks}-week plan is optimized for ${profile.careerGoal} with ${profile.availability}h/week availability.`;

    const path: LearningPath = {
      id: pathId,
      userId,
      targetRole: profile.careerGoal,
      horizonWeeks,
      status: "active",
      version,
      rationale,
      triggeredBy: options?.triggeredBy ?? "manual",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(schema.learningPaths).values(path);

    // Create basic weeks and tasks
    const weeksOutput: any[] = [];
    const skills = await this.getSkills();
    const userSkills = await this.getUserSkills(userId);
    const weeklyMinutes = (options?.constraints?.timePerWeek ?? profile.availability ?? 5) * 60;

    for (let w = 1; w <= horizonWeeks; w++) {
      const weekId = randomUUID();
      const focusSkill = skills[w % skills.length];

      const week: PathWeek = {
        id: weekId,
        pathId,
        weekNumber: w,
        focusSkills: [focusSkill?.id].filter(Boolean),
        secondarySkills: [],
        estimatedTime: weeklyMinutes,
        rationale: `Focus on ${focusSkill?.name || "fundamentals"}`
      };

      await db.insert(schema.pathWeeks).values(week);

      // Create tasks for this week
      const tasks: any[] = [];
      const taskId = randomUUID();
      const task: PathTask = {
        id: taskId,
        weekId,
        taskType: "concept",
        title: `Learn: ${focusSkill?.name || "Core concepts"}`,
        skillId: focusSkill?.id,
        estimatedTime: 30,
        deadline: null,
        status: "not_started",
        reason: "Building foundation",
        resourceId: null,
        priority: 1
      };

      await db.insert(schema.pathTasks).values(task);
      tasks.push(task);

      weeksOutput.push({
        week: w,
        focus: focusSkill?.name || "General",
        tasks: tasks.map(t => ({
          id: t.id,
          type: t.taskType,
          title: t.title,
          estimatedTime: t.estimatedTime,
          reason: t.reason,
          status: t.status
        })),
        rationale: week.rationale
      });
    }

    this.emit("PATH_GENERATED", userId, pathId);

    return { path, weeks: weeksOutput, rationale };
  }

  async updateTaskStatus(taskId: string, status: string): Promise<PathTask> {
    if (!db) throw new Error("Database not connected");

    const result = await db.select().from(schema.pathTasks)
      .where(eq(schema.pathTasks.id, taskId))
      .limit(1);

    if (!result[0]) throw new Error("Task not found");

    await db.update(schema.pathTasks)
      .set({ status })
      .where(eq(schema.pathTasks.id, taskId));

    const updated = { ...result[0], status };

    if (status === "completed") {
      this.emit("TASK_COMPLETED", updated);
    }

    return updated;
  }

  async shouldRegeneratePath(userId: string, eventType: string, payload?: any): Promise<boolean> {
    const significantEvents = ["ASSESSMENT_COMPLETED", "PROJECT_EVALUATED", "SIGNIFICANT_MASTERY_SHIFT", "USER_PROFILE_UPDATED"];
    if (!significantEvents.includes(eventType)) return false;
    if (eventType === "SIGNIFICANT_MASTERY_SHIFT" && payload?.delta) {
      return Math.abs(payload.delta) >= 15;
    }
    return true;
  }

  // ============================================
  // Resource Methods
  // ============================================

  async getResources(): Promise<Resource[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.resources);
  }

  async getResource(id: string): Promise<Resource | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.resources)
      .where(eq(schema.resources.id, id))
      .limit(1);
    return result[0];
  }

  async getResourceSkills(resourceId: string): Promise<ResourceSkill[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.resourceSkills)
      .where(eq(schema.resourceSkills.resourceId, resourceId));
  }

  async submitFeedback(f: Omit<ResourceFeedback, "id" | "createdAt">): Promise<ResourceFeedback> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const feedback: ResourceFeedback = { ...f, id, createdAt: new Date() };
    await db.insert(schema.resourceFeedback).values(feedback);
    return feedback;
  }

  // ============================================
  // Assessment Methods
  // ============================================

  async getQuestions(skillId: string, difficulty: string): Promise<Question[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.questions)
      .where(and(
        eq(schema.questions.skillId, skillId),
        eq(schema.questions.difficulty, difficulty)
      ));
  }

  async startAssessment(userId: string, skillId: string): Promise<Assessment> {
    if (!db) throw new Error("Database not connected");

    // Check for existing active assessment
    const existing = await db.select().from(schema.assessments)
      .where(and(
        eq(schema.assessments.userId, userId),
        eq(schema.assessments.skillId, skillId),
        eq(schema.assessments.status, "started")
      ))
      .limit(1);

    if (existing[0]) return existing[0];

    const id = randomUUID();
    const assessment: Assessment = {
      id,
      userId,
      skillId,
      status: "started",
      difficulty: "Beginner",
      score: null,
      createdAt: new Date(),
      completedAt: null
    };

    await db.insert(schema.assessments).values(assessment);
    return assessment;
  }

  async submitAssessment(assessmentId: string, responses: { questionId: string; userAnswer: string }[]): Promise<Assessment> {
    if (!db) throw new Error("Database not connected");

    const result = await db.select().from(schema.assessments)
      .where(eq(schema.assessments.id, assessmentId))
      .limit(1);

    if (!result[0]) throw new Error("Assessment not found");
    const assessment = result[0];
    if (assessment.status === "completed") return assessment;

    let correctCount = 0;
    for (const resp of responses) {
      const questions = await db.select().from(schema.questions)
        .where(eq(schema.questions.id, resp.questionId))
        .limit(1);

      const q = questions[0];
      if (q && q.correctAnswer === resp.userAnswer) {
        correctCount++;
      }
    }

    const score = responses.length > 0 ? Math.round((correctCount / responses.length) * 100) : 0;

    await db.update(schema.assessments)
      .set({ status: "completed", score, completedAt: new Date() })
      .where(eq(schema.assessments.id, assessmentId));

    this.emit("ASSESSMENT_COMPLETED", assessment.userId, { assessmentId, score });

    return { ...assessment, status: "completed", score, completedAt: new Date() };
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.assessments)
      .where(eq(schema.assessments.id, id))
      .limit(1);
    return result[0];
  }

  async getAssessmentAttempts(assessmentId: string): Promise<AssessmentAttempt[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.assessmentAttempts)
      .where(eq(schema.assessmentAttempts.assessmentId, assessmentId));
  }

  // ============================================
  // Project Evaluation Methods
  // ============================================

  async getRubric(projectId: string): Promise<Rubric | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.rubrics)
      .where(eq(schema.rubrics.projectId, projectId))
      .limit(1);
    return result[0];
  }

  async submitProject(userId: string, projectId: string, type: string, reference: string): Promise<ProjectSubmission> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const submission: ProjectSubmission = {
      id,
      userId,
      projectId,
      submissionType: type,
      artifactReference: reference,
      status: "submitted",
      submittedAt: new Date()
    };
    await db.insert(schema.projectSubmissions).values(submission);
    return submission;
  }

  async evaluateProject(submissionId: string): Promise<EvaluationResult> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const result: EvaluationResult = {
      id,
      submissionId,
      overallScore: 75,
      rubricScores: {},
      strengths: "Clean code",
      improvements: "Add more tests",
      suggestions: "Keep up the good work",
      confidence: 80,
      evaluatedAt: new Date()
    };
    await db.insert(schema.evaluationResults).values(result);
    return result;
  }

  async getEvaluation(submissionId: string): Promise<EvaluationResult | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.evaluationResults)
      .where(eq(schema.evaluationResults.submissionId, submissionId))
      .limit(1);
    return result[0];
  }

  // ============================================
  // Recommendation Methods
  // ============================================

  async getRecommendations(userId: string, type: "skill" | "resource" | "project"): Promise<Recommendation[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.recommendations)
      .where(and(
        eq(schema.recommendations.userId, userId),
        eq(schema.recommendations.type, type)
      ));
  }

  async generateHybridRecommendations(userId: string, timeBudget: number): Promise<Recommendation[]> {
    // Simplified - return empty array for now
    return [];
  }

  async updateRecommendationStatus(id: string, status: string): Promise<Recommendation> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.recommendations)
      .where(eq(schema.recommendations.id, id))
      .limit(1);

    if (!result[0]) throw new Error("Recommendation not found");

    await db.update(schema.recommendations)
      .set({ status })
      .where(eq(schema.recommendations.id, id));

    return { ...result[0], status };
  }

  // ============================================
  // Notification Methods
  // ============================================

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.sentAt));
  }

  async createNotification(notif: Omit<Notification, "id" | "status" | "sentAt">): Promise<Notification> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const notification: Notification = {
      ...notif,
      id,
      status: "pending",
      sentAt: new Date()
    };
    await db.insert(schema.notifications).values(notification);
    return notification;
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreference> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId))
      .limit(1);

    if (result[0]) return result[0];

    // Create default preferences
    const id = randomUUID();
    const prefs: NotificationPreference = {
      id,
      userId,
      enabledChannels: ["email", "push"],
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      frequencyLimit: 3
    };
    await db.insert(schema.notificationPreferences).values(prefs);
    return prefs;
  }

  async updateNotificationPreferences(userId: string, update: Partial<NotificationPreference>): Promise<NotificationPreference> {
    if (!db) throw new Error("Database not connected");
    const existing = await this.getNotificationPreferences(userId);

    await db.update(schema.notificationPreferences)
      .set(update)
      .where(eq(schema.notificationPreferences.userId, userId));

    return { ...existing, ...update };
  }

  // ============================================
  // Analytics & Logging Methods
  // ============================================

  async logEvent(userId: string | null, type: string, service: string, payload: any): Promise<EventLog> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const log: EventLog = {
      id,
      userId,
      eventType: type,
      serviceName: service,
      payload,
      timestamp: new Date()
    };
    await db.insert(schema.eventLogs).values(log);
    return log;
  }

  async trackFunnelStep(userId: string, funnel: string, step: string): Promise<FunnelStep> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const funnelStep: FunnelStep = {
      id,
      userId,
      funnelName: funnel,
      stepName: step,
      completedAt: new Date()
    };
    await db.insert(schema.funnelSteps).values(funnelStep);
    return funnelStep;
  }

  async getUserSummary(userId: string): Promise<any> {
    if (!db) throw new Error("Database not connected");

    const skills = await this.getUserSkills(userId);
    const logs = await db.select().from(schema.eventLogs)
      .where(eq(schema.eventLogs.userId, userId))
      .orderBy(desc(schema.eventLogs.timestamp))
      .limit(100);

    const assessments = await db.select().from(schema.assessments)
      .where(eq(schema.assessments.userId, userId));

    return {
      totalEvents: logs.length,
      skillsMastered: skills.filter(s => s.masteryScore >= 80).length,
      averageMastery: skills.length > 0 ? skills.reduce((acc, s) => acc + s.masteryScore, 0) / skills.length : 0,
      assessmentsTaken: assessments.length,
      lastActive: logs.length > 0 ? logs[0].timestamp : null,
      recentActivity: logs.slice(0, 5).map(l => ({ type: l.eventType, time: l.timestamp }))
    };
  }

  async createMetricSnapshot(name: string, value: number, entityId?: string): Promise<MetricSnapshot> {
    if (!db) throw new Error("Database not connected");
    const id = randomUUID();
    const snapshot: MetricSnapshot = {
      id,
      metricName: name,
      value,
      entityId: entityId || null,
      timestamp: new Date()
    };
    await db.insert(schema.metricSnapshots).values(snapshot);
    return snapshot;
  }
}
