"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState } from "@xyflow/react";
import { toPng } from "html-to-image";
import { ConceptNode } from "@/components/ConceptNode";
import { sampleAnalysis, sampleText, toFlow, type Analysis } from "@/lib/diagram";

const nodeTypes = { concept: ConceptNode };

function StudioCanvas() {
  const initial = useMemo(() => toFlow(sampleAnalysis), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [text, setText] = useState(sampleText);
  const [analysis, setAnalysis] = useState<Analysis>(sampleAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const diagramRef = useRef<HTMLDivElement>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "분석에 실패했습니다.");
      const next = result as Analysis;
      const flow = toFlow(next);
      setAnalysis(next);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setNotice("AI 분석이 완료되었습니다.");
      window.setTimeout(() => setNotice(""), 2600);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [setEdges, setNodes, text]);

  const download = useCallback(async () => {
    if (!diagramRef.current) return;
    const dataUrl = await toPng(diagramRef.current, { backgroundColor: "#f6f5f0", pixelRatio: 2, cacheBust: true });
    const link = document.createElement("a");
    link.download = "formulate-architecture-diagram.png";
    link.href = dataUrl;
    link.click();
    setNotice("PNG 다이어그램을 저장했습니다.");
    window.setTimeout(() => setNotice(""), 2600);
  }, []);

  return (
    <main>
      <header className="masthead">
        <div className="wordmark"><span className="mark">F</span><div><b>FORMULATE</b><small>ARCHITECTURAL DIAGRAM STUDIO</small></div></div>
        <p>논문 속 공간 개념을<br />명료한 구조로 번역합니다.</p>
        <div className="edition"><span>LIVE WEB APP</span><b>01 / 2026</b></div>
      </header>

      <section className="intro">
        <span className="eyebrow">AI-ASSISTED RESEARCH TOOL</span>
        <h1>텍스트에서<br /><em>공간의 논리</em>를 찾다.</h1>
        <p>건축 논문과 설계 개념을 입력하면 AI가 핵심어와 관계를 분석하고, 편집 가능한 다이어그램으로 시각화합니다.</p>
        <a className="hero-cta" href="#studio">다이어그램 만들기 <b>↓</b></a>
        <div className="intro-number">01</div>
      </section>

      <section className="studio" id="studio">
        <aside className="input-panel">
          <div className="section-heading"><span>01</span><div><small>RESEARCH INPUT</small><h2>논문 내용 입력</h2></div></div>
          <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={6000} placeholder="논문 초록이나 설계 개념을 입력하세요." />
          <div className="text-meta"><span>한글·영문 논문 지원</span><b>{text.length} / 6000</b></div>
          <p className="privacy-note">입력 내용은 다이어그램 분석 목적으로만 OpenAI API에 전송됩니다.</p>
          <button className="analyze-button" onClick={analyze} disabled={loading || text.trim().length < 30}>
            <span>{loading ? "개념 구조 분석 중" : "OpenAI로 핵심 개념 추출"}</span><b>{loading ? "···" : "→"}</b>
          </button>
          {error && <div className="error-message"><b>설정 안내</b><p>{error}</p><span>API 키 없이도 현재 예시 다이어그램을 편집하고 다운로드할 수 있습니다.</span></div>}

          <div className="analysis-summary">
            <div className="section-heading small"><span>02</span><div><small>AI INTERPRETATION</small><h2>분석 결과</h2></div></div>
            <blockquote>{analysis.thesis}</blockquote>
            <ol>{analysis.concepts.map((concept) => <li key={concept.id}><span>{concept.category}</span><b>{concept.title}</b><p>{concept.description}</p></li>)}</ol>
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div className="section-heading small"><span>03</span><div><small>SPATIAL LOGIC</small><h2>관계 다이어그램</h2></div></div>
            <div className="legend"><span><i className="dot context" />맥락</span><span><i className="dot strategy" />전략</span><span><i className="dot space" />공간</span><span><i className="dot outcome" />결과</span></div>
            <button onClick={download}>PNG 저장 <b>↓</b></button>
          </div>
          <div className="diagram-frame" ref={diagramRef}>
            <div className="diagram-caption"><span>FIG. 01</span><b>{analysis.thesis}</b><small>노드를 드래그하여 구성을 편집할 수 있습니다.</small></div>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.35} maxZoom={1.7}>
              <Background variant={BackgroundVariant.Dots} gap={24} size={0.8} color="#b7b5ae" />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable nodeStrokeWidth={2} />
            </ReactFlow>
            <div className="scale">0 —— 1 —— 2 —— 3</div>
          </div>
        </section>
      </section>
      <footer><b>FORMULATE</b><span>OPENAI RESPONSES API × REACT FLOW</span><a href="#studio">START CREATING ↑</a><span>© 2026 ARCHITECTURAL RESEARCH TOOL</span></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

export default function DiagramStudio() {
  return <ReactFlowProvider><StudioCanvas /></ReactFlowProvider>;
}
