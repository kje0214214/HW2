from pydantic import BaseModel
from typing import Optional

class DiaryBase(BaseModel):
    content: str

class DiaryCreate(DiaryBase):
    pass

class DiaryUpdate(DiaryBase):
    pass

class DiaryResponse(DiaryBase):
    date: str
    emotion: str

    class Config:
        from_attributes = True

class MonthlyStatsResponse(BaseModel):
    positive: int
    negative: int
    neutral: int
