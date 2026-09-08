import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import yaml
import json
from pathlib import Path

from models_hebbian_model import HebbianMemory
from data_generator import AssociativeTask

def train():
    # cnfig laa do
    with open('configs_hebbian_config.yaml') as f:
        config = yaml.safe_load(f)
    
    # tyari kr lo
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Training on {device}")
    
    model = HebbianMemory(
        n_neurons=config['model']['n_neurons'],
        state_dim=config['model']['state_dim'],
        lr=config['model']['learning_rate']
    ).to(device)
    
    # sif en-codr / decodr koo gradint caeay (sigm hebian hn)
    optimizer = optim.Adam([
        {'params': model.encoder.parameters()},
        {'params': model.decoder.parameters()}
    ], lr=0.001)
    
    dataset = AssociativeTask(num_pairs=8, embed_dim=config['model']['state_dim'])
    loader = DataLoader(dataset, batch_size=config['training']['batch_size'], shuffle=True)
    
    losses = []
    result = None
    
    for epoch in range(config['training']['epochs']):
        epoch_loss = 0
        for batch in loader:
            query = batch['query'].to(device)
            target = batch['target'].to(device)
            
            # her bar yad-shat saf kro (nayi batt k liiy)
            model.reset_memory()
            
            # phylay jode save kroo (liknay ka phase)
            # aalsi trenin mai bht sarre dkha k fir 1 phuchte haain
            with torch.no_grad():
                # natak kroo 8 jodiyoo ko juldi sav krr ne k
                for i in range(8):
                    fake_key = torch.randn_like(query)
                    fake_value = torch.randn_like(target)
                    model(query, store_pairs=(fake_key, fake_value))
            
            # ab saawaal
            result = model(query)
            output = result['output']
            
            # losts: nikale walee aor trget me kitti dori h
            loss = nn.MSELoss()(output, target)
            
            # ultti balti sif eenc/dec ki ly
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
        
        avg_loss = epoch_loss / len(loader) if len(loader) > 0 else 0
        losses.append(avg_loss)
        if result is not None:
            print(f"Epoch {epoch}, Loss: {avg_loss:.4f}, Sparsity: {result['sparsity']:.2%}")
        else:
            print(f"Epoch {epoch}, Loss: {avg_loss:.4f}")
    
    # webbk liye save kaaro
    Path('export/models').mkdir(parents=True, exist_ok=True)
    
    # bhhar bacha lo
    torch.save(model.state_dict(), 'export/models/hebbian_weights.pth')
    
    # nukssaan ka crv ssave rklo
    with open('export/models/hebbian_training.json', 'w') as f:
        json.dump({'losses': losses}, f)
    
    # smple stte mtrx bakhlo dkhane kay ly
    if result is not None:
        sample_sigma = result['sigma'].cpu().numpy().tolist()
        with open('export/models/hebbian_sigma.json', 'w') as f:
            json.dump({'sigma': sample_sigma}, f)
    
    print("Training complete. Weights exported to export/models/")

if __name__ == '__main__':
    train()