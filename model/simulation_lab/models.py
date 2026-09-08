"""
Unified model adapters and checkpoint management for the Thinking Budget Simulation Lab.
Wraps AutoregressiveCoT, RecurrentLatentReasoner, and HebbianMemory into a consistent
polymorphic interface suitable for interactive simulation and educational inspection.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import torch
import torch.nn as nn

from models_cot_model import AutoregressiveCoT
from models_latent_model import RecurrentLatentReasoner
from models_hebbian_model import HebbianMemory
from data_generator import VOCAB
from simulation_lab.schemas import (
    TraceContainer,
    TokenTraceStep,
    LatentTraceStep,
    HebbianTraceStep,
    ModelMetadata
)
from simulation_lab.tasks import token_to_str, tokens_to_str_list
from simulation_lab.metrics import compute_analytical_flops, measure_execution_latency

CHECKPOINT_BASE_DIR = Path("export/models")

class BaseModelAdapter(ABC):
    """
Abstract interface governing all reasoning maadal components.
"""

    @property
    @abstractmethod
    def model_id(self) -> str:
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        pass

    @property
    @abstractmethod
    def paradigm(self) -> str:
        pass

    @property
    @abstractmethod
    def supported_budgets(self) -> List[int]:
        pass

    @abstractmethod
    def count_parameters(self) -> Tuple[int, int]:
        """
wapes dos (total_parmeters, trainable_parmeters).
"""
        pass

    @abstractmethod
    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        """
laod kros weights from checkpoint. wapes dos laod kroed path.
"""
        pass

    @abstractmethod
    def reset_state(self) -> None:
        """
Resetts any recurrent, internal, or synaptic state.
"""
        pass

    @abstractmethod
    def predict_with_trace(
        self,
        input_ids: List[int],
        budget_k: int,
        measure_timing: bool = True
    ) -> Dict[str, Any]:
        """
        Executes inference and returns:
            - predicted_answer: int
            - predicted_answer_str: str
            - latency_ms: float
            - analytical_flops: float
            - trace: TraceContainer
        """
        pass

    def predict(
        self,
        input_ids: List[int],
        budget_k: int
    ) -> int:
        """
        Executes inference and returns the predicted categorical answer integer.
        """
        res = self.predict_with_trace(input_ids, budget_k, measure_timing=False)
        return res['predicted_answer']

    def to_device(self, device: torch.device):
        self.device = device
        if hasattr(self, 'model') and isinstance(self.model, nn.Module):
            self.model.to(device)
        return self


class CoTModelAdapter(BaseModelAdapter):
    """
