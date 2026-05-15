# Interview AI Service

Python AI microservice for the SkillsSphere AI Interview Engine. Handles speech-to-text transcription using faster-whisper.

## Tech Stack

- **Python 3.10+**
- **FastAPI** — API framework
- **faster-whisper** — Speech-to-text (CTranslate2-based Whisper)

## Setup

```bash
# Navigate to the service directory
cd interview-ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

## Running

```bash
# Start the server (default port 8000)
uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`.

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok", "service": "interview-ai-service" }
```

### Transcribe Audio
```
POST /api/transcribe
Content-Type: multipart/form-data
Body: audio file (webm, wav, mp3, ogg, m4a)

Response: { "transcript": "The virtual DOM is a lightweight..." }
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `WHISPER_MODEL_SIZE` | `base` | Whisper model size: tiny, base, small, medium, large-v3 |

Use `tiny` for fast development, `base` or `small` for production.

## Integration

The Node.js backend calls this service via HTTP. Configure the URL in the server `.env`:

```
INTERVIEW_AI_URL=http://localhost:8000
```

## Related

- Discussion: #237 (Ai interview plan)
- Node.js integration: `server/src/integrations/aiInterviewService.js`
