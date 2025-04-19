// server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();

// ✅ CORS 허용 도메인 지정 (보안)
app.use(cors({
  origin: ['https://fdesign.vercel.app', 'http://localhost:3000'],
}));

app.use(express.json());

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_VERSION_ID = '55a41a6a19205f74a3ee0ec4186972fefe4039c8598c701a7a24afd45bcb127b';

// ✅ 이미지 생성 API
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt가 없습니다.' });
  }

  console.log('📨 받은 프롬프트:', prompt);

  try {
    // 1단계: 예측 생성 요청
    const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: REPLICATE_VERSION_ID,
        input: { prompt },
      }),
    });

    const prediction = await predictionRes.json();

    if (!prediction?.urls?.get || !prediction?.id) {
      console.error('❌ 예측 ID 없음:', prediction);
      return res.status(500).json({ error: '예측 ID를 받지 못했습니다.' });
    }

    const getUrl = prediction.urls.get;

    // 2단계: 상태 확인 (최대 55초 폴링)
    const maxWait = 55;
    let elapsed = 0;
    let statusJson;

    while (elapsed < maxWait) {
      await new Promise((r) => setTimeout(r, 1000));
      elapsed++;

      const statusRes = await fetch(getUrl, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });

      statusJson = await statusRes.json();

      if (statusJson.status === 'succeeded') break;
      if (statusJson.status === 'failed') break;
    }

    if (statusJson.status === 'succeeded') {
      const image = Array.isArray(statusJson.output)
        ? statusJson.output[0]
        : statusJson.output;

      if (!image || typeof image !== 'string') {
        return res.status(500).json({ error: '이미지 URL이 유효하지 않습니다.' });
      }

      return res.json({ image });
    } else {
      console.error('❌ 이미지 생성 실패:', statusJson);
      return res.status(500).json({ error: '이미지 생성 실패' });
    }
  } catch (err) {
    console.error('❌ 서버 오류:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