Adapter kay lyye AutoregressiveCoT (causal Transformer scratchpad reasoning).
"""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = AutoregressiveCoT().to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "autoregressive_cot"

    @property
    def display_name(self) -> str:
        return "Autoregressive CoT Transformer"

    @property
    def paradigm(self) -> str:
        return "autoregressive_cot"

    @property
    def supported_budgets(self) -> List[int]:
        return [1, 2, 4, 8, 12, 16]

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        # Stateless causal transformer; ensure eval mode
        self.model.eval()

    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
        else:
            # Map canonical task name ko directory naming convention
            task_tag = "task_a" if "a" in task_name.lower() or "permutation" in task_name.lower() else "task_b"
            path = CHECKPOINT_BASE_DIR / f"cot_{task_tag}_s{seed}_aligned" / "weights.pth"

        if not path.exists():
            raise FileNotFoundError(f"CoT checkpoint not found at: {path}")

        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.current_checkpoint = str(path)
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(
        self,
        input_ids: List[int],
        budget_k: int,
        measure_timing: bool = True
    ) -> Dict[str, Any]:
        self.reset_state()
        tensor_in = torch.tensor([input_ids], dtype=torch.long, device=self.device)

        def _infer():
            # Step-by-step autoregressive generation exposing exact token trajectory
            B = tensor_in.shape[0]
            think_tok = torch.tensor([[VOCAB['THINK']]], device=self.device).expand(B, 1)
            curr_seq = torch.cat([tensor_in, think_tok], dim=1)

            generated_tokens = []
            active = True

            for step_idx in range(budget_k):
                if not active:
                    break
                logits = self.model.forward(curr_seq)[:, -1, :]
                next_tok = int(logits.argmax(dim=-1).item())
                generated_tokens.append(next_tok)

                if next_tok == VOCAB['END_THINK']:
                    active = False

                tok_tensor = torch.tensor([[next_tok]], device=self.device)
                curr_seq = torch.cat([curr_seq, tok_tensor], dim=1)

            # Emit ANS aor final answer
            ans_tok = torch.tensor([[VOCAB['ANS']]], device=self.device).expand(B, 1)
            curr_seq = torch.cat([curr_seq, ans_tok], dim=1)

            logits = self.model.forward(curr_seq)[:, -1, :]
            pred_ans = int(logits.argmax(dim=-1).item())

            return {
                'pred_ans': pred_ans,
                'generated_tokens': generated_tokens,
                'full_seq': curr_seq[0].tolist()
            }

        if measure_timing:
            latency_ms, res = measure_execution_latency(_infer, device=self.device)
        else:
            latency_ms = 0.0
            res = _infer()

        pred_ans = res['pred_ans']
        gen_tokens = res['generated_tokens']
        total_tokens_generated = len(gen_tokens)

        # Build educational token trace
        trace_steps = []
        for i, tok in enumerate(gen_tokens):
            tok_str = token_to_str(tok)
            tok_type = 'think_end' if tok == VOCAB['END_THINK'] else 'reasoning_step'
            trace_steps.append(TokenTraceStep(
                step_index=i + 1,
                token_id=tok,
                token_str=tok_str,
                token_type=tok_type,
                cumulative_tokens=i + 1
            ))

        trace = TraceContainer(
            paradigm="autoregressive_cot",
            description="Discrete sequential scratchpad generation. The model emits intermediate tokens before forced answer emission.",
            steps=trace_steps,
            raw_summary={
                "tokens_generated": total_tokens_generated,
                "budget_k": budget_k,
                "early_terminated": (VOCAB['END_THINK'] in gen_tokens),
                "generated_tokens_str": [token_to_str(t) for t in gen_tokens],
                "prompt_tokens_str": tokens_to_str_list(input_ids)
            }
        )

        flops = compute_analytical_flops("autoregressive_cot", total_tokens_generated)

        return {
            'predicted_answer': pred_ans,
            'predicted_answer_str': token_to_str(pred_ans),
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


class LatentModelAdapter(BaseModelAdapter):
    """
Adapter kay lyye RecurrentLatentReasoner (continuous recurrent state iteration).
"""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = RecurrentLatentReasoner().to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "recurrent_latent"

    @property
    def display_name(self) -> str:
        return "Recurrent Latent Reasoner"

    @property
    def paradigm(self) -> str:
        return "recurrent_latent"

    @property
    def supported_budgets(self) -> List[int]:
        return [1, 2, 4, 8, 12, 16]

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        self.model.eval()

    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
        else:
            task_tag = "task_a" if "a" in task_name.lower() or "permutation" in task_name.lower() else "task_b"
            path = CHECKPOINT_BASE_DIR / f"latent_{task_tag}_s{seed}_aligned" / "weights.pth"

        if not path.exists():
            raise FileNotFoundError(f"Latent checkpoint not found at: {path}")

        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.current_checkpoint = str(path)
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(
        self,
        input_ids: List[int],
        budget_k: int,
        measure_timing: bool = True
    ) -> Dict[str, Any]:
        self.reset_state()
        tensor_in = torch.tensor([input_ids], dtype=torch.long, device=self.device)

        def _infer():
            # chelao exact k steps aor collect state metrics
            memory = self.model.encode_memory(tensor_in)
            h = memory[:, -1, :].clone()

            step_records = []
            for s in range(budget_k):
                h = self.model.step(h, memory)
                logits = self.model.head(h)[0]
                pred_tok = int(logits.argmax(dim=-1).item())

                # Top-3 logits kay lyye inspection
                topk_vals, topk_inds = torch.topk(logits, k=3)
                top3 = {token_to_str(idx.item()): float(val.item()) for val, idx in zip(topk_vals, topk_inds)}

                step_records.append({
                    'step': s + 1,
                    'hidden_norm': float(h.norm(p=2).item()),
                    'hidden_mean': float(h.mean().item()),
                    'hidden_std': float(h.std().item()),
                    'pred_tok': pred_tok,
                    'top_logits': top3
                })

            final_ans = step_records[-1]['pred_tok']
            return {
                'final_ans': final_ans,
                'step_records': step_records
            }

        if measure_timing:
            latency_ms, res = measure_execution_latency(_infer, device=self.device)
        else:
            latency_ms = 0.0
            res = _infer()

        final_ans = res['final_ans']
        step_records = res['step_records']

        # Build educational latent trace
        trace_steps = [
            LatentTraceStep(
                step_index=rec['step'],
                hidden_norm=rec['hidden_norm'],
                hidden_mean=rec['hidden_mean'],
                hidden_std=rec['hidden_std'],
                predicted_token_id=rec['pred_tok'],
                predicted_token_str=token_to_str(rec['pred_tok']),
                top_logits=rec['top_logits']
            )
            for rec in step_records
        ]

        trace = TraceContainer(
            paradigm="recurrent_latent",
            description="Continuous recurrent state iteration. Hidden representations evolve through cross-attention to structured memory without emitting intermediate tokens.",
            steps=trace_steps,
            raw_summary={
                "steps_executed": budget_k,
                "fixed_exact_execution": True,
                "adaptive_halting": False,
                "prompt_tokens_str": tokens_to_str_list(input_ids)
            }
        )

        flops = compute_analytical_flops("recurrent_latent", budget_k)

        return {
            'predicted_answer': final_ans,
            'predicted_answer_str': token_to_str(final_ans),
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


class HebbianModelAdapter(BaseModelAdapter):
    """
