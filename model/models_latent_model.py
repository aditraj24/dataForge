import torch
import torch.nn as nn
from data_generator import VOCAB, VOCAB_SIZE

class RecurrentLatentReasoner(nn.Module):
    """
    Recurnnt letnt sochne wala network.
    bina token nikale k br ghumta hh.
    """
    def __init__(self, vocab_size=VOCAB_SIZE, d_model=80, nhead=4, dim_feedforward=304, max_len=96):
        super().__init__()
        self.d_model = d_model
        self.max_len = max_len
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_embedding = nn.Parameter(torch.zeros(max_len, d_model))
        nn.init.normal_(self.pos_embedding, std=0.02)
        
        # mmry ka quary or updte
        self.cross_attn = nn.MultiheadAttention(d_model, nhead, batch_first=True)
        self.gru = nn.GRUCell(d_model, d_model)
        self.ln_h = nn.LayerNorm(d_model)
        
        self.ffn = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.ReLU(),
            nn.Linear(dim_feedforward, d_model)
        )
        self.ln_ffn = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size)

    def encode_memory(self, input_ids):
        """inpt ko meemory my dal do"""
        B, L = input_ids.shape
        pos = self.pos_embedding[:L].unsqueeze(0)
        memory = self.embedding(input_ids) + pos
        return memory

    def step(self, h, memory, key_padding_mask=None):
        """
        ek bar sochta hy:
        mmry my dkho or updte maro GRU se.
        """
        # cross-attn lagaya idr
        q = h.unsqueeze(1)
        attn_out, _ = self.cross_attn(q, memory, memory, key_padding_mask=key_padding_mask)
        attn_out = attn_out.squeeze(1)
        
        # gru se naya bnaoo
        h_next = self.gru(attn_out, h)
        h_next = self.ln_h(h_next)
        
        # aagay bdhao
        ff_out = self.ffn(h_next)
        h_next = self.ln_ffn(h_next + ff_out)
        return h_next

    def forward(self, input_ids, reasoning_steps=8, input_mask=None):
        """
        k baari gumta hy.
        bech k or lst k nateejey deta hn.
        """
        B, L = input_ids.shape
        device = input_ids.device
        
        # mask hy takii ignre kre
        pad_mask = (~input_mask) if input_mask is not None else None
        
        memory = self.encode_memory(input_ids)
        
        # h ko last walay tokn se shuru krte hy
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
        """
        test k tiem: exact budget_k barr chlayga.
        """
        res = self.forward(input_ids, reasoning_steps=budget_k, input_mask=input_mask)
        final_ans = res['final_logits'].argmax(dim=-1)
        return {
            'final_ans': final_ans,
            'steps_executed': budget_k
        }