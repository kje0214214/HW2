from sqlalchemy import Column, String, Text
from database import Base

class Diary(Base):
    __tablename__ = "diaries"

    # 날짜(YYYY-MM-DD) 단위로 하나의 일기만 작성한다고 가정하므로 PK로 사용합니다.
    date = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    emotion = Column(String, nullable=False)  # "positive", "negative", "neutral"
