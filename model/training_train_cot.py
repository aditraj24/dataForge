import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import json
import argparse
from pathlib import Path

from models_cot_model import AutoregressiveCoT
from data_generator import TaskAPermutationOrbit, TaskBModularRegister, collate_fn_pad, VOCAB

def train_cot(task_name='task_a', seed=42, supervision='aligned', epochs=20, lr=0.001, batch_size=32, device='cuda'):
    torch.manual_seed(seed)
    device = torch.device(device if torch.cuda.is_available() else 'cpu')
    print(f"[CoT] Training on {task_name} | Seed: {seed} | Supervision: {supervision} | Device: {device}")
    
    # deta set chalu krte hain
    if task_name == 'task_a':
        train_data = TaskAPermutationOrbit(num_samples=4000, min_depth=2, max_depth=16, seed=seed)
    else:
        train_data = TaskBModularRegister(num_samples=4000, min_depth=2, max_depth=16, seed=seed)
        
    loader = DataLoader(train_data, batch_size=batch_size, shuffle=True, collate_fn=collate_fn_pad)
    
    model = AutoregressiveCoT().to(device)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    criterion = nn.CrossEntropyLoss(ignore_index=VOCAB['PAD'])
    
    losses = []
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        for batch in loader:
            optimizer.zero_grad()
            
            if supervision == 'aligned':
                # puraa sir-se-paer tikher forcing: har jgah agla tok bataoo
                full_ids = batch['full_ids'].to(device)
                inputs = full_ids[:, :-1]
                targets = full_ids[:, 1:]
                
                logits = model(inputs)
                loss = criterion(logits.reshape(-1, logits.shape[-1]), targets.reshape(-1))
            else:
                # dusra trka: end-to-end dekhbal (srif aakheri javab pe dndge)
                full_ids = batch['full_ids'].to(device)
                inputs = full_ids[:, :-1]
                logits = model(inputs)
                
                # aakri jagh mtlab final anwer ki bhavshyawni
                loss = criterion(logits[:, -1, :], batch['final_answers'].to(device))
                
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            epoch_loss += loss.item()
            
        avg_loss = epoch_loss / len(loader)
        losses.append(avg_loss)
        if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
            print(f"Epoch {epoch+1:02d}/{epochs} - Loss: {avg_loss:.4f}")
            
    # checkpont bacahana h
    out_dir = Path(f'export/models/cot_{task_name}_s{seed}_{supervision}')
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / 'weights.pth')
    with open(out_dir / 'training_log.json', 'w') as f:
        json.dump({'losses': losses, 'task': task_name, 'seed': seed, 'supervision': supervision}, f)
    print(f"CoT model saved to {out_dir}")
    return model

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--task', type=str, default='task_a', choices=['task_a', 'task_b'])
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--supervision', type=str, default='aligned', choices=['aligned', 'end_to_end'])
    parser.add_argument('--epochs', type=int, default=1)
    args = parser.parse_args()
    train_cot(task_name=args.task, seed=args.seed, supervision=args.supervision, epochs=args.epochs)