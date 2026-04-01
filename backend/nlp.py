from transformers import pipeline
import time

class SentimentAnalyzer:
    def __init__(self):
        self.classifier = None

    def load_model(self):
        print("NLP 모델 로드 중... (최초 실행 시 다운로드될 수 있습니다)")
        start_time = time.time()
        # snunlp/KR-FinBert-SC 는 긍정(positive), 부정(negative), 중립(neutral)의 3가지 감정을 반환하는 한국어 모델입니다.
        self.classifier = pipeline("text-classification", model="snunlp/KR-FinBert-SC")
        print(f"NLP 모델 로드 완료! (소요 시간: {time.time() - start_time:.2f}초)")

    def analyze(self, text: str) -> str:
        if self.classifier is None:
            self.load_model()
            
        result = self.classifier(text[:512]) # 토큰 최대 길이 제한(기본 512)
        label = result[0]['label'].lower()
        
        # 라벨 값이 "positive", "negative", "neutral" 인지 확인 후 반환
        if "positive" in label:
            return "positive"
        elif "negative" in label:
            return "negative"
        else:
            return "neutral"

analyzer = SentimentAnalyzer()

def get_emotion(text: str) -> str:
    return analyzer.analyze(text)
