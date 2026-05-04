import { useState, useRef, useCallback } from "react";

export function useAnalyze() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const analyze = useCallback(async (code, mode) => {
    // cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setOutput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // strip bad control characters that break JSON parsing
          code: code.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim(),
          mode,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Server error");

      // read streamed response chunk by chunk
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      // AbortError is intentional (user clicked Stop) — don't show error
      if (err.name !== "AbortError") {
        setError("Analysis failed. Please check your server and API key.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    setOutput("");
    setError("");
  }, []);

  return { output, loading, error, analyze, stop, clear };
}
