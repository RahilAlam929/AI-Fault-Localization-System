import { useState } from "react";
import "./App.css";

const sampleCode = `def calculate(data=[]):
    eval("2 + 2")

    try:
        print("Hello")
    except:
        pass
`;

function App() {
  const [code, setCode] = useState(sampleCode);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Send the code to our FastAPI backend
  async function analyzeCode() {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error("The server could not analyze this code.");
      }

      const data = await response.json();
      setResults(data);

    } catch (err) {
      setError(
        err.message + " Make sure the FastAPI backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <div>
            <h2>FaultLens</h2>
            <span>AI Code Analysis</span>
          </div>
        </div>
        <div className="status">
          <span className="status-dot"></span>
          Developer Workspace
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <p className="eyebrow">INTELLIGENT DEBUGGING TOOL</p>
          <h1>Find bugs before they find you.</h1>
          <p>
            Analyze your Python code and find possible problems with
            line-level evidence and suggestions.
          </p>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <h3>Code Analysis</h3>
              <p>Paste your Python code below to get started.</p>
            </div>
            <span className="language-tag">PYTHON</span>
          </div>

          <textarea
            className="code-editor"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck="false"
            placeholder="Paste your Python code here..."
          />

          <div className="editor-footer">
            <span>{code.split("\n").length} lines</span>
            <button
              className="analyze-button"
              onClick={analyzeCode}
              disabled={loading || !code.trim()}
            >
              {loading ? "Analyzing..." : "Analyze Code →"}
            </button>
          </div>
        </section>

        {error && (
          <div className="error-message">
            <strong>Connection error</strong>
            <p>{error}</p>
          </div>
        )}

        {results && (
          <section className="results">
            <div className="results-heading">
              <div>
                <p className="eyebrow">ANALYSIS REPORT</p>
                <h2>Analysis Results</h2>
              </div>
              <div className="issue-count">
                <strong>{results.total_issues}</strong>
                <span>Issues found</span>
              </div>
            </div>

            {results.faults.length === 0 ? (
              <div className="success-message">
                <h3>No issues detected</h3>
                <p>
                  Our current checks did not find any of the supported
                  code patterns.
                </p>
              </div>
            ) : (
              <div className="issue-list">
                {results.faults.map((fault, index) => (
                  <article className="issue-card" key={index}>
                    <div className="issue-top">
                      <h3>{fault.type}</h3>
                      <span className={`severity ${fault.severity.toLowerCase()}`}>
                        {fault.severity}
                      </span>
                    </div>

                    <p className="line-number">
                      Line {fault.line ?? "Unknown"}
                    </p>

                    <div className="detail">
                      <strong>Evidence</strong>
                      <p>{fault.evidence}</p>
                    </div>

                    <div className="suggestion">
                      <strong>Suggested fix</strong>
                      <p>{fault.suggestion}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer>
          FaultLens · AI Fault Localization System
        </footer>
      </main>
    </div>
  );
}

export default App;
