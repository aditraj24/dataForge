import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Award, RotateCcw } from 'lucide-react';

interface Question {
  id: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: "What physical quantity does the test-time budget parameter k represent?",
    options: [
      "A financial dollar amount billed by cloud providers",
      "In CoT: max token generation limit; In Latent: number of recurrent hidden state updates",
      "The number of layers inside the static neural network",
      "The batch size used during model evaluation"
    ],
    correctIndex: 1,
    explanation: "Correct! Budget k is an inference-time compute parameter: for CoT it limits external token generation, while for Latent it sets the exact recurrence loop count."
  },
  {
    id: 2,
    prompt: "Why can equal nominal budgets (e.g. k=8) produce different wall-clock latencies?",
    options: [
      "Because one was tested on GPU while the other was tested on CPU",
      "Because CoT can stop early on <END_THINK> and the two architectures have fundamentally different per-step FLOPs",
      "Because cloud nodes throttled memory dynamically",
      "They actually run at identical wall-clock speeds"
    ],
    correctIndex: 1,
    explanation: "Correct! The causal transformer forward pass per token differs in FLOPs and KV memory access from the cross-attention + GRUCell recurrence, and CoT supports early halting."
  },
  {
    id: 3,
    prompt: "What was the key empirical finding on Task A (Permutation Orbit Traversal) across capacity scaling?",
    options: [
      "Latent reasoning universally outperformed CoT across all budgets and scales",
      "Recurrent latent reasoning plateaued near ~33%, while CoT scaled with capacity and compute to 99.74% at 5M recovery",
      "Both models achieved 100% accuracy at 1M parameters",
      "Scaling parameters broke reasoning capability in both architectures"
    ],
    correctIndex: 1,
    explanation: "Correct! Across 126K, 1M, and 5M recovery, the latent model remained constrained near ~33%, while CoT scaled monotonically with compute and capacity to 99.74%."
  },
  {
    id: 4,
    prompt: "Why is Task B (Modular Register Arithmetic) classified as [INCONCLUSIVE]?",
    options: [
      "The benchmark files were corrupted during evaluation",
      "Because both models performed near the 10% random chance baseline (10%–18.6%)",
      "Because only one seed was evaluated",
      "Because modular arithmetic is non-deterministic"
    ],
    correctIndex: 1,
    explanation: "Correct! Accuracies between 10% and 18.6% on a 10-class problem do not provide clean empirical support for either hypothesis."
  },
  {
    id: 5,
    prompt: "Why did the original 5M experiment score only 13.68%, and what did 5M Recovery demonstrate?",
    options: [
      "The 5M model was overparameterized and degraded; recovery proved large models cannot reason",
      "The original run was severely underfit due to a static 2,500-step schedule; 50-epoch recovery with cosine decay achieved 99.74%",
      "The dataset generator had a bug that was patched in recovery",
      "The original run used float16 while recovery used float64"
    ],
    correctIndex: 1,
    explanation: "Correct! The original 2,500-step budget was insufficient for 5.2M parameters. Controlled retraining recovered performance to 99.74% on CoT, proving the original was confounded by optimization."
  },
  {
    id: 6,
    prompt: "What does the observed contraction (||Δh|| → 0) in the latent state trajectory indicate?",
    options: [
      "Rigorous mathematical proof that the model found a Banach fixed point",
      "Numerical stabilization and state saturation in finite precision, not mathematical proof of a fixed point",
      "The model encountered an out-of-memory error",
      "The weights were zeroed out during inference"
    ],
    correctIndex: 1,
    explanation: "Correct! Vanishing delta ||Δh|| indicates numerical stabilization in practice, but does not prove mathematical contraction."
  },
  {
    id: 7,
    prompt: "What mechanism is hypothesized to cause the latent model's ~33% ceiling on Task A?",
    options: [
      "Hardware CUDA driver incompatibilities on RTX 4060",
      "An attention addressing bottleneck where the query repeatedly attends to start token v0 instead of intermediate hop pointers",
      "Overfitting on the training set",
      "Inability of GRU cells to compute matrix multiplications"
    ],
    correctIndex: 1,
    explanation: "Correct! Diagnostic audits revealed the latent model concentrates ~68% of attention mass on v0 rather than dynamically dereferencing permutation table entries."
  }
];