Adapter kay lyye HebbianMemory (BDH-style outer-product fast weight synaptic plasticity).
"""

    def __init__(self, n_neurons: int = 128, state_dim: int = 64, lr: float = 0.01, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = HebbianMemory(n_neurons=n_neurons, state_dim=state_dim, lr=lr).to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "hebbian_synaptic"

    @property
    def display_name(self) -> str:
        return "BDH Hebbian Synaptic Memory"

    @property
    def paradigm(self) -> str:
        return "hebbian_synaptic"

    @property
    def supported_budgets(self) -> List[int]:
        return [1]  # Hebbian operates per store/recall episode

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        self.model.reset_memory()
        self.model.eval()

    def load_checkpoint(self, task_name: str = "associative", seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        # Hebbian maadal checkpoint path if exists, otherwise initializes clean state
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
            if path.exists():
                state_dict = torch.load(path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                self.current_checkpoint = str(path)
                return self.current_checkpoint

        self.reset_state()
        self.current_checkpoint = "initialized_in_memory"
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(
        self,
        input_ids: List[int],
        budget_k: int = 1,
        measure_timing: bool = True
    ) -> Dict[str, Any]:
        """
        Executes an associative store/recall episode for demonstration.
        Uses a continuous vector query derived from input_ids.
        """
        self.reset_state()
        d = self.model.d
        
        # Derive reproducible continuous query from input token ids
        rng = torch.Generator(device='cpu')
        rng.manual_seed(sum(input_ids) % 1_000_000)
        query_vec = torch.randn(1, d, generator=rng, dtype=torch.float32).to(self.device)
        
        # Key-value pair ko associate
        key_vec = torch.randn(1, d, generator=rng, dtype=torch.float32).to(self.device)
        val_vec = torch.randn(1, d, generator=rng, dtype=torch.float32).to(self.device)

        def _infer():
            # Phase 1: Write association (x pre-synaptic, y post-synaptic)
            out_write = self.model.forward(query=query_vec, store_pairs=(key_vec, val_vec))
            
            # Phase 2: Read association
            out_read = self.model.forward(query=key_vec)
            return out_write, out_read

        if measure_timing:
            latency_ms, (out_write, out_read) = measure_execution_latency(_infer, device=self.device)
        else:
            latency_ms = 0.0
            out_write, out_read = _infer()

        sigma_mat = self.model.sigma.detach().cpu()
        sigma_norm = float(sigma_mat.norm(p='fro').item())
        sparsity = float(out_read['sparsity'].item())
        retrieved_norm = float(out_read['output'].norm(p=2).item())

        trace_steps = [
            HebbianTraceStep(
                phase="write_association",
                sparsity=float(out_write['sparsity'].item()),
                sigma_norm=sigma_norm,
                retrieved_norm=float(out_write['output'].norm(p=2).item()),
                output_norm=float(out_write['output'].norm(p=2).item())
            ),
            HebbianTraceStep(
                phase="read_retrieval",
                sparsity=sparsity,
                sigma_norm=sigma_norm,
                retrieved_norm=retrieved_norm,
                output_norm=retrieved_norm
            )
        ]

        trace = TraceContainer(
            paradigm="hebbian_synaptic",
            description="Synaptic fast-weight plasticity (BDH outer-product update). Connections strengthen when pre- and post-synaptic activations coincide.",
            steps=trace_steps,
            raw_summary={
                "sigma_shape": list(self.model.sigma.shape),
                "sigma_frobenius_norm": sigma_norm,
                "read_sparsity": sparsity
            }
        )

        flops = compute_analytical_flops("hebbian_synaptic", 1)

        return {
            'predicted_answer': 0,
            'predicted_answer_str': "Vector Association Recalled",
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


# ── 1M Capacity-Scaling maadal Adapters ────────────────────────────────────────
CHECKPOINT_BASE_DIR_1M = Path("export/models_1m")
COT_1M_KWARGS = dict(d_model=224, nhead=4, num_layers=2, dim_feedforward=624, max_len=96, vocab_size=24)
LATENT_1M_KWARGS = dict(d_model=224, nhead=4, dim_feedforward=1027, max_len=96, vocab_size=24)


class CoTModelAdapter1M(BaseModelAdapter):
    """
