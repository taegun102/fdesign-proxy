// app/api/translate/route.js
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { koreanText } = await req.json();
    console.log('📩 번역할 텍스트:', koreanText);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Translate the following Korean to natural, fashion-style English.',
        },
        {
          role: 'user',
          content: koreanText,
        },
      ],
    });

    const translated = response.choices[0].message.content.trim();
    console.log('✅ 번역 결과:', translated);

    return NextResponse.json({ translated });
  } catch (error) {
    console.error('❌ OpenAI 번역 실패:', error);
    return NextResponse.json(
      { error: 'OpenAI 번역 실패', detail: error.message },
      { status: 500 }
    );
  }
}
