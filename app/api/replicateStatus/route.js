// app/api/replicateStatus/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { id } = await req.json();
  const replicateApiKey = process.env.REPLICATE_API_TOKEN;

  try {
    const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        Authorization: `Token ${replicateApiKey}`,
      },
    });

    const statusData = await statusRes.json();
    console.log('📡 상태:', statusData.status);

    if (statusData.status === 'succeeded') {
      return NextResponse.json({ status: 'succeeded', image: statusData.output?.[0] });
    } else if (statusData.status === 'failed') {
      return NextResponse.json({ status: 'failed' });
    } else {
      return NextResponse.json({ status: 'processing' });
    }
  } catch (err) {
    console.error('❌ 상태 확인 실패:', err);
    return NextResponse.json({ error: '상태 확인 실패' }, { status: 500 });
  }
}