export const ExplainBackWorkbench: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (submitted[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = (questionId: number) => {
    if (answers[questionId] !== undefined) {
      setSubmitted((prev) => ({ ...prev, [questionId]: true }));
    }
  };

  const resetAll = () => {
    setAnswers({});
    setSubmitted({});
  };

  const totalSubmitted = Object.keys(submitted).length;
  const correctCount = Object.entries(submitted).filter(
    ([qId, isSub]) => isSub && answers[Number(qId)] === QUESTIONS.find((q) => q.id === Number(qId))?.correctIndex
  ).length;

  return (
    <div className="workbench-viewport" style={{ border: '1px solid var(--border-medium)' }}>
      {/* Top Bar */}
      <div className="workbench-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HelpCircle size={15} style={{ color: 'var(--text-accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            COMPREHENSION SELF-AUDIT WORKBENCH
          </span>
          <span className="badge badge-observed">PEDAGOGICAL EVALUATION</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            SCORE: <strong style={{ color: 'var(--text-accent)' }}>{correctCount} / {QUESTIONS.length}</strong>
          </span>
          <button
            className="btn-instrument"
            onClick={resetAll}
            style={{ padding: '2px 7px', fontSize: '0.72rem' }}
          >
            <RotateCcw size={12} />
            RESET
          </button>
        </div>
      </div>

      {/* Questions Deck */}
      <div style={{ padding: '1.25rem', background: 'var(--bg-viewport)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {QUESTIONS.map((q) => {
          const isAnswered = submitted[q.id];
          const selectedOption = answers[q.id];
          const isCorrect = selectedOption === q.correctIndex;

          return (
            <div
              key={q.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="telemetry-label" style={{ color: 'var(--text-accent)' }}>
                  AUDIT ITEM {q.id} OF {QUESTIONS.length}
                </span>
                {isAnswered && (
                  isCorrect ? (
                    <span className="status-match"><CheckCircle2 size={12} /> VERIFIED</span>
                  ) : (
                    <span className="status-mismatch"><XCircle size={12} /> INCORRECT</span>
                  )
                )}
              </div>

              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 600 }}>
                {q.prompt}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  let borderStyle = '1px solid var(--border-subtle)';
                  let bgStyle = 'var(--bg-surface-elevated)';

                  if (isAnswered) {
                    if (optIdx === q.correctIndex) {
                      borderStyle = '1px solid var(--correct-color)';
                      bgStyle = 'rgba(34, 197, 94, 0.12)';
                    } else if (isSelected && !isCorrect) {
                      borderStyle = '1px solid var(--incorrect-color)';
                      bgStyle = 'rgba(239, 68, 68, 0.12)';
                    }
                  } else if (isSelected) {
                    borderStyle = '1px solid var(--text-accent)';
                    bgStyle = 'rgba(56, 189, 248, 0.12)';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      disabled={isAnswered}
                      style={{
                        background: bgStyle,
                        border: borderStyle,
                        borderRadius: '2px',
                        padding: '0.6rem 0.85rem',
                        textAlign: 'left',
                        cursor: isAnswered ? 'default' : 'pointer',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        minWidth: '20px'
                      }}>
                        [{String.fromCharCode(65 + optIdx)}]
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {!isAnswered ? (
                <button
                  className="btn-instrument btn-instrument-primary"
                  onClick={() => handleSubmit(q.id)}
                  disabled={selectedOption === undefined}
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}
                >
                  VERIFY ANSWER
                </button>
              ) : (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  borderLeft: `3px solid ${isCorrect ? 'var(--correct-color)' : 'var(--incorrect-color)'}`,
                  borderRadius: '0 2px 2px 0',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)'
                }}>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
