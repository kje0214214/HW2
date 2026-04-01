# 베이스 이미지로 가벼운 python slim 버전을 사용합니다.
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 설치 시 캐시 최적화를 위해 의존성 파일부터 복사
COPY backend/requirements.txt ./backend/

# 컨테이너 용량을 최소화(수 기가바이트 절약)하기 위해 GPU 버전을 제외한 CPU 전용 PyTorch를 설치한 후 나머지 패키지를 설치
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r backend/requirements.txt

# 사전 학습된 모델을 빌드 시점에 아예 다운로드받아 두면 컨테이너 최초 실행 시 지연시간을 없앨 수 있습니다.
# 백엔드 코드가 동작하기 전에 python에서 모델을 한번 캐싱하게 만듭니다.
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='snunlp/KR-FinBert-SC')"

# 프론트엔드 정적 파일 스크립트 복사
COPY frontend/ ./frontend/

# 백엔드 스크립트 복사
COPY backend/ ./backend/

# 작업 디렉토리를 백엔드 앱 경로로 이동
WORKDIR /app/backend

# 8000 포트 개방
EXPOSE 8000

# 컨테이너 실행 명령 (외부 접속을 허용하기 위해 host 옵션을 0.0.0.0 으로 설정)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