Adapter kay lyye d ~1M-parmeter AutoregressiveCoT (d_maadal=224, ff=624, layers=2).
"""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = AutoregressiveCoT(**COT_1M_KWARGS).to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "autoregressive_cot_1m"

    @property
    def display_name(self) -> str:
        return "Autoregressive CoT Transformer (1M)"

    @property
    def paradigm(self) -> str:
        return "autoregressive_cot"

    @property
    def supported_budgets(self) -> List[int]:
        return [1, 2, 4, 8, 12, 16]

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        self.model.eval()

    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
        else:
            task_tag = "task_a" if "a" in task_name.lower() or "permutation" in task_name.lower() else "task_b"
            path = CHECKPOINT_BASE_DIR_1M / f"cot_{task_tag}_s{seed}_aligned" / "weights.pth"

        if not path.exists():
            raise FileNotFoundError(f"CoT 1M checkpoint not found at: {path}")

        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.current_checkpoint = str(path)
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(self, input_ids: List[int], budget_k: int, measure_timing: bool = True) -> Dict[str, Any]:
        self.reset_state()
        tensor_in = torch.tensor([input_ids], dtype=torch.long, device=self.device)

        def _generate():
            return self.model.generate(tensor_in, max_budget_k=budget_k)

        if measure_timing:
            latency_ms, gen_result = measure_execution_latency(_generate, self.device)
        else:
            gen_result = _generate()
            latency_ms = 0.0

        pred_ans = int(gen_result['final_ans'][0].item())
        total_tokens_generated = gen_result['tokens_generated']
        full_seq = gen_result['full_seq'][0].tolist()
        gen_tokens = full_seq[len(input_ids):]

        trace_steps = []
        for i, tok in enumerate(gen_tokens):
            tok_str = token_to_str(tok)
            tok_type = 'think_end' if tok == VOCAB['END_THINK'] else 'reasoning_step'
            trace_steps.append(TokenTraceStep(
                step_index=i + 1,
                token_id=tok,
                token_str=tok_str,
                token_type=tok_type,
                cumulative_tokens=i + 1
            ))

        trace = TraceContainer(
            paradigm="autoregressive_cot",
            description="Intermediate scratchpad token generation (1M capacity). Reasoning is exposed as discrete verbal tokens before emitting final answer.",
            steps=trace_steps,
            raw_summary={
                "tokens_generated": total_tokens_generated,
                "budget_k": budget_k,
                "completed_reasoning": any(t == VOCAB['END_THINK'] for t in gen_tokens),
                "generated_tokens_str": tokens_to_str_list(gen_tokens),
                "scale": "1m"
            }
        )

        flops = compute_analytical_flops("autoregressive_cot", total_tokens_generated,
                                          d_model=224, dim_feedforward_cot=624, num_layers=2)

        return {
            'predicted_answer': pred_ans,
            'predicted_answer_str': token_to_str(pred_ans),
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


class LatentModelAdapter1M(BaseModelAdapter):
    """
