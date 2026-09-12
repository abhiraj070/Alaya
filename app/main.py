from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.messages import router as messages_router
from app.api.user import router as user_router



app= FastAPI(title='Alaya')

app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(user_router, prefix="/api")
