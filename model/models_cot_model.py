import torch
import torch.nn as nn
from data_generator import VOCAB, VOCAB_SIZE

class AutoregressiveCoT(nn.Module):
    """
    Auto Causal T-former.
    Bich me toks deta h fir final anser.
    """
    def __init__(self, vocab_size=VOCAB_SIZE, d_model=80, nhead=4, num_layers=2, dim_feedforward=192, max_len=96):
        super().__init__()
        self.d_model = d_model
        self.max_len = max_len
        self.embedding = nn.Embedding(vocab_size, d_model)
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
        self.head = nn.Linear(d_model, vocab_size)

    def forward(self, seq_ids, mask=None):
        """
        seq_ids: [B, L]
        mask: dhyan mask
        """
        B, L = seq_ids.shape
        pos = self.pos_embedding[:L].unsqueeze(0)
        x = self.embedding(seq_ids) + pos
        
        # mask bnao taaki aage ka na dekhee (cheetng nahi)
        causal_mask = nn.Transformer.generate_square_subsequent_mask(L, device=seq_ids.device)
        
        out = self.transformer(x, mask=causal_mask, is_causal=True)
        out = self.ln_f(out)
        logits = self.head(out)
        return logits

    @torch.no_grad()
    def generate(self, input_ids, max_budget_k=16):
        """
        tokns genert krta h max budget tak.
        ruk jayega jab end think aye ya budget khtm.
        """
        B = input_ids.shape[0]
        device = input_ids.device
        
        # suru kro prompt or think tok k sath
        think_tok = torch.tensor([[VOCAB['THINK']]], device=device).expand(B, 1)
        curr_seq = torch.cat([input_ids, think_tok], dim=1)
        
        tokens_generated = 0
        active = torch.ones(B, dtype=torch.bool, device=device)
        
        for step in range(max_budget_k):
            if not active.any():
                break
            logits = self.forward(curr_seq)[:, -1, :]
            next_tok = logits.argmax(dim=-1, keepdim=True)
            
            # check kro ki end_think aaya kya
            is_end = (next_tok.squeeze(1) == VOCAB['END_THINK'])
            active = active & (~is_end)
            
            curr_seq = torch.cat([curr_seq, next_tok], dim=1)
            tokens_generated += 1
            
        # last ans nikal do
        ans_tok = torch.tensor([[VOCAB['ANS']]], device=device).expand(B, 1)
        curr_seq = torch.cat([curr_seq, ans_tok], dim=1)
        
        logits = self.forward(curr_seq)[:, -1, :]
        final_ans = logits.argmax(dim=-1)
        
        return {
            'final_ans': final_ans,
            'tokens_generated': tokens_generated,
            'full_seq': curr_seq
        }