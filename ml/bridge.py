import sys
import json
import traceback
from skill_inference import SkillInferenceEngine, Skill, EvidenceEvent
from recommender import HybridRecommender, UserContext
from mentor_coach import GroundedMentorCoach, MockVectorDB
from dropout_predictor import DropoutPredictor, EngagementData, PerformanceData, SkillStabilityData, ContextualData
from role_config import ROLE_CONFIGS
from diagnostic import DiagnosticGenerator

def main():
    # Read command and payload from stdin
    try:
        input_data = sys.stdin.read()
        if not input_data:
            return
        
        request = json.loads(input_data)
        command = request.get("command")
        payload = request.get("payload")

        if command == "infer":
            engine = SkillInferenceEngine()
            role_name = payload.get("goal_role", "Data Analyst")
            role_config = ROLE_CONFIGS.get(role_name, ROLE_CONFIGS["Data Analyst"])
            
            # Register role-specific skills
            for skill_id, info in role_config.items():
                engine.register_skill(Skill(
                    skill_id=skill_id,
                    name=info["name"],
                    parent_skill=info["parent"]
                ))
            
            user_id = payload.get("user_id")
            events = payload.get("events", [])
            results = []
            for e in events:
                event = EvidenceEvent(
                    event_id=e.get("event_id", "evt"),
                    user_id=user_id,
                    skill_id=e.get("skill_id"),
                    type=e.get("type"),
                    score=e.get("score") * 100 if e.get("score") <= 1.0 else e.get("score"),
                    sub_skills=e.get("sub_skills", [])
                )
                results.append(engine.update_mastery(user_id, event))
            
            # Recalculate readiness after inference
            recommender = HybridRecommender()
            m1_state = {"skills": {r["skill_id"]: r for r in results}} # Simplified state for readiness
            readiness = recommender.calculate_readiness(m1_state, role_name)
            
            print(json.dumps({
                "updates": results,
                "readiness": readiness
            }))

        elif command == "recommend":
            recommender = HybridRecommender()
            m1_data = payload.get("m1_data")
            user_ctx_raw = payload.get("user_context")
            
            context = UserContext(
                user_id=user_ctx_raw.get("user_id"),
                goal_role=user_ctx_raw.get("goal_role"),
                time_per_week=user_ctx_raw.get("time_per_week"),
                learning_style=user_ctx_raw.get("learning_style"),
                experience_level=user_ctx_raw.get("experience_level")
            )
            
            recs = recommender.recommend(m1_data, context)
            print(json.dumps(recs))

        elif command == "chat":
            vdb = MockVectorDB()
            coach = GroundedMentorCoach(vdb)
            query = payload.get("query")
            m1_state = payload.get("m1_state")
            m1_state["goal_role"] = payload.get("goal_role", "Data Analyst")
            
            response = coach.chat(query, m1_state)
            print(json.dumps(response))

        elif command == "readiness":
            recommender = HybridRecommender()
            m1_data = payload.get("m1_data")
            role = payload.get("goal_role", "Data Analyst")
            readiness = recommender.calculate_readiness(m1_data, role)
            print(json.dumps(readiness))

        elif command == "diagnostic":
            gen = DiagnosticGenerator()
            role = payload.get("goal_role", "Data Analyst")
            level = payload.get("level", "Beginner")
            questions = gen.generate(role, level)
            print(json.dumps(questions))

        elif command == "predict":
            predictor = DropoutPredictor()
            eng = EngagementData(**payload.get("engagement"))
            perf = PerformanceData(**payload.get("performance"))
            stab = SkillStabilityData(**payload.get("stability"))
            ctx = ContextualData(**payload.get("context"))
            
            prediction = predictor.predict(eng, perf, stab, ctx)
            print(json.dumps(prediction))

        else:
            print(json.dumps({"error": "Unknown command"}))

    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }))

if __name__ == "__main__":
    main()
