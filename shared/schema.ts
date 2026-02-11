import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // student, mentor, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  careerGoal: text("career_goal").notNull(),
  skillInterests: jsonb("skill_interests").$type<string[]>().notNull().default([]),
  availability: integer("availability").notNull().default(5), // hours per week
  learningPreference: text("learning_preference").notNull().default("mixed"), // video, project, text, mixed
  pace: text("pace").notNull().default("balanced"), // fast, balanced, deliberate
  isPublic: boolean("is_public").notNull().default(false),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: varchar("parent_id"),
  domain: text("domain").notNull(), // Programming, Data, Soft Skills
  difficulty: text("difficulty").notNull(), // Beginner, Intermediate, Advanced
  careerWeight: integer("career_weight").notNull().default(1),
});

export const skillPrerequisites = pgTable("skill_prerequisites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id").notNull().references(() => skills.id),
  prerequisiteId: varchar("prerequisite_id").notNull().references(() => skills.id),
  minMastery: integer("min_mastery").notNull().default(60),
});

export const userSkills = pgTable("user_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  skillId: varchar("skill_id").notNull().references(() => skills.id),
  masteryScore: integer("mastery_score").notNull().default(0),
  confidenceScore: integer("confidence_score").notNull().default(0),
  level: text("level").notNull().default("Beginner"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  evidenceJson: jsonb("evidence_json"), // { events, weights, explanation }
});

export const learningPaths = pgTable("learning_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetRole: text("target_role").notNull(),
  horizonWeeks: integer("horizon_weeks").notNull().default(6),
  status: text("status").notNull().default("active"), // active, processing, completed, paused
  version: integer("version").notNull().default(1),
  rationale: text("rationale"), // Explanation of why this plan was generated
  triggeredBy: text("triggered_by"), // Event that triggered regeneration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pathWeeks = pgTable("path_weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pathId: varchar("path_id").notNull().references(() => learningPaths.id),
  weekNumber: integer("week_number").notNull(),
  focusSkills: jsonb("focus_skills").$type<string[]>().notNull().default([]),
  secondarySkills: jsonb("secondary_skills").$type<string[]>().notNull().default([]),
  estimatedTime: integer("estimated_time").notNull(), // total minutes
  rationale: text("rationale"), // Why this week focuses on these skills
});

export const pathTasks = pgTable("path_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekId: varchar("week_id").notNull().references(() => pathWeeks.id),
  taskType: text("task_type").notNull(), // concept, practice, project, reinforcement
  title: text("title").notNull(),
  skillId: varchar("skill_id").references(() => skills.id),
  estimatedTime: integer("estimated_time").notNull(), // minutes
  deadline: timestamp("deadline"),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed, skipped
  reason: text("reason"), // explanation for why this is scheduled
  resourceId: varchar("resource_id"), // optional link to a resource
  priority: integer("priority").notNull().default(1), // 1 = highest
});

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // video, article, course, docs, practice
  difficulty: text("difficulty").notNull(), // Beginner, Intermediate, Advanced
  estimatedTime: integer("estimated_time").notNull(), // minutes
  source: text("source").notNull(),
  url: text("url").notNull(),
  qualityScore: integer("quality_score").notNull().default(0), // 0-100
});

export const resourceSkills = pgTable("resource_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id),
  skillId: varchar("skill_id").notNull().references(() => skills.id),
  weight: integer("weight").notNull().default(1),
});

export const resourceFeedback = pgTable("resource_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => resources.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id").notNull().references(() => skills.id),
  type: text("type").notNull(), // mcq, short_answer, coding
  difficulty: text("difficulty").notNull(), // Beginner, Intermediate, Advanced
  content: jsonb("content").notNull(), // { text, options }
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  skillId: varchar("skill_id").notNull().references(() => skills.id),
  status: text("status").notNull().default("started"), // started, completed
  difficulty: text("difficulty").notNull(), // Beginner, Intermediate, Advanced
  score: integer("score"), // normalized 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  timeTaken: integer("time_taken"), // seconds
});

export const rubrics = pgTable("rubrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(), // Logical project ID
  criteria: jsonb("criteria").notNull(), // [{ category, weight, guidelines }]
});

