## Deployment Commands
```bash
# Clone and run locally
git clone <your-repo>
cd discord-infra-phish
pip install -r requirements.txt
python server.py

# For production (with nginx reverse proxy)
gunicorn --bind 0.0.0.0:5000 server:app
