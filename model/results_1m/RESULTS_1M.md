# Results — 1M Capacity-Scaling Experiment

## Architecture
| Model | d_model | num_layers | dim_feedforward | Parameters |
|-------|---------|------------|-----------------|------------|
| AutoregressiveCoT (1M) | 224 | 2 | 624 | 998,520 |
| RecurrentLatentReasoner (1M) | 224 | — | 1,027 | 998,523 |
| Parameter difference | | | | 3 (0.0003%) |

## Task A: Permutation Orbit Traversal

| k | CoT Mean Acc | CoT SEM | Latent Mean Acc | Latent SEM | CoT Latency (ms) | Latent Latency (ms) | p-value (paired t) |
|---|---|---|---|---|---|---|---|
| 1 | 0.1792 | ±0.0269 | 0.1438 | ±0.0035 | 0.139 | 0.086 | 0.2090 |
| 2 | 0.2532 | ±0.0400 | 0.3088 | ±0.0093 | 0.191 | 0.103 | 0.2933 |
| 4 | 0.3906 | ±0.0485 | 0.3108 | ±0.0102 | 0.281 | 0.156 | 0.2235 |
| 8 | 0.5214 | ±0.0772 | 0.3112 | ±0.0101 | 0.510 | 0.241 | 0.0628 |
| 12 | 0.6436 | ±0.1042 | 0.3112 | ±0.0101 | 0.751 | 0.321 | 0.0379 |
| 16 | 0.7670 | ±0.1322 | 0.3112 | ±0.0101 | 1.012 | 0.406 | 0.0295 |

## Task B: Modular Register Arithmetic

| k | CoT Mean Acc | CoT SEM | Latent Mean Acc | Latent SEM | CoT Latency (ms) | Latent Latency (ms) | p-value (paired t) |
|---|---|---|---|---|---|---|---|
| 1 | 0.1112 | ±0.0043 | 0.1146 | ±0.0057 | 0.209 | 0.084 | 0.6614 |
| 2 | 0.1100 | ±0.0047 | 0.1386 | ±0.0096 | 0.283 | 0.104 | 0.0732 |
| 4 | 0.1118 | ±0.0068 | 0.1434 | ±0.0089 | 0.432 | 0.149 | 0.0598 |
| 8 | 0.1218 | ±0.0051 | 0.1438 | ±0.0088 | 0.748 | 0.235 | 0.1016 |
| 12 | 0.1186 | ±0.0176 | 0.1436 | ±0.0088 | 1.086 | 0.317 | 0.3322 |
| 16 | 0.1356 | ±0.0077 | 0.1438 | ±0.0088 | 1.438 | 0.400 | 0.4112 |

## Per-Seed Accuracy Detail

### Task A

| Model | k | s42 | s43 | s44 | s45 | s46 |
|---|---|---|---|---|---|---|
| AutoregressiveCoT | 1 | 0.1190 | 0.1740 | 0.2510 | 0.2290 | 0.1230 |
| AutoregressiveCoT | 2 | 0.1180 | 0.3310 | 0.2350 | 0.3380 | 0.2440 |
| AutoregressiveCoT | 4 | 0.1980 | 0.4580 | 0.4430 | 0.4260 | 0.4280 |
| AutoregressiveCoT | 8 | 0.2250 | 0.6460 | 0.5160 | 0.6190 | 0.6010 |
| AutoregressiveCoT | 12 | 0.2370 | 0.7900 | 0.6630 | 0.7420 | 0.7860 |
| AutoregressiveCoT | 16 | 0.2410 | 0.8930 | 0.8500 | 0.9220 | 0.9290 |
| RecurrentLatentReasoner | 1 | 0.1350 | 0.1480 | 0.1520 | 0.1480 | 0.1360 |
| RecurrentLatentReasoner | 2 | 0.3340 | 0.2960 | 0.2830 | 0.3060 | 0.3250 |
| RecurrentLatentReasoner | 4 | 0.3340 | 0.2960 | 0.2830 | 0.3070 | 0.3340 |
| RecurrentLatentReasoner | 8 | 0.3340 | 0.2970 | 0.2830 | 0.3080 | 0.3340 |
| RecurrentLatentReasoner | 12 | 0.3340 | 0.2970 | 0.2830 | 0.3080 | 0.3340 |
| RecurrentLatentReasoner | 16 | 0.3340 | 0.2970 | 0.2830 | 0.3080 | 0.3340 |

### Task B

| Model | k | s42 | s43 | s44 | s45 | s46 |
|---|---|---|---|---|---|---|
| AutoregressiveCoT | 1 | 0.1190 | 0.0980 | 0.1190 | 0.1160 | 0.1040 |
| AutoregressiveCoT | 2 | 0.1140 | 0.0940 | 0.1170 | 0.1050 | 0.1200 |
| AutoregressiveCoT | 4 | 0.1020 | 0.1000 | 0.1200 | 0.1020 | 0.1350 |
| AutoregressiveCoT | 8 | 0.1040 | 0.1230 | 0.1310 | 0.1320 | 0.1190 |
| AutoregressiveCoT | 12 | 0.1120 | 0.1520 | 0.1470 | 0.0540 | 0.1280 |
| AutoregressiveCoT | 16 | 0.1110 | 0.1590 | 0.1340 | 0.1410 | 0.1330 |
| RecurrentLatentReasoner | 1 | 0.1120 | 0.1000 | 0.1100 | 0.1160 | 0.1350 |
| RecurrentLatentReasoner | 2 | 0.1310 | 0.1420 | 0.1060 | 0.1600 | 0.1540 |
| RecurrentLatentReasoner | 4 | 0.1350 | 0.1570 | 0.1120 | 0.1580 | 0.1550 |
| RecurrentLatentReasoner | 8 | 0.1370 | 0.1570 | 0.1120 | 0.1580 | 0.1550 |
| RecurrentLatentReasoner | 12 | 0.1370 | 0.1560 | 0.1120 | 0.1580 | 0.1550 |
| RecurrentLatentReasoner | 16 | 0.1370 | 0.1570 | 0.1120 | 0.1580 | 0.1550 |

## Threshold Analysis

Minimum budget k required to reach accuracy thresholds (mean across seeds):

### Task A
**AutoregressiveCoT**:
  - 50%: k=8 (accuracy=0.5214, latency=0.510ms)
  - 60%: k=12 (accuracy=0.6436, latency=0.751ms)
  - 70%: k=16 (accuracy=0.7670, latency=1.012ms)
  - 80%: not reached
  - 90%: not reached

**RecurrentLatentReasoner**:
  - 50%: not reached
  - 60%: not reached
  - 70%: not reached
  - 80%: not reached
  - 90%: not reached

### Task B
**AutoregressiveCoT**:
  - 50%: not reached
  - 60%: not reached
  - 70%: not reached
  - 80%: not reached
  - 90%: not reached

**RecurrentLatentReasoner**:
  - 50%: not reached
  - 60%: not reached
  - 70%: not reached
  - 80%: not reached
  - 90%: not reached
