from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from analyze_service import analyze_code

app = FastAPI()

# Allow frontend (React on port 3000) to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    code: str
    mode: str = "review"

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    print("Request received:", request.mode, len(request.code)) 
    if not request.code or not request.code.strip():
        return JSONResponse(status_code=400, content={"error": "Code is required"})

    try:
        return StreamingResponse(
            analyze_code(request.code, request.mode),
            media_type="text/plain"
        )
    except Exception as err:
        print(f"Error: {err}")
        return JSONResponse(status_code=500, content={"error": str(err)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)