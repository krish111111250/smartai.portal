from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .router import router as id_router

# Create the database tables in Postgres automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Digital Student ID Portal")

# Allow your React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the routes we will write in the next step
app.include_router(id_router, prefix="/api/student-id", tags=["Digital ID Operations"])

@app.get("/")
def read_root():
    return {"message": "Digital ID Backend is Running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002) # Port 8002 so it doesn't clash with Quiz