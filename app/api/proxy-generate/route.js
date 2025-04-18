import { NextResponse } from 'next/server';

export async function POST(req) {
  const { prompt } = await req.json();

  try {
    // ① 예측 생성
    const create = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'a9758cb5f09f74adb010fae98cb5b4e0100180bf28dbe069b848245d5efb180d', // SDXL
        input: { prompt },
      }),
    });

    const job = await create.json();
    if (job.error) {
      return NextResponse.json({ error: job.error }, { status: 500 });
    }

    return NextResponse.json(job); // 프런트에 id · urls · status 전달
  } catch (err) {
    return NextResponse.json(
      { error: 'Replicate fetch 실패', detail: err.message },
      { status: 500 },
    );
  }
}