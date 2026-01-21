'use client';

import { useMemo, useState } from "react";
import "./styles.css";

export default function App() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [threshold, setThreshold] = useState(0.5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const label = useMemo(() => {
    if (!result) return "";
    return result.pred === 1 ? "Sexismo detectado" : "Sin sexismo";
  }, [result]);

  const isSexism = result?.pred === 1;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const [res] = await Promise.all([
        fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            body,
            threshold: Number(threshold),
          }),
        }),
        minLoadingTime,
      ]);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al inferir");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setSubject("");
    setBody("");
    setThreshold(0.5);
    setResult(null);
    setError("");
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Detector de Sexismo</h1>
        <p className="subtitle">Analiza correos electrónicos para identificar contenido sexista</p>
      </header>

      <div className="layout">
        <form className="card" onSubmit={handleSubmit}>
          <label className="label">
            <span className="label-text">Asunto</span>
            <input
              className="input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Escribe el asunto del correo"
            />
          </label>

          <label className="label">
            <span className="label-text">Cuerpo del correo</span>
            <textarea
              className="textarea"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Pega el contenido del correo aquí..."
            />
          </label>

          <div className="actions">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Analizando..." : "Analizar"}
            </button>
            <button 
              className="button secondary" 
              type="button" 
              onClick={handleClear} 
              disabled={loading}
            >
              Limpiar
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}
        </form>

        <section className="result-card">
          {loading ? (
            <div className="result-placeholder">
              <div className="placeholder-icon loading-spinner">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
              <p className="placeholder-text">Analizando correo...</p>
              <p className="placeholder-hint">Esto puede tardar unos segundos</p>
            </div>
          ) : !result ? (
            <div className="result-placeholder">
              <div className="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="placeholder-text">Prueba si tu correo es sexista</p>
              <p className="placeholder-hint">Ingresa el contenido del correo y haz clic en analizar</p>
            </div>
          ) : (
            <>
              <div className="result-header">
                <span className="result-label">Resultado</span>
                <span className={`result-value ${isSexism ? 'sexism' : 'safe'}`}>
                  {label}
                </span>
              </div>

              <div className="probabilities">
                <div className="prob-item">
                  <div className="prob-label">Sin sexismo</div>
                  <div className="prob-value">{(result.p_no_sexismo * 100).toFixed(1)}%</div>
                  <div className="prob-bar">
                    <div 
                      className="prob-bar-fill" 
                      style={{ width: `${result.p_no_sexismo * 100}%` }}
                    />
                  </div>
                </div>
                <div className="prob-item">
                  <div className="prob-label">Sexismo</div>
                  <div className="prob-value">{(result.p_sexismo * 100).toFixed(1)}%</div>
                  <div className="prob-bar">
                    <div 
                      className={`prob-bar-fill ${result.p_sexismo > 0.5 ? 'highlight' : ''}`}
                      style={{ width: `${result.p_sexismo * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
