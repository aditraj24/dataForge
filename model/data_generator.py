import numpy as np
import torch
from torch.utils.data import Dataset

# Digits: 0-9, Operators: ADD=10, MUL=11, SUB=12
# Special: MAP=13, START=14, HOPS=15, THINK=16, END_THINK=17, ANS=18, PAD=19, EOS=20
VOCAB = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'OP_ADD': 10, 'OP_MUL': 11, 'OP_SUB': 12,
    'MAP': 13, 'START': 14, 'HOPS': 15,
    'THINK': 16, 'END_THINK': 17, 'ANS': 18,
    'PAD': 19, 'EOS': 20
}
VOCAB_SIZE = 24

class TaskAPermutationOrbit(Dataset):
    # Task A: permutation orbit — pi ko D baar apply karo, answer nikalo
    # Input:  [MAP, pi_0..pi_7, START, v0, HOPS, D]
    # Target: [THINK, v1, v2, ..., v_D, END_THINK, ANS, v_D]
    def __init__(self, num_samples=1000, min_depth=2, max_depth=16, seed=42):
        self.num_samples = num_samples
        self.min_depth = min_depth
        self.max_depth = max_depth
        self.seed = seed
        self.data = self._generate_data()

    def _generate_data(self):
        rng = np.random.default_rng(self.seed)
        samples = []

        for _ in range(self.num_samples):
            # random permutation S8 se lo
            pi = rng.permutation(8).tolist()
            # starting node
            v0 = int(rng.integers(0, 8))
            # kitne hops (difficulty D)
            D = int(rng.integers(self.min_depth, self.max_depth + 1))

            # D baar pi apply karo, trajectory banao
            traj = []
            curr = v0
            for _ in range(D):
                curr = pi[curr]
                traj.append(curr)
            final_ans = curr

            # input sequence: map table + starting info
            input_seq = [VOCAB['MAP']] + pi + [VOCAB['START'], v0, VOCAB['HOPS'], D]

            # scratchpad: intermediate steps ka raasta
            scratchpad = [VOCAB['THINK']] + traj + [VOCAB['END_THINK'], VOCAB['ANS'], final_ans]

            # full sequence = input + scratchpad
            full_seq = input_seq + scratchpad

            samples.append({
                'input_seq': input_seq,
                'scratchpad': scratchpad,
                'full_seq': full_seq,
                'input_len': len(input_seq),
                'traj': traj,
                'final_ans': final_ans,
                'depth': D
            })
        return samples

    def __len__(self):
        return self.num_samples

    def __getitem__(self, index):
        return self.data[index]


class TaskBModularRegister(Dataset):
    # Task B: modular register arithmetic — r0 pe D operations karo mod 10
    # Input:  [START, r0, OP_1, c1, ..., OP_D, cD]
    # Target: [THINK, r1, ..., r_D, END_THINK, ANS, r_D]
    def __init__(self, num_samples=1000, min_depth=2, max_depth=16, seed=42):
        self.num_samples = num_samples
        self.min_depth = min_depth
        self.max_depth = max_depth
        self.seed = seed
        self.data = self._generate_data()

    def _generate_data(self):
        rng = np.random.default_rng(self.seed)
        samples = []
        op_types = [VOCAB['OP_ADD'], VOCAB['OP_MUL'], VOCAB['OP_SUB']]

        for _ in range(self.num_samples):
            r0 = int(rng.integers(0, 10))
            D = int(rng.integers(self.min_depth, self.max_depth + 1))

            input_seq = [VOCAB['START'], r0]
            traj = []
            curr = r0

            for _ in range(D):
                op = int(rng.choice(op_types))
                val = int(rng.integers(1, 10))
                input_seq.extend([op, val])

                # operation apply karo mod 10
                if op == VOCAB['OP_ADD']:
                    curr = (curr + val) % 10
                elif op == VOCAB['OP_MUL']:
                    curr = (curr * val) % 10
                elif op == VOCAB['OP_SUB']:
                    curr = (curr - val + 10) % 10
                traj.append(curr)

            final_ans = curr
            scratchpad = [VOCAB['THINK']] + traj + [VOCAB['END_THINK'], VOCAB['ANS'], final_ans]
            full_seq = input_seq + scratchpad

            samples.append({
                'input_seq': input_seq,
                'scratchpad': scratchpad,
                'full_seq': full_seq,
                'input_len': len(input_seq),
                'traj': traj,
                'final_ans': final_ans,
                'depth': D
            })
        return samples

    def __len__(self):
        return self.num_samples

    def __getitem__(self, index):
        return self.data[index]


def collate_fn_pad(batch):
    # batch ke andar sab sequences ko ek size par laao (PAD se bharke)
    max_input_len = max(len(b['input_seq']) for b in batch)
    max_full_len = max(len(b['full_seq']) for b in batch)
    max_traj_len = max(len(b['traj']) for b in batch)

    input_ids = []
    input_mask = []
    full_ids = []
    full_mask = []
    traj_padded = []
    traj_mask = []
    final_answers = []
    depths = []
    input_lens = []

    for b in batch:
        # input sequence pad karo
        pad_len_in = max_input_len - len(b['input_seq'])
        input_ids.append(b['input_seq'] + [VOCAB['PAD']] * pad_len_in)
        input_mask.append([1] * len(b['input_seq']) + [0] * pad_len_in)

        # full sequence pad karo
        pad_len_full = max_full_len - len(b['full_seq'])
        full_ids.append(b['full_seq'] + [VOCAB['PAD']] * pad_len_full)
        full_mask.append([1] * len(b['full_seq']) + [0] * pad_len_full)

        # trajectory pad karo (intermediate steps)
        pad_len_tr = max_traj_len - len(b['traj'])
        traj_padded.append(b['traj'] + [0] * pad_len_tr)
        traj_mask.append([1] * len(b['traj']) + [0] * pad_len_tr)

        final_answers.append(b['final_ans'])
        depths.append(b['depth'])
        input_lens.append(b['input_len'])

    return {
        'input_ids': torch.LongTensor(input_ids),
        'input_mask': torch.BoolTensor(input_mask),
        'full_ids': torch.LongTensor(full_ids),
        'full_mask': torch.BoolTensor(full_mask),
        'traj': torch.LongTensor(traj_padded),
        'traj_mask': torch.BoolTensor(traj_mask),
        'final_answers': torch.LongTensor(final_answers),
        'depths': torch.LongTensor(depths),
        'input_lens': torch.LongTensor(input_lens)
    }


class AssociativeTask(Dataset):
    # Task C: Associative Memory (Hebbian model ke liye toy dataset)
    def __init__(self, num_pairs=8, embed_dim=64, num_samples=1000):
        self.num_samples = num_samples
        self.embed_dim = embed_dim

    def __len__(self):
        return self.num_samples

    def __getitem__(self, index):
        return {
            'query': torch.randn(self.embed_dim),
            'target': torch.randn(self.embed_dim)
        }