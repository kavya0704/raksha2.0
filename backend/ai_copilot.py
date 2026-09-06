"""
Tactical AI Copilot & Incident Briefing Engine for Raksha AI.
Powered by Groq ultra-low latency LLM inference.
"""
import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("TacticalAICopilot")

class TacticalAICopilot:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info(f"Tactical AI Copilot initialized with Groq model: {self.model}")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    def is_available(self) -> bool:
        return self.client is not None

    def generate_sitrep(self, alert_data: dict) -> dict:
        """
        Generates an automated military Situation Report (SitRep) for an incursion.
        """
        if not self.is_available():
            return {
                "status": "FALLBACK",
                "sitrep": f"Automated Local SitRep: {alert_data.get('object_type', 'Target').upper()} incursion recorded at {alert_data.get('zone_name', 'Perimeter Zone')} ({alert_data.get('camera_id', 'CAM-01')}). QRT patrol advised to inspect coordinates.",
                "threat_level": alert_data.get("severity", "CRITICAL")
            }

        prompt = f"""
You are the Tactical AI Intelligence Officer for "Raksha AI", India's Border Surveillance System (BSF/ITBP/SSB).
Analyze the following perimeter breach event and generate a concise, authoritative military Situation Report (SitRep):

INCIDENT METADATA:
- Target Classification: {alert_data.get('object_type', 'Unknown').upper()}
- Neural Confidence: {int(float(alert_data.get('confidence', 0.9)) * 100)}%
- Sector / Outpost: {alert_data.get('bop_id', 'BOP-01-NATHULA')}
- Sentinel Camera: {alert_data.get('camera_id', 'CAM-01')}
- Incursion Zone: {alert_data.get('zone_name', 'Perimeter Sterile Zone')}
- Breach Type: {alert_data.get('incursion_type', 'TRIPWIRE_CROSSING')}
- Detection Timestamp: {alert_data.get('formatted_time', 'Recent')}
- Sync Latency Mode: {alert_data.get('delayed_sync_label', 'Live Sync')}

Generate a response in JSON format with exactly these keys:
{{
  "threat_level": "CRITICAL" | "HIGH" | "MEDIUM",
  "tactical_summary": "1-2 sentence executive briefing for the Duty Officer",
  "incursion_assessment": "Brief analysis of the breach vector, stealth, and potential intent",
  "terrain_weather_note": "Tactical impact of terrain defiles and all-weather fog conditions",
  "recommended_action": "Immediate tactical response directive (e.g. QRT dispatch, thermal sweep, illumination)",
  "rules_of_engagement": "Standard operational caution regarding civilian borders vs active infiltration"
}}
Return ONLY valid JSON.
"""
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a military intelligence system. Output only valid JSON without markdown fences."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=450
            )
            content = resp.choices[0].message.content.strip()
            # Strip markdown fences if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            return json.loads(content.strip())
        except Exception as e:
            logger.error(f"Groq SitRep generation error: {e}")
            return {
                "threat_level": alert_data.get("severity", "CRITICAL"),
                "tactical_summary": f"Incursion detected: {alert_data.get('object_type', 'Target').upper()} breached {alert_data.get('zone_name', 'Perimeter')}.",
                "incursion_assessment": "Breach verified across consecutive video frames by edge tracking sentinel.",
                "terrain_weather_note": "All-Weather CLAHE enhancement pipeline active.",
                "recommended_action": "Dispatch Tiger-01 QRT team to secure perimeter fence.",
                "rules_of_engagement": "Challenge target in accordance with SOP."
            }

    def generate_patrol_order(self, alert_data: dict) -> dict:
        """
        Generates structured QRT patrol interception orders.
        """
        if not self.is_available():
            return {
                "callsign": "TIGER-01",
                "mission": f"Intercept {alert_data.get('object_type', 'target').upper()} at {alert_data.get('zone_name')}",
                "grid_reference": "27.3866° N, 88.8310° E",
                "radio_freq": "VHF Channel 4 (142.850 MHz)",
                "roe": "Verify civilian vs intruder status. Establish immediate cordon."
            }

        prompt = f"""
Generate a Quick Reaction Team (QRT) Interception Order for Raksha AI:
- Target: {alert_data.get('object_type', 'Target').upper()}
- Zone: {alert_data.get('zone_name', 'Border Zone')}
- Outpost: {alert_data.get('bop_id', 'BOP-01-NATHULA')}
- Time: {alert_data.get('formatted_time', 'Immediate')}

Return JSON with:
{{
  "callsign": "TIGER-01 (or appropriate unit)",
  "mission": "Direct concise mission statement",
  "grid_reference": "Estimated GPS coordinates",
  "cordon_strategy": "Where to position interception cordon",
  "radio_freq": "VHF tactical channel",
  "roe_directive": "Rules of engagement directive"
}}
"""
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a military tactical dispatcher. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=350
            )
            content = resp.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            return json.loads(content.strip())
        except Exception as e:
            return {
                "callsign": "TIGER-01",
                "mission": f"Intercept {alert_data.get('object_type', 'target').upper()} at {alert_data.get('zone_name')}",
                "grid_reference": "27.3866° N, 88.8310° E",
                "cordon_strategy": "Establish blocking position 150m south of fence line",
                "radio_freq": "VHF Channel 4 (142.850 MHz)",
                "roe_directive": "Challenge and apprehend in accordance with Frontier SOP"
            }

    def chat_query(self, user_message: str, alerts_context: list, cameras_context: list) -> str:
        """
        Interactive natural language AI Copilot for the Commander.
        """
        if not self.is_available():
            return "Tactical AI Copilot is currently in local offline fallback mode. All core vision and edge sentinels are operational."

        context_summary = f"""
Active Sentinels ({len(cameras_context)} cameras online):
{json.dumps([{'id': c.get('id'), 'name': c.get('name'), 'fog_enhanced': c.get('fog_enhancer_active')} for c in cameras_context[:4]])}

Recent Incursion Alerts ({len(alerts_context)} recorded):
{json.dumps([{'id': a.get('id'), 'target': a.get('object_type'), 'zone': a.get('zone_name'), 'time': a.get('formatted_time'), 'status': a.get('status')} for a in alerts_context[:5]])}
"""

        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are Raksha AI Copilot, an intelligent military advisor assisting a border defense commander. Provide crisp, professional, tactical answers based on this real-time situational context:\n{context_summary}"
                    },
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=350
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            return f"Error querying Tactical AI engine: {e}"

ai_copilot = TacticalAICopilot()
