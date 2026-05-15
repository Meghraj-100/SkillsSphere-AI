from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.transcription import router as transcription_router

app = FastAPI(
    title="Interview AI Service",
    description="Python AI microservice for the SkillsSphere AI Interview Engine. Handles speech-to-text transcription and answer evaluation.",
    version="1.0.0",
)

# Allow the Node.js backend to communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint for the Node.js backend to verify service availability."""
    return {"status": "ok", "service": "interview-ai-service"}


# Register routers
app.include_router(transcription_router, prefix="/api")
