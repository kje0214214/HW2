from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List
import os

import models
import schemas
from database import engine, get_db
import nlp

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sentiment Analysis Diary API")

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/diary/{date}", response_model=schemas.DiaryResponse)
def create_or_update_diary(date: str, diary_data: schemas.DiaryCreate, db: Session = Depends(get_db)):
    # 1. 감정 분석 실행
    emotion = nlp.get_emotion(diary_data.content)
    
    # 2. 기존 데이터 확인 
    existing_diary = db.query(models.Diary).filter(models.Diary.date == date).first()
    
    if existing_diary:
        # 업데이트
        existing_diary.content = diary_data.content
        existing_diary.emotion = emotion
        db.commit()
        db.refresh(existing_diary)
        return existing_diary
    else:
        # 생성
        new_diary = models.Diary(date=date, content=diary_data.content, emotion=emotion)
        db.add(new_diary)
        db.commit()
        db.refresh(new_diary)
        return new_diary

@app.get("/api/diary/{date}", response_model=schemas.DiaryResponse)
def get_diary(date: str, db: Session = Depends(get_db)):
    diary = db.query(models.Diary).filter(models.Diary.date == date).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found for this date")
    return diary

@app.delete("/api/diary/{date}", status_code=204)
def delete_diary(date: str, db: Session = Depends(get_db)):
    diary = db.query(models.Diary).filter(models.Diary.date == date).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    db.delete(diary)
    db.commit()
    return None

@app.get("/api/diary/monthly/{year_month}", response_model=List[schemas.DiaryResponse])
def get_monthly_diaries(year_month: str, db: Session = Depends(get_db)):
    """year_month format: YYYY-MM"""
    # SQLite 쿼리로 해당 달 문자열로 시작하는 날짜의 데이터를 가져옴
    diaries = db.query(models.Diary).filter(models.Diary.date.like(f"{year_month}-%")).all()
    return diaries

# 프론트엔드 정적 파일 서빙 (루트 경로)
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
