import torch
import torch.nn as nn
from data_generator import VOCAB, VOCAB_SIZE

class RecurrentLatentReasoner(nn.Module):
    # Latent model — token nahi nikalta, andar hi andar sochta rehta hai
    def __init__(self, vocab_size=VOCAB_SIZE, d_model=80, nhead=4, dim_feedforward=304, max_len=96):
        super().__init__()
        self.d_model = d_model
        self.max_len = max_len
        self.embedding = nn.Embedding(vocab_size, d_model)
        # position info ke liye learnable
        self.pos_embedding = nn.Parameter(torch.zeros(max_len, d_model))
        nn.init.normal_(self.pos_embedding, std=0.02)

        # cross-attn: latent state input memory se poochhta hai
        self.cross_attn = nn.MultiheadAttention(d_model, nhead, batch_first=True)
        # GRU: state update karta hai
        self.gru = nn.GRUCell(d_model, d_model)
        self.ln_h = nn.LayerNorm(d_model)

        # FFN: thoda aur process
        self.ffn = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.ReLU(),
            nn.Linear(dim_feedforward, d_model)
        )
        self.ln_ffn = nn.LayerNorm(d_model)
        # readout: final prediction ke liye
        self.head = nn.Linear(d_model, vocab_size)

    def encode_memory(self, input_ids):
        # input tokens ko static Key/Value memory mein convert karo
        B, L = input_ids.shape
        pos = self.pos_embedding[:L].unsqueeze(0)
        memory = self.embedding(input_ids) + pos
        return memory

    def step(self, h, memory, key_padding_mask=None):
        # ek recurrent step: memory dekhо → GRU update → FFN
        q = h.unsqueeze(1)
        attn_out, _ = self.cross_attn(q, memory, memory, key_padding_mask=key_padding_mask)
        attn_out = attn_out.squeeze(1)

        # GRU se naya hidden state banao
        h_next = self.gru(attn_out, h)
        h_next = self.ln_h(h_next)

        # residual FFN lagao
        ff_out = self.ffn(h_next)
        h_next = self.ln_ffn(h_next + ff_out)
        return h_next

    def forward(self, input_ids, reasoning_steps=8, input_mask=None):
        # reasoning_steps baar ghoomta hai, har step ka logit bhi deta hai
        B, L = input_ids.shape
        device = input_ids.device

        # PAD tokens ko ignore karne ke liye mask ulta karo
        pad_mask = (~input_mask) if input_mask is not None else None

        memory = self.encode_memory(input_ids)

        # last token se z_0 shuru karo
        h = memory[:, -1, :].clone()

        step_logits = []
        for s in range(reasoning_steps):
            h = self.step(h, memory, key_padding_mask=pad_mask)
            step_logits.append(self.head(h))

        final_logits = step_logits[-1]

        return {
            'final_logits': final_logits,
            'step_logits': torch.stack(step_logits, dim=1),  # [batch, step, vocab]
            'final_state': h
        }

    @torch.no_grad()
    def infer(self, input_ids, budget_k=8, input_mask=None):
        # test time: exactly budget_k steps chalao, bas
        res = self.forward(input_ids, reasoning_steps=budget_k, input_mask=input_mask)
        final_ans = res['final_logits'].argmax(dim=-1)
        return {
            'final_ans': final_ans,
            'steps_executed': budget_k
        }