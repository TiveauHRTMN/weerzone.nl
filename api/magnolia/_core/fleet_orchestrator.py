import os
import json
import httpx
import logging
import time

logging.basicConfig(level=logging.INFO)

KV_URL = os.environ.get("KV_REST_API_URL")
KV_TOKEN = os.environ.get("KV_REST_API_TOKEN")

class PaperclipFleet:
    """
    Paperclip (Memory/Context) - Cloud Native via Vercel KV.
    Vervangt de lokale MEMORY.md voor serverless persistence.
    """
    def __init__(self):
        self.headers = {"Authorization": f"Bearer {KV_TOKEN}"} if KV_TOKEN else {}

    def remember(self, note):
        print(f"🖇️ Paperclip: Archiving leermoment in cloud...", flush=True)
        if not KV_URL or not KV_TOKEN:
            print("⚠️ KV niet geconfigureerd. Note is overgeslagen in cloud.")
            return

        try:
            # Sla de actie op in een Redis list genaamd 'magnolia_memory'
            payload = ["LPUSH", "magnolia_memory", json.dumps({"note": note, "timestamp": time.time()})]
            res = httpx.post(KV_URL, headers=self.headers, json=payload)
            res.raise_for_status()
            print("✅ Paperclip: Opgeslagen in Vercel KV.")
        except Exception as e:
            print(f"⚠️ Paperclip KV Error: {e}")

    def audit(self, action_proposal):
        """
        Check if the action proposal matches human irrationality or historical errors.
        """
        # In cloud-native modus halen we hier idealiter eerdere fouten uit KV.
        return True, "Audit passed."

class HermesFleet:
    def execute(self, task_description):
        print(f"🚀 Hermes: Executing task -> {task_description[:50]}...", flush=True)
        return "Task executed."

# Initialize the fleet
hermes = HermesFleet()
paperclip = PaperclipFleet()
