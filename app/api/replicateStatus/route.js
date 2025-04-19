import { NextResponse } from 'next/server';

export async function POST(req) {
  const { predictionId } = await req.json();
  const replicateApiKey = process.env.REPLICATE_API_TOKEN;

  const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Token ${replicateApiKey}`,
    },
  });

  const status = await statusRes.json();

  return NextResponse.json(status);
}