Adapter kay lyye d ~1M-parmeter RecurrentLatentReasoner (d_maadal=224, ff=1027).
"""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = RecurrentLatentReasoner(**LATENT_1M_KWARGS).to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "recurrent_latent_1m"

    @property
    def display_name(self) -> str:
        return "Recurrent Latent Reasoner (1M)"

    @property
    def paradigm(self) -> str:
        return "recurrent_latent"

    @property
    def supported_budgets(self) -> List[int]:
        return [1, 2, 4, 8, 12, 16]

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        self.model.eval()

    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
        else:
            task_tag = "task_a" if "a" in task_name.lower() or "permutation" in task_name.lower() else "task_b"
            path = CHECKPOINT_BASE_DIR_1M / f"latent_{task_tag}_s{seed}_aligned" / "weights.pth"

        if not path.exists():
            raise FileNotFoundError(f"Latent 1M checkpoint not found at: {path}")

        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.current_checkpoint = str(path)
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(self, input_ids: List[int], budget_k: int, measure_timing: bool = True) -> Dict[str, Any]:
        self.reset_state()
        tensor_in = torch.tensor([input_ids], dtype=torch.long, device=self.device)

        def _infer():
            memory = self.model.encode_memory(tensor_in)
            h = memory[:, -1, :].clone()
            step_records = []
            for s in range(budget_k):
                h = self.model.step(h, memory)
                logits = self.model.head(h)[0]
                pred_tok = int(logits.argmax(dim=-1).item())
                topk_vals, topk_inds = torch.topk(logits, k=3)
                top3 = {token_to_str(idx.item()): float(val.item()) for val, idx in zip(topk_vals, topk_inds)}
                step_records.append({
                    'step_index': s + 1,
                    'hidden_norm': float(h.norm(p=2).item()),
                    'hidden_mean': float(h.mean().item()),
                    'hidden_std': float(h.std().item()),
                    'predicted_token_id': pred_tok,
                    'predicted_token_str': token_to_str(pred_tok),
                    'top_logits': top3
                })
            return h, step_records

        if measure_timing:
            latency_ms, (h_final, step_records) = measure_execution_latency(_infer, self.device)
        else:
            h_final, step_records = _infer()
            latency_ms = 0.0

        final_logits = self.model.head(h_final)[0]
        pred_ans = int(final_logits.argmax(dim=-1).item())

        trace = TraceContainer(
            paradigm='recurrent_latent',
            description="Continuous recurrent state iteration (1M capacity). Hidden representations evolve through cross-attention to structured memory without emitting intermediate tokens.",
            steps=[LatentTraceStep(**rec) for rec in step_records],
            raw_summary={"budget_k": budget_k, "total_steps": budget_k, "scale": "1m"}
        )

        flops = compute_analytical_flops("recurrent_latent", budget_k,
                                          d_model=224, dim_feedforward_latent=1027)

        return {
            'predicted_answer': pred_ans,
            'predicted_answer_str': token_to_str(pred_ans),
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


# ── 5M Capacity-Scaling maadal Adapters (Recovery Condition) ───────────────────
CHECKPOINT_BASE_DIR_5M = Path("export/models_5m_recovery")
COT_5M_KWARGS = dict(d_model=544, nhead=4, num_layers=2, dim_feedforward=1168, max_len=96, vocab_size=24)
LATENT_5M_KWARGS = dict(d_model=544, nhead=4, dim_feedforward=1795, max_len=96, vocab_size=24)


class CoTModelAdapter5M(BaseModelAdapter):
    """
