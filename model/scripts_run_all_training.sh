#!/bin/bash
# Run this on your 4060 system

echo "Starting BDH Hackathon Training Pipeline..."

# Activate environment (if using venv)
# source venv/bin/activate

# Train Hebbian model (fastest)
echo "Training Hebbian Memory Model..."
python training_train_hebbian.py

# Train Latent Reasoner
echo "Training Latent Reasoning Model..."
python training_train_latent.py

# Train CoT Baseline
echo "Training CoT Baseline..."
python training_train_cot.py

# Generate comparison data
echo "Generating Pareto Frontier..."
python training_compare_costs.py

# Export for web
echo "Exporting to web format..."
python export_to_json.py

echo "All training complete! Web assets ready in web/public/models/"