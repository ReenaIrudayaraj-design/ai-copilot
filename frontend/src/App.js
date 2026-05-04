import { useState, useEffect, useRef } from "react";
import "./App.css";
import { useAnalyze } from "./components/hooks/useAnalyze";

const MODES = [
  { key: "review",   label: "Full Review",  icon: "◈", desc: "Bugs + explanation + optimized code" },
  { key: "bugs",     label: "Bug Detect",   icon: "⚠", desc: "Find all bugs and fixes"             },
  { key: "optimize", label: "Optimize",     icon: "⚡", desc: "Rewrite for performance"              },
  { key: "explain",  label: "Explain",      icon: "◎", desc: "Plain English explanation"            },
];

const SAMPLE_CODE = `import React, { useState } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  });

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}`;

// ── Copy button component ──
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="copy-btn">
      {copied ? "✓ Copied" : "⧉ Copy"}
    </button>
  );
}

// ── Markdown renderer component ──
function MarkdownOutput({ text }) {
  const formatted = text
    // code blocks (triple backtick)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="code-block"><code>${code
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
      }</code></pre>`
    )
    // headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,   "<h1>$1</h1>")
    // bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // inline code
    .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>")
    // numbered and bullet lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^- (.+)$/gm,     "<li>$1</li>")
    // paragraph spacing
    .replace(/\n\n/g, "<br/><br/>");

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
}

// ── Main App ──
export default function App() {
  const [code, setCode]   = useState(SAMPLE_CODE);
  const [mode, setMode]   = useState("review");
  const { output, loading, error, analyze, stop, clear } = useAnalyze();
  const outputRef = useRef(null);

  // auto-scroll output panel as new content streams in
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleAnalyze = () => {
    if (!code.trim()) return;
    clear();
    analyze(code, mode);
  };

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">CopilotAI</span>
        </div>
        <p className="tagline">React &amp; JS Code Intelligence</p>
      </header>

      <main className="main">

        {/* ── Left Panel — Code Input ── */}
        <section className="panel left-panel">
          <div className="panel-header">
            <span className="panel-title">Code Input</span>
            <button className="ghost-btn" onClick={() => setCode("")}>Clear</button>
          </div>

          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your React or JavaScript code here..."
            spellCheck={false}
          />

          <div className="char-count">{code.length} / 3000 chars</div>

          {/* Mode selector */}
          <div className="mode-grid">
            {MODES.map((m) => (
              <button
                key={m.key}
                className={`mode-btn ${mode === m.key ? "active" : ""}`}
                onClick={() => setMode(m.key)}
                title={m.desc}
              >
                <span className="mode-icon">{m.icon}</span>
                <span className="mode-label">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Analyze / Stop button */}
          <button
            className={`analyze-btn ${loading ? "loading" : ""}`}
            onClick={loading ? stop : handleAnalyze}
            disabled={!code.trim() && !loading}
          >
            {loading ? (
              <><span className="spinner" /> Stop</>
            ) : (
              <><span>▶</span> Analyze</>
            )}
          </button>
        </section>

        {/* ── Right Panel — Output ── */}
        <section className="panel right-panel">
          <div className="panel-header">
            <span className="panel-title">
              {MODES.find((m) => m.key === mode)?.icon}{" "}
              {MODES.find((m) => m.key === mode)?.label}
            </span>
            {output && <CopyButton text={output} />}
          </div>

          <div className="output-area" ref={outputRef}>

            {/* Error state */}
            {error && <div className="error-msg">{error}</div>}

            {/* Empty state */}
            {!output && !loading && !error && (
              <div className="placeholder">
                <div className="placeholder-icon">⬡</div>
                <p>Select a mode and click Analyze</p>
                <p className="placeholder-sub">
                  Your AI analysis will stream here in real time
                </p>
              </div>
            )}

            {/* Streamed markdown output */}
            {output && <MarkdownOutput text={output} />}

            {/* Blinking cursor while streaming */}
            {loading && <div className="cursor-blink">▋</div>}

          </div>
        </section>

      </main>
    </div>
  );
}
