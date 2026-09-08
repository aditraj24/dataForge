#!/usr/bin/env python
"""
dmo krne wala cLi skropt hy similation leb ki liye.
ekek exmple chlane dyta h bina pytorch ko hat lgayy.

aisy chlna h:
    python run_simulation.py --model cot --task permutation --budget 8
    python run_simulation.py --model latent --task permutation --budget 8
"""

import argparse
import sys
import json
from simulation_lab import SimulationLabEngine, TaskRegistry, ModelRegistry

def format_trace(trace_dict: dict) -> str:
    lines = []
    paradigm = trace_dict.get('paradigm', '')
    steps = trace_dict.get('steps', [])
    
    if paradigm == 'autoregressive_cot':
        lines.append("  [Autoregressive Scratchpad Trace]")
        for s in steps:
            lines.append(f"    Step {s['step_index']:2d} | Token: {s['token_str']:<10} (ID {s['token_id']:2d}, Type: {s['token_type']})")
    elif paradigm == 'recurrent_latent':
        lines.append("  [Recurrent Latent Transitions (Continuous Hidden States)]")
        for s in steps:
            top_cand = ", ".join([f"{k}:{v:.2f}" for k, v in list(s['top_logits'].items())[:2]])
            lines.append(f"    Step {s['step_index']:2d} | Predicted Token: {s['predicted_token_str']:<4} | ||h||_2: {s['hidden_norm']:.3f} | Top Logits: [{top_cand}]")
    elif paradigm == 'hebbian_synaptic':
        lines.append("  [BDH Synaptic Memory Transitions]")
        for s in steps:
            lines.append(f"    Phase: {s['phase']:<18} | Sparsity: {s['sparsity']:.2%} | ||sigma||_F: {s['sigma_norm']:.3f}")
            
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Thinking Budget Simulation Lab CLI Engine")
    parser.add_argument("--model", type=str, default="latent", choices=["cot", "latent", "hebbian", "autoregressive_cot", "recurrent_latent", "hebbian_synaptic"], help="Model to run")
    parser.add_argument("--task", type=str, default="permutation", choices=["permutation", "modular", "task_a", "task_b", "permutation_orbit", "modular_register"], help="Task to evaluate")
    parser.add_argument("--budget", "-k", type=int, default=8, choices=[1, 2, 4, 8, 12, 16], help="Reasoning compute budget k")
    parser.add_argument("--seed", type=int, default=42, choices=[42, 43, 44, 45, 46], help="Model checkpoint seed")
    parser.add_argument("--depth", type=int, default=None, help="Optional fixed problem depth D in [2, 16]")
    parser.add_argument("--device", type=str, default=None, help="Device ('cuda' or 'cpu')")
    parser.add_argument("--compare", action="store_true", help="Run side-by-side comparison between CoT and Latent")
    parser.add_argument("--sweep", action="store_true", help="Sweep across all budgets k={1,2,4,8,12,16} on a single example")
    parser.add_argument("--json", action="store_true", help="Output results as structured JSON")

    args = parser.parse_args()

    engine = SimulationLabEngine(device=args.device)
    device_info = engine.get_device_info()

    if not args.json:
        print("==================================================================")
        print("THINKING BUDGET SIMULATION LAB — BACKEND ENGINE")
        print(f"Active Device: {device_info['device_name']} ({device_info['device_type']})")
        print("==================================================================")

    # 1. ekk sy jjda modols ldaao
    if args.compare:
        res = engine.compare_models(
            models=["cot", "latent"],
            task=args.task,
            budget_k=args.budget,
            seed=args.seed,
            depth=args.depth
        )
        if args.json:
            print(json.dumps(res, indent=2))
            return

        ex = res['task_example']
        print(f"\n[Problem Instance] Task: {ex['task_name'].upper()} (Depth D={ex['depth']})")
        print(f"Input Tokens: {' '.join(ex['input_tokens'])}")
        print(f"Expected Answer: {ex['expected_answer_str']} (Ground Truth Trajectory: {' -> '.join(ex['ground_truth_trajectory_str'])})")
        print(f"\n[Side-by-Side Comparison at Budget k={args.budget}]")
        print("------------------------------------------------------------------")
        for m in res['models_evaluated']:
            corr = "CORRECT [PASS]" if m['correct'] else "INCORRECT [FAIL]"
            print(f"Model: {m['model_name']} ({m['paradigm']})")
            print(f"  Prediction: {m['predicted_answer_str']} ({corr})")
            print(f"  Latency:    {m['latency_ms']:.3f} ms | Analytical FLOPs: {m['analytical_flops']:,.0f}")
            print(f"  Parameters: {m['total_parameters']:,} total")
            print("  Trace Summary:")
            print(format_trace(m['trace']))
            print("------------------------------------------------------------------")
        return

    # 2. bidget saafo kro moad
    if args.sweep:
        canonical_task = TaskRegistry.resolve_task_id(args.task)
        ex = engine.generate_example(task=canonical_task, depth=args.depth)
        sweep_res = engine.sweep_budgets(model=args.model, task=canonical_task, example=ex, seed=args.seed)

        if args.json:
            print(json.dumps([r.to_dict() for r in sweep_res], indent=2))
            return

        print(f"\n[Problem Instance] Task: {ex.task_name.upper()} (Depth D={ex.depth})")
        print(f"Input: {' '.join(ex.input_tokens)}")
        print(f"Expected Answer: {ex.expected_answer_str} | Ground Truth: {' -> '.join(ex.ground_truth_trajectory_str)}")
        print(f"\n[Budget Sweep: Model '{args.model}' across k={{1, 2, 4, 8, 12, 16}}]")
        print(f"{'Budget k':<10} | {'Prediction':<12} | {'Correct':<9} | {'Latency (ms)':<14} | {'FLOPs':<12}")
        print("-" * 65)
        for r in sweep_res:
            corr_str = "YES" if r.correct else "NO"
            print(f"k = {r.budget_k:<6} | {r.predicted_answer_str:<12} | {corr_str:<9} | {r.latency_ms:<14.3f} | {r.analytical_flops:<12,.0f}")
        return

    # 3. normal ek hi symulation chlaio
    res = engine.run_simulation(
        model=args.model,
        task=args.task,
        budget_k=args.budget,
        seed=args.seed,
        depth=args.depth
    )

    if args.json:
        print(json.dumps(res.to_dict(), indent=2))
        return

    print(f"\nModel:        {res.model_name} (Paradigm: {res.paradigm})")
    print(f"Task:         {res.task_name.upper()} (Task ID: {res.task_id})")
    print(f"Budget:       k = {res.budget_k}")
    print(f"Checkpoint:   {res.checkpoint_path}")
    print(f"Problem Depth: D = {res.input_representation['depth']}")
    print(f"Input Prompt: {' '.join(res.input_representation['input_tokens'])}")
    print(f"\nExpected Answer:  {res.expected_answer_str}")
    print(f"Predicted Answer: {res.predicted_answer_str}")
    print(f"Correctness:      {'CORRECT [PASS]' if res.correct else 'INCORRECT [FAIL]'}")
    print(f"\nExecution Latency: {res.latency_ms:.3f} ms")
    print(f"Analytical FLOPs:  {res.analytical_flops:,.0f}")
    print(f"Total Parameters:  {res.total_parameters:,} ({res.trainable_parameters:,} trainable)")
    print("\nEducational Reasoning Trace:")
    print(format_trace(res.trace))
    print("==================================================================")

if __name__ == "__main__":
    main()
