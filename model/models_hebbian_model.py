import torch
import torch.nn as nn

class HebbianMemory(nn.Module):
    """
    BDH rull implement kiya h yaha pe.
    sigma purana + nya (outer porduct).
    """
    def __init__(self, n_neurons=128, state_dim=64, lr=0.01):
        super().__init__()
        self.n = n_neurons
        self.d = state_dim
        self.lr = lr
        
        # ye state matrix hai jo hum dkhte h
        # tez weight wali yaddasht
        self.sigma = nn.Parameter(
            torch.zeros(n_neurons, state_dim), 
            requires_grad=False  # hebbian h, gradint ny
        )
        
        # encodr/decodr matrix
        self.encoder = nn.Linear(state_dim, n_neurons)
        self.decoder = nn.Linear(state_dim, state_dim)
        
        # km acivation dko (BDH m 5% tha)
        self.activation_threshold = 0.1
        
    def hebbian_update(self, x, y):
        """
        jab x or y sth aye, 
        rishta (sigma) majbut kro.
        """
        # outr pruduct nikalo
        outer = torch.bmm(x.unsqueeze(2), y.unsqueeze(1))
        
        # sigma updt kro lr k sat
        self.sigma.data += self.lr * outer.mean(dim=0)
        
        # thoda htao (decay)
        self.sigma.data *= 0.99
        
    def forward(self, query, store_pairs=None):
        """
        query: [batch, d] - jo yad krna h
        store: agar phle kuj rhna ho
        """
        batch_size = query.shape[0]
        
        # nya chejz ydd rakne k ly
        if store_pairs is not None:
            key, value = store_pairs
            encoded_key = torch.relu(self.encoder(key))
            self.hebbian_update(encoded_key, value)
        
        # pdho ab
        encoded_query = torch.relu(self.encoder(query))
        
        # spars kro (bht kam values chaeay)
        mask = (encoded_query > self.activation_threshold).float()
        sparse_query = encoded_query * mask
        
        # dmag se nkkalo
        retrieved = sparse_query @ self.sigma  # [batch, d]
        
        # decod maro
        output = self.decoder(retrieved)
        
        return {
            'output': output,
            'sigma': self.sigma.clone(),  # dkhne kk liye
            'sparsity': (sparse_query > 0).float().mean()  # actvity lavel
        }
    
    def reset_memory(self):
        """dmag saf kardo (nya episd)"""
        self.sigma.data.zero_()