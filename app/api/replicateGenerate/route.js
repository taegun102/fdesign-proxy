// app/api/replicateGenerate/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { prompt } = await req.json();
  console.log('📨 받은 프롬포트:', prompt);

  const replicateApiKey = process.env.REPLICATE_API_TOKEN;
  const version = '55a41a6a19205f74a3ee0ec4186972fefe4039c8598c701a7a24afd45bcb127b';

  if (!replicateApiKey) {
    console.error('❌ Replicate API 키가 설정되지 않았습니다.');
    return NextResponse.json({ error: '서버 설정 오류: API 키 누락' }, { status: 500 });
  }

  // 예측 요청
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

  let prediction;
  try {
    prediction = await predictionRes.json();
  } catch (e) {
    const errorText = await predictionRes.text();
    console.error('❌ 예측 요청 실패 (JSON 파싱 오류):', errorText);
    return NextResponse.json({ error: 'Replicate 응답 파싱 실패' }, { status: 500 });
  }

  console.log('🛰 Replicate 응답:', prediction);

  // 예측 ID 확인
  if (!prediction?.id || !prediction?.urls?.get) {
    console.error('❌ 예측 ID 또는 URL 없음:', prediction);
    return NextResponse.json({ error: '예측 ID를 받지 못했습니다.' }, { status: 500 });
  }

  // 상태 확인 루프
  const getUrl = prediction.urls.get;
  let statusRes, statusJson;
  let waited = 0;
  const maxWait = 55;

  while (waited < maxWait) {
    await new Promise((res) => setTimeout(res, 1000));
    waited++;

    statusRes = await fetch(getUrl, {
      headers: { Authorization: `Token ${replicateApiKey}` },
    });

    try {
      statusJson = await statusRes.json();
    } catch (e) {
      const errorText = await statusRes.text();
      console.error('❌ 상태 응답 파싱 실패:', errorText);
      return NextResponse.json({ error: '상태 확인 파싱 실패' }, { status: 500 });
    }

    if (statusJson.status === 'succeeded') break;
    if (statusJson.status === 'failed') {
      console.error('❌ 이미지 생성 실패:', statusJson);
      return NextResponse.json({ error: '이미지 생성 실패' }, { status: 500 });
    }
  }

  const output = Array.isArray(statusJson.output) ? statusJson.output[0] : statusJson.output;
  if (!output) {
    return NextResponse.json({ error: '이미지 URL이 비어 있습니다.' }, { status: 500 });
  }

  return NextResponse.json({ image: output });
}
