#!/usr/bin/env python3
"""
Send the MedCircle email mockup via MailerSend.
 
1. Put this file and medcircle-email-safe.html in the same folder
2. Run: python3 send_test_email.py
"""

import json
import urllib.request
import os

# --- Config ---
API_KEY = os.environ.get("MAILERSEND_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set MAILERSEND_API_KEY env var first")
FROM_EMAIL = "alex@deckdrop.io"
FROM_NAME = "MedCircle"
TO_EMAIL = "alexmohseni@gmail.com"
TO_NAME = "Alex Mohseni"
SUBJECT = "Your Weekly Digest \u2014 Jefferson EM Alumni Network"

# --- Load HTML ---
script_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(script_dir, "medcircle-email-safe.html")

with open(html_path, "r") as f:
    html = f.read()

print(f"Loaded HTML ({len(html)} chars)")
print(f"Sending from {FROM_EMAIL} to {TO_EMAIL}...")

# --- Send ---
payload = {
    "from": {"email": FROM_EMAIL, "name": FROM_NAME},
    "to": [{"email": TO_EMAIL, "name": TO_NAME}],
    "subject": SUBJECT,
    "html": html,
    "text": "Your weekly roundup: 4 job leads, 12 new posts, 3 new members in the Jefferson EM Alumni Network."
}

req = urllib.request.Request(
    "https://api.mailersend.com/v1/email",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    },
    method="POST"
)

try:
    resp = urllib.request.urlopen(req)
    if resp.status == 202:
        print("\n\u2705 Email sent! Check your inbox at alexmohseni@gmail.com")
        msg_id = resp.headers.get("X-Message-Id", "")
        if msg_id:
            print(f"   Message ID: {msg_id}")
    else:
        print(f"Response: {resp.status}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"\n\u274c Error {e.code}: {error_body}")
    if e.code == 422:
        print("\nHint: You may need to add a sender identity first.")
        print("Go to MailerSend > Email > Sender Identities > add hello@deckdrop.io")
        print("Or try a different from address like noreply@deckdrop.io")
