import json
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class EngagementData:
    days_inactive: int
    sessions_last_7_days: int
    avg_session_duration: int  # in minutes

@dataclass
class PerformanceData:
    recent_failures: int
    recent_successes: int
    completion_rate: float # 0.0 to 1.0

@dataclass
class SkillStabilityData:
    confidence_current: float
    confidence_previous: float

@dataclass
class ContextualData:
    weekly_time_available: float # in hours
    assigned_workload_hours: float

class DropoutPredictor:
    """
    Senior Learning Analytics Architect Implementation: 
    Early Intervention & Struggle Detection Engine.
    """

    def __init__(self):
        # Rule-based thresholds are initialized here for easy tuning
        self.max_inactivity_norm = 7 # normalize over 1 week
        self.high_risk_threshold = 0.7
        self.med_risk_threshold = 0.4

    def predict(self, engagement: EngagementData, performance: PerformanceData, 
                stability: SkillStabilityData, context: ContextualData) -> Dict[str, Any]:
        """
        Main predictor pipeline.
        Calculates Features -> Evaluates Rules -> Determines Intervention.
        """
        
        # 1. Feature Engineering (Section 3.0)
        features = self._engineer_features(engagement, performance, stability, context)
        
        # 2. Risk Calculation (Section 4.0)
        risk_evaluation = self._evaluate_risk(features)
        
        # 3. Intervention Mapping (Section 6.0)
        intervention = self._determine_intervention(risk_evaluation, features)
        
        # 4. Final Output Construction (Section 8.0)
        return self._format_output(risk_evaluation, features, intervention)

    def _engineer_features(self, eng: EngagementData, perf: PerformanceData, 
                           stab: SkillStabilityData, ctx: ContextualData) -> Dict[str, float]:
        """
        Transforms raw signals into normalized metrics.
        """
        # 3.1 Inactivity Score
        inactivity_score = min(eng.days_inactive / self.max_inactivity_norm, 1.0)
        
        # 3.2 Failure Density
        total_attempts = perf.recent_failures + perf.recent_successes
        failure_density = perf.recent_failures / total_attempts if total_attempts > 0 else 0.0
        
        # 3.3 Confidence Delta (Drop)
        confidence_drop = stab.confidence_current - stab.confidence_previous
        
        # 3.4 Time Pressure Ratio
        time_pressure = ctx.assigned_workload_hours / ctx.weekly_time_available if ctx.weekly_time_available > 0 else 1.0
        
        return {
            "inactivity_score": inactivity_score,
            "failure_density": failure_density,
            "confidence_drop": confidence_drop,
            "time_pressure": time_pressure,
            "completion_rate": perf.completion_rate,
            "confidence_current": stab.confidence_current,
            "days_inactive": eng.days_inactive
        }

    def _evaluate_risk(self, f: Dict[str, float]) -> Dict[str, Any]:
        """
        Rule-based risk scoring logic (Section 4.1).
        """
        is_high = (
            (f["days_inactive"] > 3 and f["confidence_current"] < 0.6) or
            (f["failure_density"] > 0.6 and f["confidence_drop"] < -0.1) or
            (f["time_pressure"] > 1.3)
        )
        
        is_med = (
            not is_high and (
                f["days_inactive"] >= 2 or
                f["failure_density"] > 0.4
            )
        )
        
        signals = []
        if f["days_inactive"] >= 2: signals.append(f"{f['days_inactive']} days inactivity")
        if f["confidence_drop"] < -0.05: signals.append(f"confidence dropped by {abs(round(f['confidence_drop']*100))}%")
        if f["failure_density"] > 0.5: signals.append("multiple recent failures")
        if f["time_pressure"] > 1.2: signals.append("workload exceeds time budget")

        if is_high:
            return {"level": "high", "signals": signals}
        elif is_med:
            return {"level": "medium", "signals": signals}
        else:
            return {"level": "low", "signals": ["normal progress"]}

    def _determine_intervention(self, risk: Dict[str, Any], f: Dict[str, float]) -> Dict[str, Any]:
        """
        Selects the single most impactful supportive action (Section 6.1).
        """
        if risk["level"] == "low":
            return {"type": "none", "description": "Maintain current path"}

        # Priority-based intervention selection
        if f["confidence_current"] < 0.6:
            return {
                "type": "simpler_resource",
                "cause": "confidence_loss",
                "description": "Switch to a more visual/example-heavy explanation to rebuild confidence."
            }
        
        if f["failure_density"] > 0.6:
            return {
                "type": "alternate_format",
                "cause": "learning_friction",
                "description": "Current format isn't clicking. Trying a different instructional style (e.g., Video to Practice)."
            }
            
        if f["days_inactive"] > 3:
            return {
                "type": "motivational_nudge",
                "cause": "disengagement",
                "description": "Send an encouraging milestone reminder to spark re-engagement."
            }
            
        if f["time_pressure"] > 1.2:
            return {
                "type": "shorter_tasks",
                "cause": "overload",
                "description": "Break down upcoming tasks into smaller, micro-learning chunks."
            }

        return {
            "type": "guided_explanation",
            "cause": "confusion",
            "description": "Provide a step-by-step walkthrough of the most recent challenging topic."
        }

    def _format_output(self, risk: Dict[str, Any], f: Dict[str, float], intervention: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensures strict JSON contract (Section 8.0).
        """
        return {
            "risk_level": risk["level"],
            "signals_detected": risk["signals"],
            "primary_cause": intervention.get("cause", "none"),
            "recommended_action": {
                "type": intervention["type"],
                "description": intervention["description"]
            }
        }

# --- MODULE INTEGRATION TEST ---
if __name__ == "__main__":
    predictor = DropoutPredictor()
    
    # CASE 1: High Risk (Overload + Inactive)
    e1 = EngagementData(days_inactive=4, sessions_last_7_days=1, avg_session_duration=10)
    p1 = PerformanceData(recent_failures=1, recent_successes=0, completion_rate=0.2)
    s1 = SkillStabilityData(confidence_current=0.5, confidence_previous=0.7)
    c1 = ContextualData(weekly_time_available=5, assigned_workload_hours=8)
    
    print("\n--- DROPOUT PREDICTOR: HIGH RISK CASE ---")
    print(json.dumps(predictor.predict(e1, p1, s1, c1), indent=2))
    
    # CASE 2: Low Risk (Steady Progress)
    e2 = EngagementData(days_inactive=0, sessions_last_7_days=5, avg_session_duration=45)
    p2 = PerformanceData(recent_failures=1, recent_successes=8, completion_rate=0.9)
    s2 = SkillStabilityData(confidence_current=0.85, confidence_previous=0.82)
    c2 = ContextualData(weekly_time_available=10, assigned_workload_hours=4)
    
    print("\n--- DROPOUT PREDICTOR: LOW RISK CASE ---")
    print(json.dumps(predictor.predict(e2, p2, s2, c2), indent=2))
