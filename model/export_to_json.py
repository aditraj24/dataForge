import torch
import json
import numpy as np

def export_hebbian_to_web():
    """
Convert PyTorch weights ko JSON kay lyye browser
"""
    checkpoint = torch.load('export/models/hebbian_weights.pth', map_location='cpu')
    
    # Extract matrices
    export_dict = {
        'encoder': checkpoint['encoder.weight'].cpu().numpy().tolist(),
        'decoder': checkpoint['decoder.weight'].cpu().numpy().tolist(),
        'sigma': checkpoint['sigma'].cpu().numpy().tolist(),
        'config': {
            'n_neurons': 128,
            'state_dim': 64
        }
    }
    
    # Compress kay lyye web (round ko 3 decimals)
    def round_nested(obj):
        if isinstance(obj, list):
            return [round_nested(item) for item in obj]
        return round(obj, 3)
    
    export_dict = {k: round_nested(v) if isinstance(v, list) else v 
                   for k, v in export_dict.items()}
    
    import os
    os.makedirs('web/public/models', exist_ok=True)
    
    with open('web/public/models/hebbian_web.json', 'w') as f:
        json.dump(export_dict, f)
    
    print("Exported to web/public/models/hebbian_web.json")
    print(f"Size: {len(json.dumps(export_dict)) / 1024:.1f} KB")

if __name__ == '__main__':
    export_hebbian_to_web()