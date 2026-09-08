# Test State

Last verified: 2026-09-07

## Backend API Tests
- [x] GET /api/health (passed in test_api.py)
- [x] GET /api/models (passed in test_api.py)
- [x] GET /api/tasks (passed in test_api.py)
- [x] GET /api/scales (passed in test_api.py)
- [x] POST /api/examples (passed in test_api.py)
- [x] POST /api/simulate (passed in test_api.py)
- [x] POST /api/compare (passed in test_api.py)
- [x] POST /api/sweep (passed in test_api.py)
- [x] GET /api/pareto (passed in test_api.py)
- [x] Budget validation (reject invalid with 422, passed in test_api.py)
- [x] Same-instance compare guarantee (passed in test_api.py)
- [x] 5M Recovery checkpoint verification (passed in test_api.py)
Total API suite: 13/13 passed.

## Frontend Verification
- [x] TypeScript compilation (`tsc`) - zero errors
- [x] Vite production build (`npm run build`) - built in 8.88s cleanly
- [x] App renders initial preset without error (verified in browser subagent)
- [x] Live inference updates correctly (verified in browser subagent)
- [x] Scale toggles update Pareto chart (verified in browser subagent)
- [x] Simulation Lab single run and sweep execution (verified in browser subagent)
- [x] Comprehension quiz feedback (verified in browser subagent)

## ML Regression Tests (Must remain passing)
- [x] `test_research_pipeline.py` (7/7 passed)
- [x] `test_scaling_1m.py` (15/15 passed)
- [x] `test_scaling_5m.py` (12/12 passed)
- [x] `test_simulation_lab.py` (26/26 passed)
Total ML suite: 60/60 passed.
