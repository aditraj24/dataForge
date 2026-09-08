# The Thinking Budget: Cost-Accuracy Pareto Frontiers in Reasoning

## 1. The Core Claim & Executive Summary

This project investigates a foundational question in machine learning reasoning: **When allocating additional test-time computation to solve an algorithmic multi-step problem, how should that compute be structured?**

**Central Finding**: Across heavily controlled, capacity-matched scales (126K, 1M, and 5M parameters), recurrent latent computation (iterative state updates without token generation) is competitive at very low budgets but plateaus near ~33% accuracy on permutation orbit traversal. In contrast, autoregressive scratchpad generation (Chain-of-Thought) scales monotonically with capacity and compute, reaching 99.74% accuracy at 5M parameters under optimal training conditions. 

## 2. Intended Learner & Prerequisites

**Intended Learner:**
- Machine Learning Researchers exploring test-time compute, reasoning, and test-time optimization.
- AI Engineers interested in understanding the trade-offs between continuous latent iterations and discrete symbol generation (Chain-of-Thought).
- Full-Stack Developers aiming to bridge the gap between complex ML model state representations and interactive UI dashboards.

**Prerequisites:**
- Basic understanding of neural network architectures, specifically Transformers, Cross-Attention, and Recurrent Neural Networks (GRUs).
- Familiarity with Python, PyTorch, and machine learning training loops.
- Basic understanding of web development (React, Next.js, FastAPI) to run the interactive demonstrator.

## 3. Learning Objectives

By exploring this repository and running the interactive application, you will learn to:
1. Understand the exact architectural differences between Autoregressive Chain-of-Thought and Recurrent Latent Reasoning.
2. Analyze the non-dominated Pareto frontiers comparing GPU Latency/FLOPs vs. Accuracy for both approaches.
3. Diagnose the empirical plateau of latent models through intermediate state inspection (norm contraction, attention bias).
4. Run live simulations that expose the underlying hidden states and generated reasoning traces.
5. Contrast precomputed historical benchmark evaluations against live single-example simulations.

## 4. Architecture of the Artifact

The repository is structured into three primary ecosystems:

### The Research Model (`/model`)
- Contains the frozen PyTorch definitions for the `AutoregressiveCoT`, `RecurrentLatentReasoner`, and an educational `HebbianMemory` model.
- Contains the deterministic data generators for the permutation orbit and modular arithmetic tasks.
- **`simulation_lab/`**: A unified Python backend that wraps the models, orchestrates inference, and handles analytical FLOP/latency profiling.

### The Backend API (`/backend`)
- A FastAPI server that bridges the core research model (`simulation_lab`) with the web frontend.
- Provides endpoints to list models, generate synthetic task examples, trigger single-example simulations, and retrieve precomputed Pareto frontiers.

### The Interactive Frontend (`/frontend`)
- A modern web interface built to visualize the results, run live interactive simulations, step through reasoning traces, and inspect architectural accounting.

## 5. Role of Every Major Component

- **`models_*.py`**: The raw PyTorch network definitions defining the computation graphs.
- **`data_generator.py`**: Synthesizes algorithmic problem instances (Permutation Orbit, Modular Arithmetic).
- **`simulation_lab/engine.py`**: The orchestrator. Handles loading model checkpoints, wrapping them in unified adapters, running inferences, and tracking performance metrics (Latency, FLOPs).
- **`backend/main.py`**: Exposes the `SimulationLabEngine` over REST API.
- **Frontend Components**: Renders interactive dashboards like the Pareto Chart, CoT Scratchpad Visualizer, Latent State Inspector, and the BDH Synaptic Workbench.

## 6. What is Live, Precomputed, Synthetic, or Animated?

- **Live Simulation**: Single-example inference is completely live. When you query the backend or frontend to run a model (e.g. 5M Recovery) on an example, it actually loads the PyTorch weights and executes the forward pass in real time, recording latency and traces.
- **Precomputed Data**: The Pareto Frontiers and aggregated statistical comparisons are precomputed. The benchmarks ran across 1,000 instances $\times$ 5 seeds $\times$ 6 budgets. The UI charts display this static, authoritative ground truth to avoid conflating a single run's variance with the overall trend.
- **Synthetic**: The problem datasets (Task A: Permutation Orbit, Task B: Modular Arithmetic) are strictly synthetically generated.
- **Animated/Interactive**: The frontend reasoning trace viewer (stepping through tokens or continuous state updates) and the BDH synaptic matrix inspector are dynamically rendered and animated based on the live inference trace returned by the backend.

## 7. How to Reproduce the Results

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository_url>
   cd iitkgp
   ```

2. **Setup the Research Model / Simulation Lab Backend**
   ```bash
   cd backend
   python -m venv .venv
   # On Windows: .\.venv\Scripts\activate
   # On Mac/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Start the Backend Server**
   ```bash
   # Ensure you are in the backend directory and your venv is activated
   uvicorn main:app --reload
   ```
   The backend will run on `http://127.0.0.1:8000`.

4. **Setup and Start the Frontend**
   ```bash
   # Open a new terminal
   cd frontend
   npm install
   npm run dev
   ```
   The interactive dashboard will be available at `http://localhost:3000`.

### Re-running Benchmarks
To recreate the precomputed statistics from scratch (Warning: requires GPU and significant time):
- Navigate to the `model/` directory.
- Run `python run_full_training_5m_recovery.py` to train the models.
- Run `python run_benchmark_eval.py` to evaluate the suite.
- Run `python process_benchmark_results.py` to generate the Pareto JSONs.

## 8. Credits and Licenses

- **Author**: The Thinking Budget Research Team.
- **License**: MIT License. See `LICENSE` file for details.
- **Acknowledgments**: Built using PyTorch, FastAPI, React, Next.js, and Lucide Icons.
