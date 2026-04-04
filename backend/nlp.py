from transformers import pipeline
import time

class SentimentAnalyzer:
    def __init__(self):
        self.classifier = None

    def load_model(self):
        print("NLP 모델 로드 중... (최초 실행 시 다운로드될 수 있습니다)")
        start_time = time.time()
        # jaehyeong/koelectra-base-v3-generalized-sentiment-analysis 는 아주 뛰어난 한국어 감정 분류 모델입니다.
        self.classifier = pipeline("text-classification", model="jaehyeong/koelectra-base-v3-generalized-sentiment-analysis")
        print(f"NLP 모델 로드 완료! (소요 시간: {time.time() - start_time:.2f}초)")

    def analyze(self, text: str) -> str:
        if self.classifier is None:
            self.load_model()
            
        results = self.classifier(text[:512]) # 토큰 최대 길이 제한(기본 512)
        
        # 반환 형태 파싱
        score_dict = results[0] if isinstance(results, list) else results
        
        label = score_dict['label']
        score = score_dict['score']
        
        # 예측 확신도(score)가 0.6 미만으로 애매하다면 중립 반환
        if score < 0.6:
            return "neutral"
        
        # 1은 긍정, 0은 부정 (확신도가 0.6 이상일 때만 도달함)
        if label == '1' or 'POS' in label.upper():
            return "positive"
        elif label == '0' or 'NEG' in label.upper():
            return "negative"
        else:
            return "neutral"

analyzer = SentimentAnalyzer()

def get_emotion(text: str) -> str:
    return analyzer.analyze(text)
