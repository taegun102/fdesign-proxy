// utils/translatePrompt.js

export async function translateToEnglish(koreanText) {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ koreanText }),
      });
  
      if (!res.ok) {
        console.error('❌ 번역 요청 실패:', res.status);
        return 'Translation failed';
      }
  
      const data = await res.json();
      return data.translated;
    } catch (err) {
      console.error('❌ 번역 중 에러 발생:', err);
      return 'Translation error';
    }
  }