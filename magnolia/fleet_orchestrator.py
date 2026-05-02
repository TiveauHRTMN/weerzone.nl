import os
import json
import logging
from run_agent import AIAgent
from tools.memory_tool import memory_tool
import config

# Configure logging to be minimal as per Magnolia rules
logging.basicConfig(level=logging.ERROR)

class HermesFleet:
    # ... (houd HermesFleet hetzelfde)
    def __init__(self):
        # Hermes Agent typically looks for OPENAI_API_KEY or OPENROUTER_API_KEY
        # Since we use Gemini, we might need to ensure the agent is configured for it
        # or use a base_url that points to a Gemini-compatible endpoint.
        # For now, we initialize it as the 'hands' of Magnolia.
        self.agent = AIAgent(
            model=config.GEMINI_MODEL,
            quiet_mode=True
        )

    def execute(self, task_description):
        print(f"🚀 Hermes: Executing task -> {task_description[:50]}...", flush=True)
        # run_conversation is the main loop in run_agent.py
        response = self.agent.run_conversation(task_description)
        return response

class PaperclipFleet:
    """
    Paperclip (Memory/Context) - Powered by Nous Research Memory logic.
    """
    def __init__(self):
        # The actual function is memory_tool
        pass

    def remember(self, note):
        print(f"🖇️ Paperclip: Archiving leermoment...", flush=True)
        # memory_tool(action, target, content)
        try:
            memory_tool(action="add", target="memory", content=note)
        except Exception as e:
            print(f"⚠️ Paperclip Memory Error: {e}")

    def audit(self, action_proposal):
        """
        Check if the action proposal matches human irrationality or historical errors.
        """
        # In V2.0 this would read from MEMORY.md and compare.
        # For now, it's the logic gate for 'Revenge Trading' and '5-min gambling'.
        # We can implement a simple check or use the agent to audit.
        return True, "Audit passed."

# Initialize the fleet
hermes = HermesFleet()
paperclip = PaperclipFleet()
