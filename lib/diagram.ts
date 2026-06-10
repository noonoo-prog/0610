import type { Edge, Node } from "@xyflow/react";

export type Concept = {
  id: string;
  title: string;
  description: string;
  category: "context" | "strategy" | "space" | "outcome";
};

export type Relation = {
  source: string;
  target: string;
  label: string;
};

export type Analysis = {
  thesis: string;
  concepts: Concept[];
  relations: Relation[];
};

export const sampleText = "도시의 단절된 녹지 축을 입체 보행 네트워크로 연결하고, 공공 프로그램과 주거 사이에 유연한 완충 공간을 만드는 수직 커뮤니티를 제안한다.";

export const sampleAnalysis: Analysis = {
  thesis: "단절된 도시 녹지를 수직 커뮤니티로 재연결한다.",
  concepts: [
    { id: "context", title: "도시 단절", description: "분절된 녹지와 보행 흐름", category: "context" },
    { id: "network", title: "입체 보행망", description: "수평·수직 동선의 재연결", category: "strategy" },
    { id: "buffer", title: "완충 공간", description: "공공과 주거의 유연한 경계", category: "space" },
    { id: "community", title: "수직 커뮤니티", description: "관계와 활동의 새로운 중심", category: "outcome" },
  ],
  relations: [
    { source: "context", target: "network", label: "재연결" },
    { source: "network", target: "buffer", label: "매개" },
    { source: "buffer", target: "community", label: "형성" },
    { source: "network", target: "community", label: "활성화" },
  ],
};

const positions = [
  { x: 40, y: 190 },
  { x: 320, y: 60 },
  { x: 320, y: 320 },
  { x: 640, y: 190 },
  { x: 640, y: 420 },
  { x: 40, y: 420 },
];

export function toFlow(analysis: Analysis): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = analysis.concepts.map((concept, index) => ({
    id: concept.id,
    type: "concept",
    position: positions[index] ?? { x: 80 + (index % 3) * 280, y: 80 + Math.floor(index / 3) * 220 },
    data: concept,
  }));

  const edges: Edge[] = analysis.relations.map((relation, index) => ({
    id: `e-${index}-${relation.source}-${relation.target}`,
    source: relation.source,
    target: relation.target,
    label: relation.label,
    type: "smoothstep",
    animated: false,
  }));

  return { nodes, edges };
}
