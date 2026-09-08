"""
Task adapters and utilities for the Thinking Budget Simulation Lab.
Exposes standardized single-example generation, batch conversion, and vocabulary mapping.
"""

from typing import List, Dict, Any, Optional
import numpy as np
import torch

from data_generator import (
    VOCAB,
    VOCAB_SIZE,
    TaskAPermutationOrbit,
    TaskBModularRegister,
    collate_fn_pad
)
from simulation_lab.schemas import TaskExample

# Invert vocabulary kay lyye educational string representations
INV_VOCAB = {v: k for k, v in VOCAB.items()}

def token_to_str(token_id: int) -> str:
    """
Converts integer token ID ko human-readable string token.
"""
    return INV_VOCAB.get(token_id, f"UNK_{token_id}")

def tokens_to_str_list(token_ids: List[int]) -> List[str]:
    """
Converts list ka token IDs ko list ka string tokens.
"""
    return [token_to_str(t) for t in token_ids]

class TaskRegistry:
    """
Registry aor generator kay lyye synthetic reasoning tasks.
"""

    AVAILABLE_TASKS = {
        'permutation_orbit': {
            'task_id': 'permutation_orbit',
            'alias': ['task_a', 'permutation', 'orbit'],
            'display_name': 'Permutation Orbit Traversal (Task A)',
            'description': 'Iterative algorithmic state transitions in S_8 (N=8) across difficulty depth D in [2, 16].',
            'generator_class': TaskAPermutationOrbit,
            'state_domain': [0, 1, 2, 3, 4, 5, 6, 7],
            'answer_domain_size': 8
        },
        'modular_register': {
            'task_id': 'modular_register',
            'alias': ['task_b', 'modular', 'register'],
            'display_name': 'Modular Register Arithmetic (Task B)',
            'description': 'Multi-step modular arithmetic (ADD, MUL, SUB mod 10) across difficulty depth D in [2, 16].',
            'generator_class': TaskBModularRegister,
            'state_domain': list(range(10)),
            'answer_domain_size': 10
        },
        'associative': {
            'task_id': 'associative',
            'alias': ['associative_memory', 'hebbian_task', 'vector_association'],
            'display_name': 'Continuous Vector Association (Hebbian)',
            'description': 'Associative memory recall of continuous 64-d key-value concept pairs (standalone Hebbian demo).',
            'generator_class': None,
            'state_domain': list(range(10)),
            'answer_domain_size': 1
        }
    }

    @classmethod
    def resolve_task_id(cls, name: str) -> str:
        """
Resolves task names/aliases ko canonical task_id.
"""
        clean = name.strip().lower()
        for task_id, info in cls.AVAILABLE_TASKS.items():
            if clean == task_id or clean in info['alias']:
                return task_id
        valid = list(cls.AVAILABLE_TASKS.keys())
        raise ValueError(f"Unknown task '{name}'. Available tasks: {valid}")

    @classmethod
    def list_tasks(cls) -> List[Dict[str, Any]]:
        """
wapes dos metadetta kay lyye all available tasks.
"""
        return [
            {
                'task_id': info['task_id'],
                'display_name': info['display_name'],
                'description': info['description'],
                'aliases': info['alias'],
                'answer_domain_size': info['answer_domain_size']
            }
            for info in cls.AVAILABLE_TASKS.values()
        ]

    @classmethod
    def generate_example(
        cls,
        task_name: str,
        depth: Optional[int] = None,
        seed: Optional[int] = None
    ) -> TaskExample:
        """
        Generates a single synthetic problem instance for interactive lab simulation.
        
        Args:
            task_name: Task identifier ('permutation_orbit' / 'task_a' / 'modular_register' / 'task_b')
            depth: Optional fixed difficulty depth D in [2, 16]. If None, sampled uniformly.
            seed: Optional integer seed for deterministic problem generation.
        """
        canonical_id = cls.resolve_task_id(task_name)
        min_d = depth if depth is not None else 2
        max_d = depth if depth is not None else 16
        
        # Instantiate dettasett generator sath 1 sample
        gen_seed = seed if seed is not None else int(np.random.randint(0, 1_000_000))
        
        if canonical_id == 'permutation_orbit':
            ds = TaskAPermutationOrbit(num_samples=1, min_depth=min_d, max_depth=max_d, seed=gen_seed)
            sample = ds[0]
        elif canonical_id == 'modular_register':
            ds = TaskBModularRegister(num_samples=1, min_depth=min_d, max_depth=max_d, seed=gen_seed)
            sample = ds[0]
        else:
            # Standalone continuous vector association problem representation
            sample = {
                'input_seq': [14, 1, 15, 1],
                'traj': [1],
                'final_ans': 1,
                'depth': 1,
                'input_len': 4,
                'full_seq': [14, 1, 15, 1, 16, 1, 17, 18, 1]
            }
        
        return TaskExample(
            task_name=canonical_id,
            depth=sample['depth'],
            input_ids=sample['input_seq'],
            input_tokens=tokens_to_str_list(sample['input_seq']),
            expected_answer=sample['final_ans'],
            expected_answer_str=token_to_str(sample['final_ans']),
            ground_truth_trajectory=sample['traj'],
            ground_truth_trajectory_str=tokens_to_str_list(sample['traj']),
            raw_metadata={
                'input_len': sample['input_len'],
                'full_len': len(sample['full_seq']),
                'generation_seed': gen_seed
            }
        )
