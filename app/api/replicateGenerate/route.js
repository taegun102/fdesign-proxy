// app/api/replicateGenerate/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { prompt } = await req.json();
  console.log('📨 받은 프롬프트:', prompt);

  const replicateApiKey = process.env.REPLICATE_API_TOKEN;
  const version = '55a41a6a19205f74a3ee0ec4186972fefe4039c8598c701a7a24afd45bcb127b'; // 모델 버전 ID

  try {
    // Replicate 예측 요청 (비동기)
    const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${replicateApiKey}`,
      },
      body: JSON.stringify({
        version,
        input: { prompt },
      }),
    });

    const prediction = await predictionRes.json();
    console.log('📦 예측 응답:', prediction);

    if (!prediction?.id) {
      return NextResponse.json({ error: '예측 생성 실패' }, { status: 500 });
    }

    // 프론트엔드에서 polling 할 수 있도록 prediction id 반환
    return NextResponse.json({ id: prediction.id });
  } catch (err) {
    console.error('❌ API 호출 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
