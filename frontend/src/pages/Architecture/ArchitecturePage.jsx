import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  MarkerType,
  getBezierPath,
  EdgeLabelRenderer,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import "./ArchitecturePage.css";

// ─────────────────────────────────────────────────────────────────────────────
// THEME CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  frontend: "#3B82F6",
  gateway:  "#22C55E",
  ai:       "#A855F7",
  provider: "#F97316",
  db:       "#EAB308",
  user:     "#EC4899",
  bg:       "#0B0F19",
};

// ─────────────────────────────────────────────────────────────────────────────
// REACT FLOW CUSTOM NODE
// ─────────────────────────────────────────────────────────────────────────────
const SimNode = ({ data }) => {
  const { label, sub, icon, color, isActive, statusText } = data;
  return (
    <motion.div
      className="sim-node"
      animate={{
        scale: isActive ? 1.06 : 1,
        borderColor: isActive ? "#FFF" : color,
        boxShadow: isActive
          ? `0 0 0 1px ${color}, 0 0 30px ${color}88, inset 0 0 20px ${color}22`
          : `0 0 0 1px ${color}44`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{ borderColor: color }}
    >
      <div className="node-glow" style={{ background: color, opacity: isActive ? 0.25 : 0 }} />
      {isActive && <div className="node-pulse-ring" style={{ borderColor: color }} />}
      <span className="node-icon">{icon}</span>
      <div className="node-content">
        <div className="node-label" style={{ color: isActive ? "#FFF" : color }}>{label}</div>
        {sub && <div className="node-sub">{sub}</div>}
        <div className="node-status">
          <div className="status-dot" style={{ background: isActive ? "#22C55E" : "#334155", boxShadow: isActive ? "0 0 6px #22C55E" : "none" }} />
          <span style={{ color: isActive ? "#22C55E" : "#475569" }}>{statusText || (isActive ? "PROCESSING" : "IDLE")}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REACT FLOW CUSTOM EDGE
// ─────────────────────────────────────────────────────────────────────────────
const PacketEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const { isActive, color, label } = data;
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isActive ? color : "rgba(255,255,255,0.08)",
          strokeWidth: isActive ? 2.5 : 1,
          filter: isActive ? `drop-shadow(0 0 6px ${color})` : "none",
          transition: "all 0.4s ease",
        }}
        markerEnd={markerEnd}
      />
      {isActive && (
        <circle r="5" fill="#FFF" opacity="0.9" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      {label && isActive && (
        <EdgeLabelRenderer>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="edge-label-pill"
            style={{
              position: "absolute",
              transform: `translate(-50%, -160%) translate(${labelX}px,${labelY}px)`,
              background: "#0B0F19",
              border: `1px solid ${color}`,
              color: "#FFF",
              padding: "3px 9px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.05em",
              zIndex: 999,
              boxShadow: `0 0 10px ${color}66`,
            }}
          >
            {label}
          </motion.div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = { sim: SimNode };
const edgeTypes = { packet: PacketEdge };

// ─────────────────────────────────────────────────────────────────────────────
// NODE & EDGE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const BASE_NODES = [
  { id: "user",     type: "sim", position: { x: 490, y: 20  }, data: { label: "Client Layer",      icon: "🌐", color: C.user,     sub: "Browser / App" } },
  { id: "frontend", type: "sim", position: { x: 490, y: 160 }, data: { label: "React Frontend",    icon: "⚛️", color: C.frontend, sub: "SPA — Vite + React" } },
  { id: "gateway",  type: "sim", position: { x: 490, y: 310 }, data: { label: "API Gateway",       icon: "🛡️", color: C.gateway,  sub: "Node.js / Express" } },
  { id: "fastapi",  type: "sim", position: { x: 490, y: 460 }, data: { label: "FastAPI Backend",   icon: "⚡", color: C.ai,       sub: "Async Job Engine" } },
  { id: "manager",  type: "sim", position: { x: 490, y: 615 }, data: { label: "Provider Manager",  icon: "🔀", color: C.ai,       sub: "Strategy / Fallback" } },
  { id: "veo",      type: "sim", position: { x: 100, y: 790 }, data: { label: "Gemini Veo",        icon: "🎬", color: C.provider, sub: "Primary Video" } },
  { id: "heygen",   type: "sim", position: { x: 310, y: 790 }, data: { label: "HeyGen",            icon: "🗣️", color: C.provider, sub: "Fallback Video" } },
  { id: "qwen",     type: "sim", position: { x: 620, y: 790 }, data: { label: "Qwen-VL",           icon: "🖼️", color: C.provider, sub: "Primary Image" } },
  { id: "deepai",   type: "sim", position: { x: 830, y: 790 }, data: { label: "DeepAI",            icon: "🎨", color: C.provider, sub: "Fallback Image" } },
  { id: "hf",       type: "sim", position: { x: 1040, y: 790 }, data: { label: "HuggingFace",     icon: "🤗", color: C.provider, sub: "SD Fallback" } },
  { id: "storage",  type: "sim", position: { x: 490, y: 960 }, data: { label: "Storage",           icon: "📦", color: C.db,       sub: "outputs/ + jobs.json" } },
];

const BASE_EDGES = [
  { id: "e1",  source: "user",     target: "frontend", type: "packet", data: { color: C.user } },
  { id: "e2",  source: "frontend", target: "gateway",  type: "packet", data: { color: C.frontend } },
  { id: "e3",  source: "gateway",  target: "fastapi",  type: "packet", data: { color: C.gateway } },
  { id: "e4",  source: "fastapi",  target: "manager",  type: "packet", data: { color: C.ai } },
  { id: "e5v", source: "manager",  target: "veo",      type: "packet", data: { color: C.provider } },
  { id: "e5h", source: "manager",  target: "heygen",   type: "packet", data: { color: C.provider } },
  { id: "e5q", source: "manager",  target: "qwen",     type: "packet", data: { color: C.provider } },
  { id: "e5d", source: "manager",  target: "deepai",   type: "packet", data: { color: C.provider } },
  { id: "e5f", source: "manager",  target: "hf",       type: "packet", data: { color: C.provider } },
  { id: "e6v", source: "veo",      target: "storage",  type: "packet", data: { color: C.db } },
  { id: "e6h", source: "heygen",   target: "storage",  type: "packet", data: { color: C.db } },
  { id: "e6q", source: "qwen",     target: "storage",  type: "packet", data: { color: C.db } },
  { id: "e6d", source: "deepai",   target: "storage",  type: "packet", data: { color: C.db } },
  { id: "e6f", source: "hf",       target: "storage",  type: "packet", data: { color: C.db } },
  { id: "e7",  source: "storage",  target: "gateway",  type: "packet", data: { color: C.gateway } },
  { id: "e8",  source: "gateway",  target: "frontend", type: "packet", data: { color: C.frontend } },
  { id: "e9",  source: "frontend", target: "user",     type: "packet", data: { color: C.user } },
].map(e => ({
  ...e,
  markerEnd: { type: MarkerType.ArrowClosed, color: e.data.color, width: 16, height: 16 },
  data: { ...e.data, isActive: false, label: null },
}));

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION SEQUENCES
// ─────────────────────────────────────────────────────────────────────────────
const getSeqForType = (type) => {
  const isVideo = type === "video";
  const pNode  = isVideo ? "veo"    : "qwen";
  const p2Node = isVideo ? "heygen" : "deepai";
  const pEdge  = isVideo ? "e5v"    : "e5q";
  const p2Edge = isVideo ? "e5h"    : "e5d";
  const rEdge  = isVideo ? "e6v"    : "e6q";

  return [
    { nodes: ["user", "frontend"],   edges: ["e1"],   label: "POST /api/generate",   edgeId: "e1",   delay: 900 },
    { nodes: ["frontend", "gateway"],edges: ["e2"],   label: "JSON Payload",          edgeId: "e2",   delay: 800 },
    { nodes: ["gateway", "fastapi"], edges: ["e3"],   label: "Route Request",         edgeId: "e3",   delay: 800 },
    { nodes: ["fastapi", "manager"], edges: ["e4"],   label: `${type.toUpperCase()} job queued`, edgeId: "e4", delay: 900 },
    { nodes: ["manager", pNode],     edges: [pEdge],  label: `Call ${isVideo ? "Gemini Veo" : "Qwen API"}`, edgeId: pEdge, delay: 1400 },
    { nodes: [pNode, "storage"],     edges: [rEdge],  label: "Return blob URL",       edgeId: rEdge,  delay: 1200 },
    { nodes: ["storage", "gateway"], edges: ["e7"],   label: "Save + Respond",        edgeId: "e7",   delay: 800 },
    { nodes: ["gateway", "frontend"],edges: ["e8"],   label: "HTTP 200 OK",           edgeId: "e8",   delay: 800 },
    { nodes: ["frontend", "user"],   edges: ["e9"],   label: "Render Result",         edgeId: "e9",   delay: 800 },
  ];
};

// ─────────────────────────────────────────────────────────────────────────────
// SEQUENCE DIAGRAM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SequenceDiagram = () => {
  const [step, setStep] = useState(-1);
  const actors = [
    { id: "u", label: "User",        color: C.user,     icon: "👤" },
    { id: "f", label: "Frontend",    color: C.frontend, icon: "⚛️" },
    { id: "g", label: "Gateway",     color: C.gateway,  icon: "🛡️" },
    { id: "a", label: "FastAPI",     color: C.ai,       icon: "⚡" },
    { id: "m", label: "Provider Mgr",color: C.ai,       icon: "🔀" },
    { id: "p", label: "AI Provider", color: C.provider, icon: "🤖" },
    { id: "s", label: "Storage",     color: C.db,       icon: "📦" },
  ];
  const messages = [
    { from: 0, to: 1, label: "POST /api/generate" },
    { from: 1, to: 2, label: "Forward Request" },
    { from: 2, to: 3, label: "Auth & Route" },
    { from: 3, to: 4, label: "Create Job" },
    { from: 4, to: 5, label: "Call AI API" },
    { from: 5, to: 4, label: "Return Result", isReturn: true },
    { from: 4, to: 6, label: "Store Output" },
    { from: 6, to: 3, label: "Confirm Save", isReturn: true },
    { from: 3, to: 2, label: "200 OK + URL", isReturn: true },
    { from: 2, to: 1, label: "Forward Payload", isReturn: true },
    { from: 1, to: 0, label: "Render to User", isReturn: true },
  ];

  useEffect(() => {
    let s = 0;
    const int = setInterval(() => {
      setStep(s);
      s = (s + 1) % messages.length;
    }, 1600);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="seq-panel glass-panel">
      <div className="seq-header">
        <h2>Sequence Flow</h2>
        <div className="seq-badge">{step >= 0 ? `Step ${step + 1} / ${messages.length}` : "Initializing..."}</div>
      </div>
      <div className="seq-body">
        {actors.map((actor, i) => {
          const isActive = step >= 0 && (messages[step].from === i || messages[step].to === i);
          return (
            <div key={actor.id} className="seq-col" style={{ left: `${(i / (actors.length - 1)) * 92 + 4}%` }}>
              <motion.div
                className="seq-actor"
                animate={{ scale: isActive ? 1.12 : 1, boxShadow: isActive ? `0 0 20px ${actor.color}` : "none" }}
                style={{ borderColor: actor.color, "--actor-color": actor.color }}
              >
                <span className="seq-icon">{actor.icon}</span>
                <span className="seq-name">{actor.label}</span>
              </motion.div>
              <div className="seq-lifeline" style={{ background: `linear-gradient(to bottom, ${actor.color}55, transparent)` }} />
            </div>
          );
        })}
        <div className="seq-msgs">
          {messages.map((m, i) => {
            if (i > step && step >= 0) return null;
            const isActive = i === step;
            const isPast = i < step;
            const color = actors[m.from].color;
            const leftPct  = (Math.min(m.from, m.to) / (actors.length - 1)) * 92 + 4;
            const rightPct = (Math.max(m.from, m.to) / (actors.length - 1)) * 92 + 4;
            const goRight  = m.to > m.from;
            return (
              <div
                key={i}
                className={`seq-msg ${isActive ? "seq-msg-active" : "seq-msg-past"}`}
                style={{ top: `${80 + i * 38}px`, left: `${leftPct}%`, width: `${rightPct - leftPct}%`, "--msg-color": color }}
              >
                <div className={`seq-line ${m.isReturn ? "seq-dashed" : ""}`} style={{ background: m.isReturn ? "none" : color, borderTopColor: m.isReturn ? color : "none" }} />
                <div className={`seq-arrow ${goRight ? "seq-right" : "seq-left"}`} style={{ borderLeftColor: goRight ? color : "none", borderRightColor: !goRight ? color : "none" }} />
                <div className="seq-label">{m.label}</div>
                {isActive && (
                  <motion.div
                    className="seq-dot"
                    initial={{ left: goRight ? "0%" : "100%" }}
                    animate={{ left: goRight ? "100%" : "0%" }}
                    transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                    style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DFD DIAGRAM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const DFDDiagram = () => {
  const [level, setLevel] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const levels = {
    0: [
      { label: "User",   icon: "👤", color: C.user },
      { label: "AI Platform", icon: "⚙️", color: C.ai },
      { label: "Output", icon: "🎬", color: C.provider },
    ],
    1: [
      { label: "Frontend", icon: "⚛️",  color: C.frontend },
      { label: "Gateway",  icon: "🛡️", color: C.gateway },
      { label: "FastAPI",  icon: "⚡",  color: C.ai },
      { label: "Providers",icon: "🤖",  color: C.provider },
      { label: "Storage",  icon: "📦",  color: C.db },
    ],
    2: [
      { label: "Input Validation", icon: "✅", color: C.frontend },
      { label: "Job Creation",     icon: "📋", color: C.gateway },
      { label: "Provider Select",  icon: "🔀", color: C.ai },
      { label: "AI Generation",    icon: "🧠", color: C.provider },
      { label: "Store Result",     icon: "💾", color: C.db },
    ],
  };

  const nodes = levels[level];

  useEffect(() => {
    setActiveIdx(0);
    let i = 0;
    const int = setInterval(() => {
      i = (i + 1) % nodes.length;
      setActiveIdx(i);
    }, 1100);
    return () => clearInterval(int);
  }, [level]);

  return (
    <div className="dfd-panel glass-panel">
      <div className="dfd-header">
        <h2>Data Flow Diagram</h2>
        <div className="dfd-tabs">
          {[0, 1, 2].map(l => (
            <button key={l} className={`dfd-tab ${level === l ? "dfd-active" : ""}`} onClick={() => setLevel(l)}>
              Level {l}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={level}
          className="dfd-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {nodes.map((n, i) => (
            <React.Fragment key={i}>
              <motion.div
                className="dfd-node"
                animate={{
                  scale: activeIdx === i ? 1.08 : 1,
                  opacity: activeIdx === i ? 1 : 0.45,
                  boxShadow: activeIdx === i ? `0 0 28px ${n.color}` : "none",
                }}
                style={{ borderColor: n.color, "--dfd-color": n.color }}
              >
                <span className="dfd-icon">{n.icon}</span>
                <span className="dfd-label">{n.label}</span>
                {activeIdx === i && <div className="dfd-glow" style={{ background: n.color }} />}
              </motion.div>
              {i < nodes.length - 1 && (
                <div className="dfd-arrow-track">
                  <motion.div
                    className="dfd-arrow-fill"
                    animate={{ scaleX: activeIdx > i ? 1 : 0, opacity: activeIdx === i ? 1 : 0.3 }}
                    style={{ background: n.color, boxShadow: activeIdx === i ? `0 0 10px ${n.color}` : "none" }}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="dfd-arrowhead" style={{ borderLeftColor: activeIdx >= i ? n.color : "#334155" }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER DECISION FLOW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ProviderFlow = () => {
  const [activeType, setActiveType] = useState("image");
  const [activePath, setActivePath] = useState(0);

  const paths = {
    image: [
      { label: "Qwen-VL Max",        badge: "PRIMARY",  icon: "🖼️",  color: C.provider },
      { label: "Quota / Rate Limit?", badge: "CHECK",    icon: "⚠️",  color: C.db },
      { label: "DeepAI Generator",   badge: "FALLBACK", icon: "🎨",  color: "#F43F5E" },
      { label: "HuggingFace SD",     badge: "LAST",     icon: "🤗",  color: "#8B5CF6" },
    ],
    video: [
      { label: "Gemini Veo 3",       badge: "PRIMARY",  icon: "🎬",  color: C.provider },
      { label: "Network Timeout?",    badge: "CHECK",    icon: "⚠️",  color: C.db },
      { label: "HeyGen Avatar",      badge: "FALLBACK", icon: "🗣️",  color: "#F43F5E" },
      { label: "Static Render",      badge: "LAST",     icon: "📽️",  color: "#8B5CF6" },
    ],
  };

  useEffect(() => {
    let i = 0;
    const int = setInterval(() => {
      i = (i + 1) % paths[activeType].length;
      setActivePath(i);
    }, 1200);
    return () => clearInterval(int);
  }, [activeType]);

  const current = paths[activeType];

  return (
    <div className="flow-panel">
      <div className="flow-type-switch">
        <button className={`flow-type-btn ${activeType === "image" ? "ftype-active" : ""}`} onClick={() => { setActiveType("image"); setActivePath(0); }}>
          🖼️ IMAGE ENGINE
        </button>
        <button className={`flow-type-btn ${activeType === "video" ? "ftype-active" : ""}`} onClick={() => { setActiveType("video"); setActivePath(0); }}>
          🎬 VIDEO ENGINE
        </button>
      </div>
      <div className="flow-cards-row">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            className="flow-path"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {current.map((step, i) => (
              <React.Fragment key={i}>
                <motion.div
                  className="flow-step"
                  animate={{
                    scale: activePath === i ? 1.05 : 1,
                    opacity: activePath === i ? 1 : 0.45,
                    borderColor: activePath === i ? step.color : "#1E293B",
                    boxShadow: activePath === i ? `0 0 24px ${step.color}88` : "none",
                  }}
                  style={{ "--step-color": step.color }}
                >
                  <span className="flow-step-badge" style={{ background: step.color }}>{step.badge}</span>
                  <span className="flow-step-icon">{step.icon}</span>
                  <span className="flow-step-label">{step.label}</span>
                  {activePath === i && <div className="flow-step-glow" style={{ background: step.color }} />}
                </motion.div>
                {i < current.length - 1 && (
                  <motion.div
                    className="flow-connector"
                    animate={{ opacity: activePath > i ? 1 : 0.2, background: activePath === i ? step.color : "#334155" }}
                  >
                    <motion.div
                      className="flow-connector-dot"
                      animate={{ y: activePath === i ? [0, 8, 0] : 0 }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      style={{ background: step.color }}
                    />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="flow-legend glass-panel">
          <h3>Provider Decision Logic</h3>
          <div className="flow-legend-item"><span className="legend-dot" style={{ background: C.provider }} /> Primary — tried first</div>
          <div className="flow-legend-item"><span className="legend-dot" style={{ background: C.db }} /> Check — failure condition</div>
          <div className="flow-legend-item"><span className="legend-dot" style={{ background: "#F43F5E" }} /> Fallback — on failure</div>
          <div className="flow-legend-item"><span className="legend-dot" style={{ background: "#8B5CF6" }} /> Last resort</div>
          <div className="flow-legend-divider" />
          <div className="flow-legend-stat"><span>Active Sim</span><span style={{ color: activeType === "video" ? C.provider : C.ai }}>{activeType.toUpperCase()}</span></div>
          <div className="flow-legend-stat"><span>Current Step</span><span style={{ color: "#FFF" }}>{activePath + 1} / {current.length}</span></div>
          <div className="flow-legend-stat"><span>Mode</span><span style={{ color: "#22C55E" }}>AUTO</span></div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ER DIAGRAM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ERDiagram = () => {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setPulse(p => (p + 1) % 3), 1200);
    return () => clearInterval(int);
  }, []);

  const tables = [
    {
      name: "jobs",
      color: C.ai,
      icon: "📋",
      fields: [
        { name: "job_id",      type: "UUID PK",  pk: true },
        { name: "status",      type: "VARCHAR" },
        { name: "input_prompt",type: "TEXT" },
        { name: "target_mode", type: "ENUM" },
        { name: "created_at",  type: "TIMESTAMP" },
      ],
    },
    {
      name: "outputs",
      color: C.provider,
      icon: "📦",
      fields: [
        { name: "output_id",   type: "UUID PK",  pk: true },
        { name: "job_id",      type: "UUID FK",  fk: true },
        { name: "file_path",   type: "TEXT" },
        { name: "provider",    type: "VARCHAR" },
        { name: "latency_ms",  type: "FLOAT" },
      ],
    },
  ];

  return (
    <div className="er-panel">
      <div className="er-header glass-panel">
        <h2>Entity Relationship Diagram</h2>
        <div className="er-subtitle">jobs.json ↔ outputs/ file system</div>
      </div>
      <div className="er-body">
        {tables.map((t, ti) => (
          <React.Fragment key={t.name}>
            <motion.div
              className="er-table glass-panel"
              animate={{ borderColor: pulse === ti ? t.color : `${t.color}55`, boxShadow: pulse === ti ? `0 0 24px ${t.color}66` : "none" }}
              style={{ "--t-color": t.color }}
            >
              <div className="er-table-head" style={{ background: `${t.color}22`, borderBottomColor: t.color }}>
                <span>{t.icon} {t.name.toUpperCase()}</span>
                <span className="er-pk-badge">Table</span>
              </div>
              {t.fields.map((f, fi) => (
                <div key={f.name} className={`er-field ${f.pk ? "er-pk" : ""} ${f.fk ? "er-fk" : ""}`}>
                  <span className="er-field-name">
                    {f.pk && <span className="er-badge er-badge-pk">PK</span>}
                    {f.fk && <span className="er-badge er-badge-fk">FK</span>}
                    {f.name}
                  </span>
                  <span className="er-field-type">{f.type}</span>
                </div>
              ))}
            </motion.div>
            {ti < tables.length - 1 && (
              <div className="er-relation">
                <div className="er-rel-line">
                  <motion.div className="er-rel-fill" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <div className="er-rel-label glass-panel">1 ─── ∞</div>
                <div className="er-rel-sub">one job → many outputs</div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ARCHITECTURE PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ArchitecturePage = () => {
  const [tab, setTab] = useState("architecture");
  const [simState, setSimState] = useState("stopped");
  const [stepIdx, setStepIdx] = useState(-1);
  const [simType, setSimType] = useState("image");
  const [nodes, setNodes] = useState(BASE_NODES.map(n => ({ ...n, data: { ...n.data, isActive: false } })));
  const [edges, setEdges] = useState(BASE_EDGES);
  const [selectedNode, setSelectedNode] = useState(null);

  const resetGraph = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isActive: false, statusText: "" } })));
    setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, isActive: false, label: null } })));
  }, []);

  useEffect(() => {
    if (simState === "stopped") { resetGraph(); setStepIdx(-1); return; }
    if (simState === "paused") return;
    if (stepIdx === -1) { setSimType(Math.random() > 0.5 ? "video" : "image"); setStepIdx(0); return; }

    const seq = getSeqForType(simType);
    if (stepIdx >= seq.length) {
      if (simState === "live") { setSimType(Math.random() > 0.5 ? "video" : "image"); setStepIdx(0); }
      else { setSimState("stopped"); }
      return;
    }

    const cur = seq[stepIdx];
    setNodes(nds => nds.map(n => ({
      ...n, data: { ...n.data, isActive: cur.nodes.includes(n.id), statusText: cur.nodes.includes(n.id) ? cur.label : "" }
    })));
    setEdges(eds => eds.map(e => ({
      ...e, data: { ...e.data, isActive: cur.edges.includes(e.id), label: e.id === cur.edgeId ? cur.label : null }
    })));

    const t = setTimeout(() => setStepIdx(i => i + 1), cur.delay);
    return () => clearTimeout(t);
  }, [simState, stepIdx, simType, resetGraph]);

  const TABS = [
    { id: "architecture", label: "Architecture" },
    { id: "dfd",          label: "DFD" },
    { id: "sequence",     label: "Sequence" },
    { id: "er",           label: "ER Diagram" },
    { id: "flow",         label: "Provider Flow" },
  ];

  return (
    <div className="arch-root">
      <div className="bg-blob blue" />
      <div className="bg-blob purple" />
      <div className="bg-grid" />

      {/* HEADER */}
      <header className="arch-header">
        <div className="arch-title-row">
          <div className="arch-live-dot" />
          <h1 className="arch-title">DEEPGEN AI — SYSTEM TELEMETRY</h1>
        </div>
        <nav className="arch-nav">
          {TABS.map(t => (
            <button key={t.id} className={`arch-tab ${tab === t.id ? "arch-tab-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="arch-main">
        <AnimatePresence mode="wait">

          {/* ── ARCHITECTURE TAB ── */}
          {tab === "architecture" && (
            <motion.div key="arch" className="arch-flow-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodeClick={(_, node) => setSelectedNode(node)}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.4}
                maxZoom={1.5}
              >
                <Background color="#1E293B" gap={28} size={1.5} />
                <Controls style={{ background: "#0F172A", border: "1px solid #1E293B" }} />

                <Panel position="top-center">
                  <div className="ctrl-bar glass-panel">
                    <button className={`ctrl-btn ${simState === "playing" ? "ctrl-active" : ""}`} onClick={() => setSimState(s => s === "playing" ? "paused" : s === "stopped" ? "playing" : "playing")}>
                      {simState === "playing" ? "⏸ PAUSE" : "▶ PLAY SIM"}
                    </button>
                    <button className={`ctrl-btn ctrl-live ${simState === "live" ? "ctrl-live-active" : ""}`} onClick={() => setSimState(s => s === "live" ? "stopped" : "live")}>
                      🔁 LIVE AUTO
                    </button>
                    <button className="ctrl-btn ctrl-stop" onClick={() => setSimState("stopped")}>⏹ RESET</button>
                    <div className="ctrl-type-badge" style={{ color: simType === "video" ? C.provider : C.ai }}>
                      {simType === "video" ? "🎬 VIDEO" : "🖼️ IMAGE"} flow
                    </div>
                  </div>
                </Panel>
              </ReactFlow>

              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    className="detail-panel glass-panel"
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  >
                    <div className="detail-icon" style={{ color: selectedNode.data.color }}>{selectedNode.data.icon}</div>
                    <h3 style={{ color: selectedNode.data.color }}>{selectedNode.data.label}</h3>
                    <div className="detail-sub">{selectedNode.data.sub}</div>
                    <div className="detail-divider" style={{ background: selectedNode.data.color }} />
                    <div className="detail-stats">
                      <div className="detail-row"><span>Status</span><span className="text-green">ONLINE</span></div>
                      <div className="detail-row"><span>Latency</span><span>{Math.floor(Math.random() * 80 + 20)}ms</span></div>
                      <div className="detail-row"><span>Load</span><span>{Math.floor(Math.random() * 50 + 10)}%</span></div>
                      <div className="detail-row"><span>Type</span><span>{selectedNode.data.color === C.provider ? "External API" : selectedNode.data.color === C.db ? "Storage" : "Internal"}</span></div>
                    </div>
                    <button className="detail-close" onClick={() => setSelectedNode(null)}>✕ DISMISS</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── DFD TAB ── */}
          {tab === "dfd" && (
            <motion.div key="dfd" className="tab-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DFDDiagram />
            </motion.div>
          )}

          {/* ── SEQUENCE TAB ── */}
          {tab === "sequence" && (
            <motion.div key="seq" className="tab-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SequenceDiagram />
            </motion.div>
          )}

          {/* ── ER TAB ── */}
          {tab === "er" && (
            <motion.div key="er" className="tab-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ERDiagram />
            </motion.div>
          )}

          {/* ── FLOW TAB ── */}
          {tab === "flow" && (
            <motion.div key="flow" className="tab-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProviderFlow />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default ArchitecturePage;