import torch
import torch.nn as nn

class HebbianMemory(nn.Module):
    # BDH rule: jo saath aate hain, unka rishta mazboot karo (outer product)
    def __init__(self, n_neurons=128, state_dim=64, lr=0.01):
        super().__init__()
        self.n = n_neurons
        self.d = state_dim
        self.lr = lr

        # sigma: fast-weight synaptic matrix — gradient se nahi, Hebbian se seekhta hai
        self.sigma = nn.Parameter(
            torch.zeros(n_neurons, state_dim),
            requires_grad=False
        )

        # encoder/decoder: input ko neuron space mein le jao
        self.encoder = nn.Linear(state_dim, n_neurons)
        self.decoder = nn.Linear(state_dim, state_dim)

        # sirf top 10% neurons active rakho (sparse, BDH style)
        self.activation_threshold = 0.1

    def hebbian_update(self, x, y):
        # x aur y saath aaye → sigma ko thoda aur strong karo
        outer = torch.bmm(x.unsqueeze(2), y.unsqueeze(1))
        self.sigma.data += self.lr * outer.mean(dim=0)
        # thodi si forgetting bhi chahiye (0.99 decay)
        self.sigma.data *= 0.99

    def forward(self, query, store_pairs=None):
        # query: [batch, d] — kya yaad karna hai
        batch_size = query.shape[0]

        # pehle kuch store karna ho toh Hebbian update karo
        if store_pairs is not None:
            key, value = store_pairs
            encoded_key = torch.relu(self.encoder(key))
            self.hebbian_update(encoded_key, value)

        # query encode karo
        encoded_query = torch.relu(self.encoder(query))

        # sparse karo — threshold se neeche wale zero karo
        mask = (encoded_query > self.activation_threshold).float()
        sparse_query = encoded_query * mask

        # sigma se memory retrieve karo
        retrieved = sparse_query @ self.sigma  # [batch, d]
        output = self.decoder(retrieved)

        return {
            'output': output,
            'sigma': self.sigma.clone(),      # frontend pe dikhane ke liye
            'sparsity': (sparse_query > 0).float().mean()  # kitne neurons active hain
        }

    def reset_memory(self):
        # naya episode — sigma zero karo
        self.sigma.data.zero_()