export const projectSubmissions = pgTable("project_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").notNull(),
  submissionType: text("submission_type").notNull(), // github, zip, url, text
  artifactReference: text("artifact_reference").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, evaluated
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const evaluationResults = pgTable("evaluation_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => projectSubmissions.id),
  overallScore: integer("overall_score").notNull(),
  rubricScores: jsonb("rubric_scores").notNull(), // { category: score }
  strengths: text("strengths").notNull(),
  improvements: text("improvements").notNull(),
  suggestions: text("suggestions").notNull(),
  confidence: integer("confidence").notNull(),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // skill, resource, project
  targetId: varchar("target_id").notNull(),
  rankScore: integer("rank_score").notNull(),
  explanation: text("explanation").notNull(),
  strategy: text("strategy").notNull().default("hybrid_v1"),
  status: text("status").notNull().default("pending"), // pending, accepted, dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recommendationExperiments = pgTable("recommendation_experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  strategy: text("strategy").notNull(),
  trafficSplit: integer("traffic_split").notNull(), // 0-100
  isActive: boolean("is_active").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  channel: text("channel").notNull(), // email, whatsapp, push
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, cancelled
  scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  metadata: jsonb("metadata"), // { eventType, priority }
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  enabledChannels: jsonb("enabled_channels").notNull().default(sql`'["email", "push"]'::jsonb`),
  quietHoursStart: text("quiet_hours_start").default("22:00"),
  quietHoursEnd: text("quiet_hours_end").default("08:00"),
  frequencyLimit: integer("frequency_limit").default(3), // notifications per day
});

export const eventLogs = pgTable("event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Nullable for system events
  eventType: text("event_type").notNull(),
  serviceName: text("service_name").notNull(),
  payload: jsonb("payload").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const funnelSteps = pgTable("funnel_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  funnelName: text("funnel_name").notNull(),
  stepName: text("step_name").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const metricSnapshots = pgTable("metric_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: text("metric_name").notNull(),
  entityId: varchar("entity_id"), // userId or cohortId
  value: doublePrecision("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  userId: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertPrerequisiteSchema = createInsertSchema(skillPrerequisites).omit({ id: true });
export const insertUserSkillSchema = createInsertSchema(userSkills).omit({ id: true });
export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({ id: true });
export const insertPathWeekSchema = createInsertSchema(pathWeeks).omit({ id: true });
export const insertPathTaskSchema = createInsertSchema(pathTasks).omit({ id: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true });
export const insertSubmissionSchema = createInsertSchema(projectSubmissions).omit({ id: true, submittedAt: true });

export const assessmentSubmissionSchema = z.object({
  assessmentId: z.string(),
  responses: z.array(z.object({
    questionId: z.string(),
    userAnswer: z.string(),
  })),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Skill = typeof skills.$inferSelect;
export type SkillPrerequisite = typeof skillPrerequisites.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type LearningPath = typeof learningPaths.$inferSelect;
export type PathWeek = typeof pathWeeks.$inferSelect;
export type PathTask = typeof pathTasks.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type ResourceSkill = typeof resourceSkills.$inferSelect;
export type ResourceFeedback = typeof resourceFeedback.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type RecommendationExperiment = typeof recommendationExperiments.$inferSelect;
export type Rubric = typeof rubrics.$inferSelect;
export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type EvaluationResult = typeof evaluationResults.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type EventLog = typeof eventLogs.$inferSelect;
export type FunnelStep = typeof funnelSteps.$inferSelect;
export type MetricSnapshot = typeof metricSnapshots.$inferSelect;

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true });
export const insertExperimentSchema = createInsertSchema(recommendationExperiments).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, sentAt: true });
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({ id: true });
export const insertEventLogSchema = createInsertSchema(eventLogs).omit({ id: true, timestamp: true });
export const insertFunnelStepSchema = createInsertSchema(funnelSteps).omit({ id: true, completedAt: true });
export const insertMetricSnapshotSchema = createInsertSchema(metricSnapshots).omit({ id: true, timestamp: true });






