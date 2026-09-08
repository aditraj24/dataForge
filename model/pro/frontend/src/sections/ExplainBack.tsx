import React, { useState } from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { CheckCircle2, XCircle, HelpCircle, Award } from 'lucide-react';

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
    prompt: "What physical quantity does inference budget parameter k represent?",
    options: [
      "A fixed dollar amount spent on cloud compute",
      "In CoT: max token generation limit; In Latent: number of recurrent hidden state updates",
      "The number of layers in the neural network",
      "The batch size used during model evaluation"
    ],
    correctIndex: 1,
    explanation: "Correct! k is an inference-time compute parameter: for CoT it bounds token generation, while for Latent it dictates the exact recurrence depth."
  },
  {
    id: 2,
    prompt: "Why can equal nominal budgets (e.g. k=8) produce different wall-clock latencies?",
    options: [
      "Because one model was tested on GPU while the other was tested on CPU",
      "Because CoT can stop early on END_THINK and the two architectures have fundamentally different per-step FLOPs",
      "Because memory was allocated dynamically from random cloud instances",
      "They actually run at identical wall-clock speeds"
    ],
    correctIndex: 1,
    explanation: "Correct! The causal transformer forward pass per token differs in FLOPs and memory access from the cross-attention + GRUCell recurrence, and CoT supports early halting."
  },
  {
    id: 3,
    prompt: "What was the key empirical finding on Task A (Permutation Orbit Traversal) across scales?",
    options: [
      "Latent reasoning universally outperformed CoT across all budgets and scales",
      "Recurrent latent reasoning plateaued near ~33%, while CoT improved monotonically to 99.74% at 5M recovery",
      "Both models achieved 100% accuracy at 1M parameters",
      "Scaling parameters broke reasoning capability in both architectures"
    ],
    correctIndex: 1,
    explanation: "Correct! Across 126K, 1M, and 5M recovery, the latent model remained near ~33%, while CoT scaled with capacity and compute to 99.74%."
  },
  {
    id: 4,
    prompt: "Why is Task B (Modular Register Arithmetic) classified as [INCONCLUSIVE]?",
    options: [
      "The benchmark files were corrupted during evaluation",
      "Because both models performed near the 10% random chance baseline (10%–18.6%)",
      "Because only one seed was evaluated",
      "Because the register modulo operator was non-deterministic"
    ],
    correctIndex: 1,
    explanation: "Correct! Accuracies bounded between 10% and 18.6% on a 10-class problem do not provide clean empirical support for either hypothesis."
  },
  {
    id: 5,
    prompt: "What caused the original 5M experiment to stall near ~13% accuracy?",
    options: [
      "5M parameters exceeded the theoretical capacity of neural networks",
      "Severe optimization underfitting caused by a static 20-epoch AdamW recipe without warmup or decay",
      "The checkpoints were accidentally deleted",
      "The attention mechanism experienced mathematical singularity"
    ],
    correctIndex: 1,
    explanation: "Correct! Extending optimization to 50 epochs with linear warmup and cosine decay resolved underfitting and restored CoT to 99.74%."
  },
  {
    id: 6,
    prompt: "Which statement represents an [OBSERVED] empirical fact rather than a [HYPOTHESIS]?",
    options: [
      "The cross-attention mechanism is mathematically incapable of indirect pointer addressing",
      "Latent models experience rapid numerical state update contraction after steps 1–2",
      "GRU gating is the sole causal bottleneck preventing latent scaling",
      "Latent reasoning will fail on all multi-step algorithmic problems"
    ],
    correctIndex: 1,
    explanation: "Correct! Rapid numerical contraction of delta-h is directly measured. Causal claims about addressing bottlenecks are plausible hypotheses."
  },
  {
    id: 7,
    prompt: "What is the relationship between this project and BDH / BDH-CQ?",
    options: [
      "This project is the official production implementation of BDH",
      "The project's models are independent educational micro-benchmarks inspired by the concepts of internal state computation",
      "BDH proved that autoregressive generation is obsolete",
      "There is no conceptual connection between internal states and BDH"
    ],
    correctIndex: 1,
    explanation: "Correct! RecurrentLatentReasoner is an independent educational model exploring continuous test-time compute, distinct from official BDH systems."
  }
];

export const ExplainBack: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelect = (qId: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setSubmitted(prev => ({ ...prev, [qId]: true }));
  };

  const correctCount = Object.entries(answers).filter(
    ([qId, ansIdx]) => QUESTIONS.find(q => q.id === Number(qId))?.correctIndex === ansIdx
  ).length;

  return (
    <section id="section-explain-back" className="section-wrapper">
      <div className="essay-container">
        <div className="section-header">
          <div className="section-eyebrow">
            <span>Section 13</span>
            <span>&bull;</span>
            <span>Comprehension Review</span>
          </div>
          <h2 className="section-title">Explain It Back</h2>
          <p className="section-lead">
            Test your understanding of test-time compute allocation, Pareto frontiers, and the empirical boundary conditions uncovered in this study.
          </p>
        </div>

        {/* Questions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {QUESTIONS.map(q => {
            const selected = answers[q.id];
            const isAnswered = submitted[q.id];
            const isCorrect = selected === q.correctIndex;

            return (
              <div key={q.id} className="card" style={{
                borderColor: isAnswered
                  ? (isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)')
                  : 'var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    QUESTION 0{q.id} OF 0{QUESTIONS.length}
                  </span>
                  {isAnswered && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: isCorrect ? 'var(--latent-primary)' : '#ef4444'
                    }}>
                      {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span>{isCorrect ? 'Correct' : 'Review Explanation'}</span>
                    </span>
                  )}
                </div>

                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.05rem' }}>
                  {q.prompt}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isOptionSelected = selected === optIdx;
                    const isOptionCorrect = q.correctIndex === optIdx;

                    let bg = 'var(--bg-surface-elevated)';
                    let border = 'var(--border-subtle)';
                    let color = 'var(--text-primary)';

                    if (isAnswered) {
                      if (isOptionCorrect) {
                        bg = 'rgba(16, 185, 129, 0.15)';
                        border = '1px solid var(--latent-primary)';
                        color = 'var(--latent-primary)';
                      } else if (isOptionSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        border = '1px solid #ef4444';
                        color = '#ef4444';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelect(q.id, optIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: bg,
                          border: `1px solid ${border}`,
                          color: color,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.9rem',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isOptionSelected ? 'var(--cot-primary)' : 'var(--bg-surface)',
                          color: isOptionSelected ? '#ffffff' : 'var(--text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginRight: '0.75rem',
                          flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${isCorrect ? 'var(--latent-primary)' : '#ef4444'}`,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Score Summary */}
        <div className="card-elevated" style={{
          marginTop: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Award size={32} color="var(--text-accent)" />
          <h3 style={{ color: 'var(--text-primary)' }}>
            Comprehension Score: {correctCount} / {QUESTIONS.length}
          </h3>
          <p style={{ maxWidth: '600px', fontSize: '0.9rem' }}>
            {correctCount === QUESTIONS.length
              ? "Flawless! You understand the key trade-offs between explicit token scratchpads and recurrent latent computation."
              : "Review the explanations above to solidify the distinction between observed data, mechanistic hypotheses, and optimization recovery."}
          </p>
        </div>
      </div>
    </section>
  );
};