Adapter kay lyye d ~5M-parmeter AutoregressiveCoT (d_maadal=544, ff=1168, layers=2) from d recovery experiment.
"""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = AutoregressiveCoT(**COT_5M_KWARGS).to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "autoregressive_cot_5m"

    @property
    def display_name(self) -> str:
        return "Autoregressive CoT Transformer (5M Recovery)"

    @property
    def paradigm(self) -> str:
        return "autoregressive_cot"

    @property
    def supported_budgets(self) -> List[int]:
        return [1, 2, 4, 8, 12, 16]

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        self.model.eval()

    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
        else:
            task_tag = "task_a" if "a" in task_name.lower() or "permutation" in task_name.lower() else "task_b"
            path = CHECKPOINT_BASE_DIR_5M / f"cot_{task_tag}_s{seed}_recovery" / "weights.pth"
            if not path.exists():
                fallback = CHECKPOINT_BASE_DIR_5M / f"cot_{task_tag}_s{seed}_aligned" / "weights.pth"
                if fallback.exists():
                    path = fallback

        if not path.exists():
            raise FileNotFoundError(f"CoT 5M Recovery checkpoint not found at: {path}")

        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.current_checkpoint = str(path)
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(self, input_ids: List[int], budget_k: int, measure_timing: bool = True) -> Dict[str, Any]:
        self.reset_state()
        tensor_in = torch.tensor([input_ids], dtype=torch.long, device=self.device)

        def _generate():
            return self.model.generate(tensor_in, max_budget_k=budget_k)

        if measure_timing:
            latency_ms, gen_result = measure_execution_latency(_generate, self.device)
        else:
            gen_result = _generate()
            latency_ms = 0.0

        pred_ans = int(gen_result['final_ans'][0].item())
        total_tokens_generated = gen_result['tokens_generated']
        full_seq = gen_result['full_seq'][0].tolist()
        gen_tokens = full_seq[len(input_ids):]

        trace_steps = []
        for i, tok in enumerate(gen_tokens):
            tok_str = token_to_str(tok)
            tok_type = 'think_end' if tok == VOCAB['END_THINK'] else 'reasoning_step'
            trace_steps.append(TokenTraceStep(
                step_index=i + 1,
                token_id=tok,
                token_str=tok_str,
                token_type=tok_type,
                cumulative_tokens=i + 1
            ))

        trace = TraceContainer(
            paradigm="autoregressive_cot",
            description="Intermediate scratchpad token generation (5M capacity, recovery condition). Reasoning is exposed as discrete verbal tokens before emitting final answer.",
            steps=trace_steps,
            raw_summary={
                "tokens_generated": total_tokens_generated,
                "budget_k": budget_k,
                "completed_reasoning": any(t == VOCAB['END_THINK'] for t in gen_tokens),
                "generated_tokens_str": tokens_to_str_list(gen_tokens),
                "scale": "5m_recovery"
            }
        )

        flops = compute_analytical_flops("autoregressive_cot", total_tokens_generated,
                                          d_model=544, dim_feedforward_cot=1168, num_layers=2)

        return {
            'predicted_answer': pred_ans,
            'predicted_answer_str': token_to_str(pred_ans),
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


class LatentModelAdapter5M(BaseModelAdapter):
    """
