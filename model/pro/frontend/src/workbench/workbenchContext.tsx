import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ProvenanceType, DisclosureLevel, StateSnapshot, TelemetryData } from './types';

interface WorkbenchContextType {
  activeObjectId: string;
  setActiveObjectId: (id: string) => void;
  disclosureLevel: DisclosureLevel;
  setDisclosureLevel: (level: DisclosureLevel) => void;
  is3DMode: boolean;
  setIs3DMode: (val: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  maxSteps: number;
  setMaxSteps: (max: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  budgetK: number;
  setBudgetK: (k: number) => void;
  selectedState: StateSnapshot | null;
  setSelectedState: (state: StateSnapshot | null) => void;
  history: StateSnapshot[];
  setHistory: (history: StateSnapshot[]) => void;
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  runExperiment: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  resetExperiment: () => void;
}

const defaultTelemetry: TelemetryData = {
  status: 'idle',
  budgetK: 8,
  currentStep: 0,
  totalSteps: 8,
  latencyMs: 0.44,
  analyticalFlops: 184000,
  accuracy: 57.18,
  groundTruth: 'v7',
  modelPrediction: 'v7',
  provenance: 'PRECOMPUTED',
};

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeObjectId, setActiveObjectId] = useState<string>('task_a_orbit');
  const [disclosureLevel, setDisclosureLevel] = useState<DisclosureLevel>('inspect');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [maxSteps, setMaxSteps] = useState<number>(8);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [budgetK, setBudgetK] = useState<number>(8);
  const [selectedState, setSelectedState] = useState<StateSnapshot | null>(null);
  const [history, setHistory] = useState<StateSnapshot[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData>(defaultTelemetry);

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, maxSteps);
      if (history[next]) {
        setSelectedState(history[next]);
      }
      return next;
    });
  }, [maxSteps, history]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.max(prev - 1, 0);
      if (history[next]) {
        setSelectedState(history[next]);
      }
      return next;
    });
  }, [history]);

  const resetExperiment = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    if (history[0]) {
      setSelectedState(history[0]);
    }
    setTelemetry((prev) => ({ ...prev, status: 'idle', currentStep: 0 }));
  }, [history]);

  const runExperiment = useCallback(() => {
    setIsPlaying(true);
    setTelemetry((prev) => ({ ...prev, status: 'running' }));
  }, []);

  const value = useMemo(() => ({
    activeObjectId,
    setActiveObjectId,
    disclosureLevel,
    setDisclosureLevel,
    is3DMode,
    setIs3DMode,
    currentStep,
    setCurrentStep,
    maxSteps,
    setMaxSteps,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    budgetK,
    setBudgetK,
    selectedState,
    setSelectedState,
    history,
    setHistory,
    telemetry,
    setTelemetry,
    runExperiment,
    stepForward,
    stepBackward,
    resetExperiment,
  }), [
    activeObjectId,
    disclosureLevel,
    is3DMode,
    currentStep,
    maxSteps,
    isPlaying,
    speed,
    budgetK,
    selectedState,
    history,
    telemetry,
    runExperiment,
    stepForward,
    stepBackward,
    resetExperiment,
  ]);

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
};

export const useWorkbench = (): WorkbenchContextType => {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
};
