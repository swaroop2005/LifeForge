from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    greenpt_api_key: str
    greenpt_base_url: str = "https://api.greenpt.ai/v1"
    jwt_secret: str
    jwt_expire_minutes: int = 1440

    class Config:
        env_file = ".env"

settings = Settings()
