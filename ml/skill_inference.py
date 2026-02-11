import time
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
import math

@dataclass
class Skill:
    skill_id: str
    name: str
    parent_skill: Optional[str] = None
    difficulty: str = "Beginner"
    sub_skills: List[str] = field(default_factory=list)

@dataclass
class UserSkillState:
    user_id: str
    skill_id: str
    mastery_score: float = 0.0
    confidence: float = 0.0
    last_updated: float = field(default_factory=time.time)
    successful_attempts: int = 0
    total_attempts: int = 0
    failure_map: Dict[str, int] = field(default_factory=dict)  # Tracks failures for specific sub-aspects

@dataclass
class EvidenceEvent:
    event_id: str
    user_id: str
    skill_id: str
    type: str  # quiz, project, practice, revision, failure
    score: float  # 0 to 100
    timestamp: float = field(default_factory=time.time)
    sub_skills: List[str] = field(default_factory=list)

class SkillInferenceEngine:
    """
    Senior ML Architect Design: Skill Inference Engine
    Targeting: Stability, Explainability, and Temporal Awareness.
    """

    # 4.0 Evidence Weighting Strategy
    WEIGHT_MAP = {
        "quiz": 0.3,
        "practice": 0.4,
        "coding_task": 0.6,
        "project": 0.9,
        "revision": 0.2,
        "failure": -0.4  # Negative signal
    }

    def __init__(self, alpha: float = 0.2, propagation_factor: float = 0.3):
        self.alpha = alpha  # EMA Smoothing Factor
        self.propagation_factor = propagation_factor  # How much child mastery influences parent
        self.skills_registry: Dict[str, Skill] = {}
        self.user_states: Dict[str, Dict[str, UserSkillState]] = {}

    def register_skill(self, skill: Skill):
        self.skills_registry[skill.skill_id] = skill

    def get_or_create_state(self, user_id: str, skill_id: str) -> UserSkillState:
        if user_id not in self.user_states:
            self.user_states[user_id] = {}
        if skill_id not in self.user_states[user_id]:
            self.user_states[user_id][skill_id] = UserSkillState(user_id=user_id, skill_id=skill_id)
        return self.user_states[user_id][skill_id]

    def update_mastery(self, user_id: str, event: EvidenceEvent) -> Dict[str, Any]:
        """
        Entry point for updating skill mastery based on an evidence event.
        Calculates EMA, Updates Confidence, and Propagates to Parent Skills.
        """
        state = self.get_or_create_state(user_id, event.skill_id)
        weight = self.WEIGHT_MAP.get(event.type, 0.3)
        
        # 1. Update Attempt Counters
        state.total_attempts += 1
        if event.score >= 60:  # Threshold for "success" in attempt counting
            state.successful_attempts += 1
        
        # 2. Handle Sub-Skill Weakness Detection
        if event.type == "failure" or event.score < 50:
            for sub in event.sub_skills:
                state.failure_map[sub] = state.failure_map.get(sub, 0) + 1

        # 3. EMA Calculation (Section 5.0)
        # new_mastery = alpha * (score * weight) + (1 - alpha) * old_mastery
        # We normalize the weighted score to ensure it stays in 0-100 range logically
        # For failures, the negative weight naturally pulls down the score
        effective_score = event.score
        if weight < 0:
            # If it's a failure event, we interpret it as a heavy downward pressure
            weighted_signal = max(0, state.mastery_score + (weight * 20)) # Cap the drop per event
        else:
            weighted_signal = effective_score

        # Apply EMA formula
        old_mastery = state.mastery_score
        state.mastery_score = (self.alpha * weighted_signal) + (1 - self.alpha) * old_mastery
        state.mastery_score = max(0.0, min(100.0, state.mastery_score))
        
        # 4. Confidence Modeling (Section 6.0)
        # confidence = successful / total (smoothed with a small prior to prevent div by zero/instability)
        state.confidence = state.successful_attempts / state.total_attempts
        state.last_updated = time.time()

        # 5. Skill Graph Propagation (Section 8.0)
        self._propagate_to_parent(user_id, event.skill_id)

        # 6. Generate Explainable Output
        weak_subskills = [sub for sub, count in state.failure_map.items() if count > 2]
        
        return {
            "skill_id": state.skill_id,
            "mastery": round(state.mastery_score, 2),
            "confidence": round(state.confidence, 2),
            "weak_subskills": weak_subskills,
            "status": self._get_status(state)
        }

    def _propagate_to_parent(self, user_id: str, skill_id: str):
        """
        Propagates a portion of child mastery to the parent skill.
        This ensures parent skills (e.g., 'SQL') reflect child proficiency (e.g., 'Joins').
        """
        skill = self.skills_registry.get(skill_id)
        if not skill or not skill.parent_skill:
            return

        parent_state = self.get_or_create_state(user_id, skill.parent_skill)
        child_state = self.user_states[user_id][skill_id]
        
        # Parent mastery is a weighted reflection of children
        # In a real system, we'd aggregate all siblings. Here we do an incremental update.
        parent_state.mastery_score = (self.propagation_factor * child_state.mastery_score) + \
                                     (1 - self.propagation_factor) * parent_state.mastery_score
        parent_state.mastery_score = max(0.0, min(100.0, parent_state.mastery_score))
        
        # Recursively propagate up the graph
        self._propagate_to_parent(user_id, skill.parent_skill)

    def _get_status(self, state: UserSkillState) -> str:
        if state.mastery_score > 70 and state.confidence > 0.75:
            return "READY_FOR_ADVANCED"
        if state.mastery_score > 60 and state.confidence < 0.4:
            return "NEEDS_REVISION"
        if state.mastery_score < 40:
            return "STRUGGLING"
        return "PROGRESSING"

# --- EXAMPLE USAGE ---
if __name__ == "__main__":
    engine = SkillInferenceEngine(alpha=0.2)
    
    # Define Skill Graph
    sql_base = Skill(skill_id="sql", name="SQL Foundations")
    sql_joins = Skill(skill_id="sql.joins", name="SQL Joins", parent_skill="sql")
    
    engine.register_skill(sql_base)
    engine.register_skill(sql_joins)
    
    user_id = "user_42"
    
    # Scenario: User takes a quiz on Joins and scores well
    event1 = EvidenceEvent(
        event_id="e1", 
        user_id=user_id, 
        skill_id="sql.joins", 
        type="quiz", 
        score=85,
        sub_skills=["inner_joins"]
    )
    print(f"Update 1 (Quiz): {engine.update_mastery(user_id, event1)}")
    
    # Scenario: User fails a specific task involving Left Joins
    event2 = EvidenceEvent(
        event_id="e2", 
        user_id=user_id, 
        skill_id="sql.joins", 
        type="failure", 
        score=0,
        sub_skills=["left_joins", "outer_joins"]
    )
    print(f"Update 2 (Failure): {engine.update_mastery(user_id, event2)}")
    
    # Scenario: User completes a coding project successfully
    event3 = EvidenceEvent(
        event_id="e3", 
        user_id=user_id, 
        skill_id="sql.joins", 
        type="project", 
        score=95,
        sub_skills=["inner_joins", "left_joins"]
    )
    print(f"Update 3 (Project): {engine.update_mastery(user_id, event3)}")
