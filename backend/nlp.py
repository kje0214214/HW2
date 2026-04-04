from transformers import pipeline
import time

class SentimentAnalyzer:
    def __init__(self):
        self.classifier = None

    def load_model(self):
        print("NLP 모델 로드 중... (최초 실행 시 다운로드될 수 있습니다)")
        start_time = time.time()
        # matthew1031/ko-sentiment-analysis 는 영화 리뷰 기반 일상어 감정 분석에 특화된 모델입니다.
        # 모든 라벨(긍정/부정)의 점수를 반환받기 위해 return_all_scores=True를 설정합니다.
        self.classifier = pipeline("text-classification", model="matthew1031/ko-sentiment-analysis", return_all_scores=True)
        print(f"NLP 모델 로드 완료! (소요 시간: {time.time() - start_time:.2f}초)")

    def analyze(self, text: str) -> str:
        if self.classifier is None:
            self.load_model()
            
        results = self.classifier(text[:512]) # 토큰 최대 길이 제한(기본 512)
        # return_all_scores=True인 경우 `[[{'label': 'LABEL_0', 'score': ...}, ...]]` 형태로 리턴됩니다.
        scores = results[0]
        
        pos_score = 0.0
        neg_score = 0.0
        
        for item in scores:
            label = item['label'].upper()
            if label == 'LABEL_1' or label == '1' or 'POS' in label:
                pos_score = item['score']
            elif label == 'LABEL_0' or label == '0' or 'NEG' in label:
                neg_score = item['score']
        
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
