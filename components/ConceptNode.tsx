import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Concept } from "@/lib/diagram";

const categoryLabel = { context: "CONTEXT", strategy: "STRATEGY", space: "SPACE", outcome: "OUTCOME" };

type ConceptFlowNode = Node<Concept, "concept">;

export function ConceptNode({ data: concept, selected }: NodeProps<ConceptFlowNode>) {
  return (
    <div className={`concept-node concept-${concept.category} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <span className="node-index">{categoryLabel[concept.category]}</span>
      <strong>{concept.title}</strong>
      <p>{concept.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