Adapter kay lyye d ~5M-parmeter RecurrentLatentReasoner (d_maadal=544, ff=1795) from d recovery experiment.
"""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = RecurrentLatentReasoner(**LATENT_5M_KWARGS).to(self.device)
        self.model.eval()
        self.current_checkpoint: Optional[str] = None

    @property
    def model_id(self) -> str:
        return "recurrent_latent_5m"

    @property
    def display_name(self) -> str:
        return "Recurrent Latent Reasoner (5M Recovery)"

    @property
    def paradigm(self) -> str:
        return "recurrent_latent"

    @property
    def supported_budgets(self) -> List[int]:
        return [1, 2, 4, 8, 12, 16]

    def count_parameters(self) -> Tuple[int, int]:
        total = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        return total, trainable

    def reset_state(self) -> None:
        self.model.eval()

    def load_checkpoint(self, task_name: str, seed: int = 42, checkpoint_path: Optional[str] = None) -> str:
        if checkpoint_path is not None:
            path = Path(checkpoint_path)
        else:
            task_tag = "task_a" if "a" in task_name.lower() or "permutation" in task_name.lower() else "task_b"
            path = CHECKPOINT_BASE_DIR_5M / f"latent_{task_tag}_s{seed}_recovery" / "weights.pth"
            if not path.exists():
                fallback = CHECKPOINT_BASE_DIR_5M / f"latent_{task_tag}_s{seed}_aligned" / "weights.pth"
                if fallback.exists():
                    path = fallback

        if not path.exists():
            raise FileNotFoundError(f"Latent 5M Recovery checkpoint not found at: {path}")

        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.current_checkpoint = str(path)
        return self.current_checkpoint

    @torch.no_grad()
    def predict_with_trace(self, input_ids: List[int], budget_k: int, measure_timing: bool = True) -> Dict[str, Any]:
        self.reset_state()
        tensor_in = torch.tensor([input_ids], dtype=torch.long, device=self.device)

        def _infer():
            memory = self.model.encode_memory(tensor_in)
            h = memory[:, -1, :].clone()
            step_records = []
            for s in range(budget_k):
                h = self.model.step(h, memory)
                logits = self.model.head(h)[0]
                pred_tok = int(logits.argmax(dim=-1).item())
                topk_vals, topk_inds = torch.topk(logits, k=3)
                top3 = {token_to_str(idx.item()): float(val.item()) for val, idx in zip(topk_vals, topk_inds)}
                step_records.append({
                    'step_index': s + 1,
                    'hidden_norm': float(h.norm(p=2).item()),
                    'hidden_mean': float(h.mean().item()),
                    'hidden_std': float(h.std().item()),
                    'predicted_token_id': pred_tok,
                    'predicted_token_str': token_to_str(pred_tok),
                    'top_logits': top3
                })
            return h, step_records

        if measure_timing:
            latency_ms, (h_final, step_records) = measure_execution_latency(_infer, self.device)
        else:
            h_final, step_records = _infer()
            latency_ms = 0.0

        final_logits = self.model.head(h_final)[0]
        pred_ans = int(final_logits.argmax(dim=-1).item())

        trace = TraceContainer(
            paradigm='recurrent_latent',
            description="Continuous recurrent state iteration (5M capacity, recovery condition). Hidden representations evolve through cross-attention to structured memory without emitting intermediate tokens.",
            steps=[LatentTraceStep(**rec) for rec in step_records],
            raw_summary={"budget_k": budget_k, "total_steps": budget_k, "scale": "5m_recovery"}
        )

        flops = compute_analytical_flops("recurrent_latent", budget_k,
                                          d_model=544, dim_feedforward_latent=1795)

        return {
            'predicted_answer': pred_ans,
            'predicted_answer_str': token_to_str(pred_ans),
            'latency_ms': latency_ms,
            'analytical_flops': flops,
            'trace': trace.to_dict()
        }


class ModelRegistry:
    """
