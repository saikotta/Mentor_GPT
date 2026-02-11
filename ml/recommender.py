import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class UserContext:
    user_id: str
    goal_role: str
    time_per_week: int  # in minutes
    learning_style: str  # e.g., 'project-first', 'video-preferred'
    experience_level: str

@dataclass
class Resource:
    resource_id: str
    title: str
    skills: List[str]
    difficulty: float  # 0.0 to 1.0
    duration: int      # in minutes
    format: str        # video, article, project, quiz
    description: str
    effectiveness_score: float = 0.8  # Historical effectiveness

from role_config import ROLE_CONFIGS

class HybridRecommender:
    """
    Senior Recommender Architect Design: 
    Hybrid (Rule-based + Multi-Objective Ranking) Next Best Action Engine.
    """

    def __init__(self):
        self.catalog: List[Resource] = []
        self._load_mock_catalog()

    def _load_mock_catalog(self):
        # Adding some diverse resources covering multiple roles
        self.catalog = [
            Resource("r1", "SQL Joins Deep Dive", ["sql.joins"], 0.3, 45, "video", "Mastering inner and outer joins."),
            Resource("r2", "Advanced SQL Optimization", ["sql.joins", "sql.window"], 0.7, 120, "project", "Hands-on query tuning."),
            Resource("r3", "Python for Data Analysis", ["python.pandas"], 0.4, 60, "video", "Pandas and Numpy basics."),
            Resource("r4", "Model Deployment with Flask", ["mlops"], 0.6, 90, "video", "Learn to serve models as APIs."),
            Resource("r5", "Neural Networks from Scratch", ["dl"], 0.8, 180, "project", "Implement a backprop engine in Python."),
            Resource("r6", "React Advanced Hooks", ["frontend.react"], 0.5, 60, "video", "Learn useMemo and useCallback."),
            Resource("r7", "System Design Interview Prep", ["sys_design"], 0.9, 120, "article", "How to scale to 1M users."),
            Resource("r8", "Writing Effective PRDs", ["specs"], 0.3, 30, "article", "Documenting requirements clearly."),
            Resource("r9", "Figma Design System", ["design.figma"], 0.2, 45, "practice", "Build a reusable UI component library."),
            Resource("r10", "Network Packet Analysis", ["network.protocols"], 0.7, 120, "project", "Using Wireshark for security.")
        ]

    def recommend(self, module1_output: Dict[str, Any], context: UserContext) -> List[Dict[str, Any]]:
        """
        Main recommendation pipeline.
        """
        # STEP A: Input Vector Construction
        user_vector = self._construct_user_vector(module1_output, context)
        
        recommendations = []
        for resource in self.catalog:
            # STEP B: Content-Based Filtering & STEP D: Multi-Objective Ranking
            res_score = self._calculate_final_score(user_vector, resource, context)
            
            # STEP E: Explainability Layer
            recommendations.append(self._format_output(res_score, resource, user_vector))

        # Filter out negative or extremely low scores, then sort
        ranked = sorted(recommendations, key=lambda x: x["final_score"], reverse=True)
        return ranked[:3]  # Return Top 3

    def calculate_readiness(self, m1_output: Dict[str, Any], goal_role: str) -> Dict[str, Any]:
        """
        Step 9: Readiness & Career Alignment Logic.
        Calculates a weighted readiness score (0-100%).
        """
        config = ROLE_CONFIGS.get(goal_role, ROLE_CONFIGS["Data Analyst"])
        
        total_weighted_mastery = 0.0
        total_possible_weighted_mastery = 0.0
        
        skill_breakdown = []
        
        for skill_id, info in config.items():
            state = m1_output["skills"].get(skill_id, {"mastery": 0, "confidence": 0})
            mastery = state["mastery"]
            target = info["target"]
            weight = info["weight"]
            
            # Contribution to overall readiness
            total_weighted_mastery += mastery * weight
            total_possible_weighted_mastery += target * weight
            
            skill_breakdown.append({
                "skill": info["name"],
                "current": mastery,
                "target": target,
                "status": "Mastered" if mastery >= target else "Developing" if mastery > 0 else "Not Started"
            })
            
        readiness_score = (total_weighted_mastery / total_possible_weighted_mastery) * 100 if total_possible_weighted_mastery > 0 else 0
        
        # Qualitative Assessment
        status = "Job Ready" if readiness_score >= 85 else "Interview Ready" if readiness_score >= 70 else "Building Core Skills"
        
        return {
            "role": goal_role,
            "readiness_score": round(readiness_score, 1),
            "status": status,
            "breakdown": skill_breakdown
        }

    def _construct_user_vector(self, m1: Dict[str, Any], ctx: UserContext) -> Dict[str, Any]:
        """
        Calculates Skill Gaps based on Role Targets.
        """
        config = ROLE_CONFIGS.get(ctx.goal_role, ROLE_CONFIGS["Data Analyst"])
        skill_gaps = {}
        
        # Calculate gaps based on Module 1 mastery
        for skill_id, info in config.items():
            current_data = m1["skills"].get(skill_id, {"mastery": 0})
            current = current_data["mastery"]
            target = info["target"]
            
            gap = max(0, target - current)
            if gap > 0:
                # Store gap multiplied by role significance (weight)
                skill_gaps[skill_id] = gap * (info["weight"] / 5.0)

        # Identify Risk Flags
        risk_flags = []
        for skill_id, data in m1["skills"].items():
            if data["confidence"] < 0.5:
                # Flag as "low_confidence_gap"
                risk_flags.append(f"low_confidence_{skill_id}")
        
        if m1.get("recent_failures"):
            risk_flags.append("recent_failure")

        return {
            "skill_gaps": skill_gaps,
            "goal_role": ctx.goal_role,
            "time_available": ctx.time_per_week,
            "learning_style": ctx.learning_style,
            "risk_flags": risk_flags,
            "m1_data": m1
        }

    def _calculate_final_score(self, user: Dict[str, Any], res: Resource, ctx: UserContext) -> Dict[str, float]:
        """
        Implementation of Multi-Objective Ranking Formula.
        """
        # 1. Expected Skill Gain (0.4)
        # Weight of gain based on the magnitude of the gap
        gain_potential = 0.0
        for s in res.skills:
            gap = user["skill_gaps"].get(s, 0)
            # If the user has a weak subskill specifically mentioned
            if s in user["m1_data"].get("weak_subskills", []):
                gap *= 1.5 
            gain_potential += (gap / 100.0) * res.effectiveness_score
        
        expected_gain = min(1.0, gain_potential)

        # 2. Relevance Score (0.2) - Simple Keyword Matching (Embedding Pseudo-logic)
        relevance = 0.0
        if any(s in user["skill_gaps"] for s in res.skills):
            relevance = 1.0 # High relevance if it covers a gap
        
        # 3. Time Fit (0.2)
        # Ideal: Resource uses ~1/4 to 1/2 of weekly budget per session
        time_ratio = res.duration / user["time_available"]
        if res.duration > user["time_available"]:
            time_fit = -0.5 # Penalty for overflow
        elif time_ratio < 0.05:
            time_fit = 0.5 # Too short
        else:
            time_fit = 1.0 - abs(0.25 - time_ratio) # Peaks at 25% budget usage

        # 4. Engagement Probability (0.1)
        engagement = 1.0 if res.format == user["learning_style"].split("-")[0] else 0.5
        if "project" in user["learning_style"] and res.format == "project":
            engagement = 1.0

        # 5. Dropout Risk (-0.1)
        # Risk increases with high difficulty and low confidence
        avg_confidence = sum(s["confidence"] for s in user["m1_data"]["skills"].values()) / len(user["m1_data"]["skills"]) if user["m1_data"]["skills"] else 0.5
        dropout_risk = res.difficulty * (1.0 - avg_confidence)
        if "recent_failure" in user["risk_flags"]:
            dropout_risk += 0.2

        # Final Formula
        final_score = (
            0.4 * expected_gain +
            0.2 * relevance +
            0.2 * time_fit +
            0.1 * engagement -
            0.1 * dropout_risk
        )

        return {
            "final_score": round(final_score, 4),
            "expected_gain": expected_gain,
            "time_fit": time_fit,
            "dropout_risk": dropout_risk,
            "relevance": relevance
        }

    def _format_output(self, scores: Dict[str, float], res: Resource, user_vec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates judge-ready explanatory strings.
        """
        reason = ""
        # Logic for reason generation
        primary_gap = res.skills[0] if res.skills else "general knowledge"
        current_mastery = user_vec["m1_data"]["skills"].get(primary_gap, {}).get("mastery", 0)
        
        if scores["dropout_risk"] > 0.4:
            reason = f"High-gain challenge for {primary_gap}; support available via Mentor Chat."
        elif scores["time_fit"] > 0.8:
            reason = f"Perfectly fits your {user_vec['time_available']} min weekly budget."
        elif primary_gap in user_vec["m1_data"].get("weak_subskills", []):
            reason = f"Specifically targets your weakness in {primary_gap}."
        else:
            reason = f"Effective way to close the {round(user_vec['skill_gaps'].get(primary_gap, 0))}% gap in {primary_gap}."

        return {
            "resource_id": res.resource_id,
            "title": res.title,
            "final_score": scores["final_score"],
            "type": res.format,
            "reason": reason,
            "expected_gain": f"+{round(scores['expected_gain'] * 25)}%", # Normalized to realistic human progress
            "confidence_required": "High" if res.difficulty > 0.6 else "Any"
        }

# --- TEST SUITE ---
if __name__ == "__main__":
    recommender = HybridRecommender()
    
    # M1 Mock Data
    m1_output = {
        "user_id": "u123",
        "skills": {
            "python": { "mastery": 72, "confidence": 0.81 },
            "sql.joins": { "mastery": 48, "confidence": 0.42 }
        },
        "weak_subskills": ["sql.left_join"],
        "recent_failures": ["sql.joins"]
    }
    
    # User Context
    user_context = UserContext(
        user_id="u123",
        goal_role="Data Analyst",
        time_per_week=240, # 4 hours
        learning_style="project-first",
        experience_level="beginner"
    )
    
    results = recommender.recommend(m1_output, user_context)
    
    import json
    print("\n--- ACTIONABLE RECOMMENDATIONS ---")
    print(json.dumps(results, indent=2))
