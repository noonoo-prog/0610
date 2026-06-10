import { z } from "zod";

export const AnalysisSchema = z.object({
  thesis: z.string().min(1).max(160).describe("논문의 핵심 주장을 한국어 한 문장으로 요약"),
  concepts: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    title: z.string().min(1).max(40),
    description: z.string().min(1).max(100),
    category: z.enum(["context", "strategy", "space", "outcome"]),
  })).min(4).max(6),
  relations: z.array(z.object({
    source: z.string(),
    target: z.string(),
    label: z.string().min(1).max(30),
  })).min(3).max(8),
}).superRefine((analysis, context) => {
  const ids = new Set(analysis.concepts.map((concept) => concept.id));
  for (const relation of analysis.relations) {
    if (!ids.has(relation.source) || !ids.has(relation.target)) {
      context.addIssue({ code: "custom", message: "모든 관계는 존재하는 개념 ID를 참조해야 합니다." });
    }
  }
});