Central registry aor factory kay lyye all reasoning maadal adapters.
"""

    AVAILABLE_MODELS = {
        'autoregressive_cot': {
            'model_id': 'autoregressive_cot',
            'aliases': ['cot', 'transformer', 'autoregressive'],
            'display_name': 'Autoregressive CoT Transformer',
            'paradigm': 'autoregressive_cot',
            'description': '2-layer causal Transformer generating intermediate scratchpad tokens.',
            'adapter_class': CoTModelAdapter,
            'supported_budgets': [1, 2, 4, 8, 12, 16],
            'supported_tasks': ['permutation_orbit', 'modular_register'],
            'available_seeds': [42, 43, 44, 45, 46]
        },
        'recurrent_latent': {
            'model_id': 'recurrent_latent',
            'aliases': ['latent', 'gru', 'recurrent'],
            'display_name': 'Recurrent Latent Reasoner',
            'paradigm': 'recurrent_latent',
            'description': 'Cross-attention + GRUCell recurring across continuous latent states.',
            'adapter_class': LatentModelAdapter,
            'supported_budgets': [1, 2, 4, 8, 12, 16],
            'supported_tasks': ['permutation_orbit', 'modular_register'],
            'available_seeds': [42, 43, 44, 45, 46]
        },
        'hebbian_synaptic': {
            'model_id': 'hebbian_synaptic',
            'aliases': ['hebbian', 'bdh', 'synaptic'],
            'display_name': 'BDH Hebbian Synaptic Memory',
            'paradigm': 'hebbian_synaptic',
            'description': 'Fast-weight outer-product synaptic plasticity for continuous vector association (standalone demo).',
            'adapter_class': HebbianModelAdapter,
            'supported_budgets': [1],
            'supported_tasks': ['associative'],
            'available_seeds': [42]
        },
        'autoregressive_cot_1m': {
            'model_id': 'autoregressive_cot_1m',
            'aliases': ['cot_1m', 'cot-1m'],
            'display_name': 'Autoregressive CoT Transformer (1M)',
            'paradigm': 'autoregressive_cot',
            'description': '~1M-parameter 2-layer causal Transformer (d_model=224, ff=624) for capacity-scaling experiment.',
            'adapter_class': CoTModelAdapter1M,
            'supported_budgets': [1, 2, 4, 8, 12, 16],
            'supported_tasks': ['permutation_orbit', 'modular_register'],
            'available_seeds': [42, 43, 44, 45, 46]
        },
        'recurrent_latent_1m': {
            'model_id': 'recurrent_latent_1m',
            'aliases': ['latent_1m', 'latent-1m'],
            'display_name': 'Recurrent Latent Reasoner (1M)',
            'paradigm': 'recurrent_latent',
            'description': '~1M-parameter cross-attention + GRUCell reasoner (d_model=224, ff=1027) for capacity-scaling experiment.',
            'adapter_class': LatentModelAdapter1M,
            'supported_budgets': [1, 2, 4, 8, 12, 16],
            'supported_tasks': ['permutation_orbit', 'modular_register'],
            'available_seeds': [42, 43, 44, 45, 46]
        },
        'autoregressive_cot_5m': {
            'model_id': 'autoregressive_cot_5m',
            'aliases': ['cot_5m', 'cot-5m', 'cot_5m_recovery', 'autoregressive_cot_5m_recovery'],
            'display_name': 'Autoregressive CoT Transformer (5M Recovery)',
            'paradigm': 'autoregressive_cot',
            'description': '~5M-parameter 2-layer causal Transformer (d_model=544, ff=1168) from the controlled 5M Convergence Recovery experiment (export/models_5m_recovery/).',
            'adapter_class': CoTModelAdapter5M,
            'supported_budgets': [1, 2, 4, 8, 12, 16],
            'supported_tasks': ['permutation_orbit', 'modular_register'],
            'available_seeds': [42, 43, 44, 45, 46]
        },
        'recurrent_latent_5m': {
            'model_id': 'recurrent_latent_5m',
            'aliases': ['latent_5m', 'latent-5m', 'latent_5m_recovery', 'recurrent_latent_5m_recovery'],
            'display_name': 'Recurrent Latent Reasoner (5M Recovery)',
            'paradigm': 'recurrent_latent',
            'description': '~5M-parameter cross-attention + GRUCell reasoner (d_model=544, ff=1795) from the controlled 5M Convergence Recovery experiment (export/models_5m_recovery/).',
            'adapter_class': LatentModelAdapter5M,
            'supported_budgets': [1, 2, 4, 8, 12, 16],
            'supported_tasks': ['permutation_orbit', 'modular_register'],
            'available_seeds': [42, 43, 44, 45, 46]
        }
    }

    @classmethod
    def resolve_model_id(cls, name: str) -> str:
        clean = name.strip().lower()
        for mid, info in cls.AVAILABLE_MODELS.items():
            if clean == mid or clean in info['aliases']:
                return mid
        valid = list(cls.AVAILABLE_MODELS.keys())
        raise ValueError(f"Unknown model '{name}'. Available models: {valid}")

    @classmethod
    def list_models(cls) -> List[ModelMetadata]:
        result = []
        for mid, info in cls.AVAILABLE_MODELS.items():
            # Temporary instantiate ko get exact counts
            adapter = info['adapter_class'](device=torch.device('cpu'))
            total, trainable = adapter.count_parameters()
            result.append(ModelMetadata(
                model_id=info['model_id'],
                display_name=info['display_name'],
                paradigm=info['paradigm'],
                description=info['description'],
                total_parameters=total,
                trainable_parameters=trainable,
                supported_budgets=info['supported_budgets'],
                supported_tasks=info['supported_tasks'],
                available_seeds=info['available_seeds']
            ))
        return result

    @classmethod
    def create_adapter(cls, model_name: str, device: Optional[torch.device] = None) -> BaseModelAdapter:
        mid = cls.resolve_model_id(model_name)
        adapter_cls = cls.AVAILABLE_MODELS[mid]['adapter_class']
        return adapter_cls(device=device)

