import { NextResponse } from 'next/server';

export async function POST(req) {
  const { prompt } = await req.json();
  const replicateApiKey = process.env.REPLICATE_API_TOKEN;
  const version = '55a41a6a19205f74a3ee0ec4186972fefe4039c8598c701a7a24afd45bcb127b';

  // 1. 예측 생성 요청
  const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
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

  const prediction = await predictionResponse.json();
  console.log('🛰 예측 생성 응답:', prediction);

  if (!prediction.id || !prediction.urls?.get) {
    return NextResponse.json({ error: '예측 ID를 받지 못했습니다.' }, { status: 500 });
  }

  // 2. 최대 50초까지 상태 체크
  let status = prediction;
  const maxRetries = 50;
  let count = 0;

  while (status.status !== 'succeeded' && status.status !== 'failed' && count < maxRetries) {
    await new Promise((res) => setTimeout(res, 1000));
    const statusRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${replicateApiKey}` },
    });
    status = await statusRes.json();
    count++;
  }

  console.log('✅ 최종 상태:', status.status);

  if (status.status === 'succeeded' && status.output?.[0]) {
    return NextResponse.json({ image: status.output[0] });
  } else {
    return NextResponse.json({ error: '이미지 생성에 실패했습니다.' }, { status: 500 });
  }
}
