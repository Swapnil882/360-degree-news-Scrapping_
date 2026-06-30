from textblob import TextBlob
from ..config import GEMINI_API_KEY

HARMFUL_CATEGORIES = {
    "violence_incitement": ["kill", "murder", "attack", "bomb", "shooting", "violence"],
    "social_unrest": ["riot", "protest", "civil unrest", "insurgency"],
    "hate_discrimination": ["hate crime", "hate speech", "discrimination", "communal"],
    "public_safety": ["terror", "massacre", "genocide", "war crime"],
    "mental_health": ["suicide", "abuse", "exploit"],
}


def analyze_sentiment(text: str) -> tuple[str, float]:
    if not text or len(text.strip()) < 20:
        return "neutral", 0.0
    blob = TextBlob(text[:3000])
    polarity = blob.sentiment.polarity
    if polarity > 0.1:
        return "positive", round(polarity, 4)
    elif polarity < -0.1:
        return "negative", round(polarity, 4)
    return "neutral", round(polarity, 4)


def check_harmful(title: str, text: str) -> tuple[bool, str]:
    combined = (title + " " + text).lower()
    reasons = []
    severity = 0
    for category, keywords in HARMFUL_CATEGORIES.items():
        found = [kw for kw in keywords if kw in combined]
        if found:
            severity += len(found)
            reasons.append(f"{category.replace('_', ' ').title()}: {', '.join(found)}")
    if severity >= 2:
        return True, "; ".join(reasons[:3])
    return False, ""


FAKE_KEYWORDS = ["shocking", "unbelievable", "secret they don't want you to know", "proof", "miracle cure", "conspiracy", "exposed", "must watch"]

def check_fake_news(title: str, text: str) -> tuple[float, str, str]:
    combined = (title + " " + text).lower()
    score = 85.0
    reasons = []
    
    if len(title) < 20 or len(title) > 150:
        score -= 5
        reasons.append("Non-standard title length")
        
    found_keywords = [kw for kw in FAKE_KEYWORDS if kw in combined]
    if found_keywords:
        score -= len(found_keywords) * 15
        reasons.append(f"Sensationalist keywords found: {', '.join(found_keywords)}")
        
    if title.count("!") > 1 or combined.count("!!!") > 0:
        score -= 10
        reasons.append("Excessive exclamation marks")
        
    caps_words = len([w for w in title.split() if w.isupper() and len(w) > 2])
    if caps_words > 2:
        score -= 10
        reasons.append("Excessive capitalization in title")
        
    score = max(0.0, min(100.0, score))
    if score >= 80:
        classification = "Credible"
    elif score >= 60:
        classification = "Unverified"
    else:
        classification = "Suspicious"
        
    reason_str = "; ".join(reasons) if reasons else "Meets basic credibility baseline criteria."
    return score, classification, reason_str


def analyze_with_gemini(title: str, text: str) -> dict | None:
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Analyze this news article:
Title: {title}
Content: {text[:2000]}

Return JSON with:
1. sentiment: positive/negative/neutral
2. sentiment_score: -1 to 1
3. is_harmful: true/false
4. harm_reason: brief explanation if harmful
5. trust_score: value from 0 to 100 representing credibility
6. trust_classification: one of 'Credible', 'Unverified', 'Suspicious', 'Satire'
7. fake_reason: brief explanation of why it might be fake or unverified if trust_score is below 70"""
        resp = model.generate_content(prompt)
        import json
        cleaned = resp.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except Exception:
        return None
