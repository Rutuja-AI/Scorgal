# key_manager.py
import os, time
from dotenv import load_dotenv

load_dotenv()

class GeminiKeyManager:
    def __init__(self, env_var: str = "GEMINI_KEYS"):
        """
        Initialize a key manager for a given env var.
        Example:
            GeminiKeyManager("GEMINI_KEYS")       # analysis
            GeminiKeyManager("GEMINI_KEYS_CHAT")  # chatbot
            GeminiKeyManager("GEMINI_KEYS_OCR")   # OCR
        """
        keys_str = os.getenv(env_var)
        if not keys_str:
            raise ValueError(f"No {env_var} found in .env")

        self.keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        self.index = 0
        self.usage = {k: [] for k in self.keys}
        self.env_var = env_var
        print(f"[INIT] Loaded {len(self.keys)} Gemini API keys from {env_var}.")

    def get_key(self, return_meta: bool = False):
        """
        Returns a key that is under per-minute quota.
        Rotates if the current one is overloaded.
        """
        now = time.time()
        key = self.keys[self.index]

        # cleanup old usage
        self.usage[key] = [t for t in self.usage[key] if now - t < 60]

        # allow ~55 calls/min per key
        if len(self.usage[key]) < 55:
            self.usage[key].append(now)
            count = len(self.usage[key])
            if return_meta:
                return key, self.index + 1, len(self.keys), count
            return key
        else:
            print(f"[WARN] Key {self.index+1}/{len(self.keys)} ({self.env_var}) hit per-minute limit → rotating…")
            return self.rotate_key(return_meta)

    def rotate_key(self, return_meta: bool = False):
        """
        Force rotate to the next key cyclically.
        """
        self.index = (self.index + 1) % len(self.keys)
        key = self.keys[self.index]
        print(f"[KEY] Rotated → now using key {self.index+1}/{len(self.keys)} from {self.env_var}")
        if return_meta:
            return key, self.index + 1, len(self.keys), len(self.usage[key])
        return key
