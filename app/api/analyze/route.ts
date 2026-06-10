import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { AnalysisSchema } from "@/lib/analysis-schema";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let text: string | undefined;
  try {
    const body = await request.json() as { text?: unknown };
    text = typeof body.text === "string" ? body.text : undefined;
  } catch {
    return NextResponse.json({ error: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
  }

  if (!text || text.trim().length < 30) {
    return NextResponse.json({ error: "분석할 논문 내용을 30자 이상 입력해 주세요." }, { status: 400 });
  }
  if (text.length > 6000) {
    return NextResponse.json({ error: "논문 내용은 6,000자 이하로 입력해 주세요." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다. 배포 환경 변수를 확인해 주세요." }, { status: 503 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      input: [
        { role: "system", content: "당신은 건축 이론과 공간 다이어그램 전문가입니다. 입력된 논문에서 다이어그램으로 표현할 핵심 개념과 인과·공간 관계를 추출하세요. 모든 title, description, label, thesis는 간결한 한국어로 작성하세요. 관계의 source와 target은 반드시 concepts의 id를 사용하세요." },
        { role: "user", content: text.trim() },
      ],
      text: { format: zodTextFormat(AnalysisSchema, "architectural_analysis") },
    });

    if (!response.output_parsed) {
      return NextResponse.json({ error: "분석 결과를 구조화하지 못했습니다. 내용을 보완해 다시 시도해 주세요." }, { status: 422 });
    }
    return NextResponse.json(response.output_parsed);
  } catch (error) {
    console.error("OpenAI analysis failed", error);
    return NextResponse.json({ error: "OpenAI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
