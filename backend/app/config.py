from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str = ""
    ai_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    ai_chat_model: str = "gemini-2.5-flash"
    ai_embed_model: str = "gemini-embedding-001"
    jwt_secret: str
    jwt_expire_minutes: int = 1440

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
