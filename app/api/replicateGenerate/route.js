// app/api/replicateGenerate/route.js

import { NextResponse } from 'next/server';

export async function POST(req) {
  const { prompt } = await req.json();
  console.log('📨 받은 프롬포트:', prompt);

  const replicateApiKey = process.env.REPLICATE_API_TOKEN;
  const version = '55a41a6a19205f74a3ee0ec4186972fefe4039c8598c701a7a24afd45bcb127b'; // 모델 버전 ID

  // 1. 예측 생성
  const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${replicateApiKey}`,
    },
    body: JSON.stringify({
      version,
      input: {
        prompt,
      },
    }),
  });

  const prediction = await predictionRes.json();
  console.log('🛰 Replicate 응답 전체:', prediction);

  if (!prediction?.urls?.get) {
    return NextResponse.json({ error: 'getUrl required' }, { status: 400 });
  }

  // 2. 상태 확인 및 대기
  let statusResponse = await fetch(prediction.urls.get, {
    headers: {
      Authorization: `Token ${replicateApiKey}`,
    },
  });

  let status = await statusResponse.json();

  const maxWaitTime = 55; // 🔥 Vercel 타임아웃 방지
  let waited = 0;

  while (status.status !== 'succeeded' && status.status !== 'failed' && waited < maxWaitTime) {
    await new Promise((res) => setTimeout(res, 1000));
    waited++;

    statusResponse = await fetch(prediction.urls.get, {
      headers: {
        Authorization: `Token ${replicateApiKey}`,
      },
    });
    status = await statusResponse.json();
  }

  // 🔍 디버깅 로그
  console.log('📦 최종 상태:', status.status);
  console.log('📤 최종 출력:', status.output);

  // 3. 이미지 응답 반환
  if (status.status === 'succeeded') {
    const imageUrl = Array.isArray(status.output) ? status.output[0] : null;

    if (!imageUrl || imageUrl.length < 10) {
      return NextResponse.json({ error: '출력된 이미지 URL이 잘못되었습니다.' }, { status: 500 });
    }

    return NextResponse.json({ image: imageUrl });
  }

  // 4. 실패 또는 타임아웃 응답
  return NextResponse.json(
    { error: '이미지 생성에 너무 오래 걸립니다. 다시 시도해주세요.' },
    { status: 408 }
  );
}
