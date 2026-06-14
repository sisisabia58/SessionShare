import sys
import json
import os
import hashlib
import base64
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

SHARED_KEY = "th3k3yt0unl0ckpr3m1umt0g3th3r15gr0upyJSON"
IV_LENGTH  = 12

def encrypt(plaintext: str, key_string: str) -> str:
    key_bytes = hashlib.sha256(key_string.encode("utf-8")).digest()
    iv        = os.urandom(IV_LENGTH)
    aesgcm    = AESGCM(key_bytes)
    ct_plus_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    combined    = iv + ct_plus_tag
    return base64.b64encode(combined).decode("ascii")

def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print("  1. From a file:")
        print("     python encrypt_cookies.py <service_id> <path_to_cookies.json> [expires_in_days]")
        print("  2. By pasting directly (interactive):")
        print("     python encrypt_cookies.py <service_id> - [expires_in_days]")
        print("\nExamples:")
        print("  python encrypt_cookies.py a1b2c3d4-e5f6-7890-abcd-ef1234567890 cookies.json 30")
        print("  python encrypt_cookies.py a1b2c3d4-e5f6-7890-abcd-ef1234567890 - 30")
        sys.exit(1)

    service_id = sys.argv[1]
    cookies_path = sys.argv[2]
    expires_days = int(sys.argv[3]) if len(sys.argv) > 3 else 7

    raw_content = ""
    if cookies_path == "-":
        print("\n>>> Paste your raw JSON cookies below, then press Enter, then Ctrl+Z and press Enter again (on Windows) to submit:")
        print("-------------------------------------------------------------")
        try:
            raw_content = sys.stdin.read()
        except KeyboardInterrupt:
            print("\nAborted.")
            sys.exit(1)
        print("-------------------------------------------------------------")
    else:
        if not os.path.exists(cookies_path):
            print(f"Error: File not found at '{cookies_path}'")
            sys.exit(1)
        try:
            with open(cookies_path, "r", encoding="utf-8") as f:
                raw_content = f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            sys.exit(1)

    try:
        cookies = json.loads(raw_content, strict=False)
    except Exception as e:
        print(f"\nError: Failed to parse JSON. Please make sure you pasted a valid JSON string.")
        print(f"Details: {e}")
        sys.exit(1)

    plaintext = json.dumps(cookies, separators=(',', ':'))
    encrypted_b64 = encrypt(plaintext, SHARED_KEY)
    
    expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    sql = f"""INSERT INTO public.shared_session_cookies (service_id, encrypted_cookie_data, expires_at, is_active)
VALUES (
  '{service_id}',
  '{encrypted_b64}',
  '{expires_at}',
  true
);"""

    print()
    print("=" * 65)
    print("  COOKIES ENCRYPTED SUCCESSFULLY")
    print("=" * 65)
    print()
    print("SQL INSERT STATEMENT:")
    print("-" * 65)
    print(sql)
    print("-" * 65)
    print()
    print("Encrypted String (Raw):")
    print(encrypted_b64)
    print("=" * 65)

if __name__ == "__main__":
    main()
