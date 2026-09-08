import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import json
import argparse
from pathlib import Path

from models_latent_model import RecurrentLatentReasoner
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad, VOCAB

def train_latent(task_name='task_a', seed=42, supervision='aligned', epochs=20, lr=0.001, batch_size=32, device='cuda'):
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[Latent] Training on {task_name} | Seed: {seed} | Supervision: {supervision} | Device: {device}")
    
    # detasit suru krna D kay beeec
    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=4000, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=4000, min_depth=2, max_depth=16, seed=seed)
        
    loader = DataLoader(train_data, batch_size=batch_size, shuffle=True, collate_fn=collate_fn_pad)
    
    model = RecurrentLatentReasoner().to(device)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    criterion = nn.CrossEntropyLoss()
    
    losses = []
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        for batch in loader:
            optimizer.zero_grad()
            
            input_ids = batch['input_ids'].to(device)
            input_mask = batch['input_mask'].to(device)
            final_answers = batch['final_answers'].to(device)
            depths = batch['depths'].to(device)
            traj = batch['traj'].to(device)          # [batch, max_D_in_batch]
            traj_mask = batch['traj_mask'].to(device) # [batch, max_D_in_batch]
            
            max_batch_depth = int(depths.max().item())
            
            # gumao otni bar jetni bar mxx dpth ay bacch may
            res = model(input_ids, reasoning_steps=max_batch_depth, input_mask=input_mask)
            step_logits = res['step_logits'] # [batch, max_batch_depth, vocab_size]
            
            if supervision == 'aligned':
                # sth me dkkbal: bch wale steps pay los
                loss = torch.tensor(0.0, device=device, requires_grad=True)
                valid_steps = 0
                for s in range(max_batch_depth):
                    # maskn onkay liyy jenki hrai s sy jyaada ho
                    mask_s = traj_mask[:, s]
                    if mask_s.any():
                        logits_s = step_logits[mask_s, s, :]
                        targets_s = traj[mask_s, s]
                        loss = loss + criterion(logits_s, targets_s)
                        valid_steps += 1
                if valid_steps > 0:
                    loss = loss / valid_steps
            else:
                # dosraa trika: end too eind deko (aakrii step pay loossss)
                # khatti kkro logts theek Dii py subke leya
                B = input_ids.shape[0]
                idx = depths - 1 # 0-indexed step corresponding to depth D
                term_logits = step_logits[torch.arange(B, device=device), idx, :]
                loss = criterion(term_logits, final_answers)
                
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            epoch_loss += loss.item()
            
        avg_loss = epoch_loss / len(loader)
        losses.append(avg_loss)
        if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
            print(f"Epoch {epoch+1:02d}/{epochs} - Loss: {avg_loss:.4f}")
            
    out_dir = Path(f'export/models/latent_{task_name}_s{seed}_{supervision}')
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({'losses': losses, 'task': task_name, 'seed': seed, 'supervision': supervision}, f)
    print(f"Latent model saved to {out_dir}")
    return model

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--task', type=str, default='task_a', choices=['task_a', 'task_b'])
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--supervision', type=str, default='aligned', choices=['aligned', 'end_to_end'])
    parser.add_argument('--epochs', type=int, default=1)
    args = parser.parse_args()
    train_latent(task_name=args.task, seed=args.seed, supervision=args.supervision, epochs=args.epochs)
