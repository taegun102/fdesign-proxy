import { NextResponse } from 'next/server';

export async function POST(req) {
  const { prompt } = await req.json();
  console.log('📨 받은 프롬포트:', prompt);

  const replicateApiKey = process.env.REPLICATE_API_TOKEN;
  const version = '55a41a6a19205f74a3ee0ec4186972fefe4039c8598c701a7a24afd45bcb127b';

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

  if (!prediction?.id) {
    return NextResponse.json({ error: '예측 생성 실패' }, { status: 500 });
  }

  return NextResponse.json({ predictionId: prediction.id });
}
