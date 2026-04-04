from transformers import pipeline
import time

class SentimentAnalyzer:
    def __init__(self):
        self.classifier = None

    def load_model(self):
        print("NLP 모델 로드 중... (최초 실행 시 다운로드될 수 있습니다)")
        start_time = time.time()
        # nlptown/bert-base-multilingual-uncased-sentiment 는 다국어(한국어 포함) 1~5성급 리뷰 감정 분석 모델입니다.
        self.classifier = pipeline("text-classification", model="nlptown/bert-base-multilingual-uncased-sentiment", return_all_scores=True)
        print(f"NLP 모델 로드 완료! (소요 시간: {time.time() - start_time:.2f}초)")

    def analyze(self, text: str) -> str:
        if self.classifier is None:
            self.load_model()
            
        results = self.classifier(text[:512]) # 토큰 최대 길이 제한(기본 512)
        scores = results[0]
        
        pos_score = 0.0
        neg_score = 0.0
        
        for item in scores:
            label = item['label']
            if label in ['4 stars', '5 stars']:
                pos_score += item['score']
            elif label in ['1 star', '2 stars']:
                neg_score += item['score']
        
        # 확실한 감정(0.6 이상)이 감지될 때만 긍정/부정 판단, 애매하면 중립
        if pos_score >= 0.6:
            return "positive"
        elif neg_score >= 0.6:
            return "negative"
        else:
            return "neutral"

analyzer = SentimentAnalyzer()

def get_emotion(text: str) -> str:
    return analyzer.analyze(text)
