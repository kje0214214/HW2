from transformers import pipeline

classifier = pipeline('text-classification', model='matthew1031/ko-sentiment-analysis', return_all_scores=True)
results = classifier(['정말 행복해', '화난다', '화나요', '오늘 점심은 햄버거다'])

for r in results:
    score_pos = next(x['score'] for x in r if x['label'] == 'LABEL_1' or x['label'] == '1' or x['label'] == '1.0' or 'positive' in x['label'].lower())
    score_neg = next(x['score'] for x in r if x['label'] == 'LABEL_0' or x['label'] == '0' or x['label'] == '0.0' or 'negative' in x['label'].lower())
    print(score_pos, score_neg)
