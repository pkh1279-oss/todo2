import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt, UserSelections, Recommendation } from '@/lib/prompt';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const selections: UserSelections = await req.json();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(buildPrompt(selections));
  const text = result.response.text().trim();

  // JSON 코드 블록 제거
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  let recommendations: Recommendation[];
  try {
    recommendations = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: '추천 결과를 불러오는 데 실패했어요. 다시 시도해주세요.' }, { status: 500 });
  }

  return NextResponse.json(recommendations);
}
