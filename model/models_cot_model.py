import torch
import torch.nn as nn
from data_generator import VOCAB, VOCAB_SIZE

class AutoregressiveCoT(nn.Module):
    # CoT model — sochne k liye tokens nikalti hai baari baari
    def __init__(self, vocab_size=VOCAB_SIZE, d_model=80, nhead=4, num_layers=2, dim_feedforward=192, max_len=96):
        super().__init__()
        self.d_model = d_model
        self.max_len = max_len
        # har token ko vector mein convert karo
        self.embedding = nn.Embedding(vocab_size, d_model)
        # position yaad rakhne ke liye learnable params
        self.pos_embedding = nn.Parameter(torch.zeros(max_len, d_model))
        nn.init.normal_(self.pos_embedding, std=0.02)

        layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            batch_first=True,
            norm_first=False
        )
        self.transformer = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.ln_f = nn.LayerNorm(d_model)
        # vocab pe project karo — kaunsa token aayega
        self.head = nn.Linear(d_model, vocab_size)

    def forward(self, seq_ids, mask=None):
        # seq_ids: [B, L] — batch of token sequences
        B, L = seq_ids.shape
        pos = self.pos_embedding[:L].unsqueeze(0)
        x = self.embedding(seq_ids) + pos

        # causal mask — aage mat dekho (cheating nahi)
        causal_mask = nn.Transformer.generate_square_subsequent_mask(L, device=seq_ids.device)
        out = self.transformer(x, mask=causal_mask, is_causal=True)
        out = self.ln_f(out)
        logits = self.head(out)
        return logits

    @torch.no_grad()
    def generate(self, input_ids, max_budget_k=16):
        # THINK token se shuru, max_budget_k steps tak sochna
        B = input_ids.shape[0]
        device = input_ids.device

        think_tok = torch.tensor([[VOCAB['THINK']]], device=device).expand(B, 1)
        curr_seq = torch.cat([input_ids, think_tok], dim=1)

        tokens_generated = 0
        active = torch.ones(B, dtype=torch.bool, device=device)

        for step in range(max_budget_k):
            if not active.any():
                break
            logits = self.forward(curr_seq)[:, -1, :]
            next_tok = logits.argmax(dim=-1, keepdim=True)

            # END_THINK aaya toh band karo us sample ke liye
            is_end = (next_tok.squeeze(1) == VOCAB['END_THINK'])
            active = active & (~is_end)

            curr_seq = torch.cat([curr_seq, next_tok], dim=1)
            tokens_generated += 1

        # ANS token lagao aur final prediction lo
        ans_tok = torch.tensor([[VOCAB['ANS']]], device=device).expand(B, 1)
        curr_seq = torch.cat([curr_seq, ans_tok], dim=1)
        logits = self.forward(curr_seq)[:, -1, :]
        final_ans = logits.argmax(dim=-1)

        return {
            'final_ans': final_ans,
            'tokens_generated': tokens_generated,
            'full_seq': curr_seq
        }