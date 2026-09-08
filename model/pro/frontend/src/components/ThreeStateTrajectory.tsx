import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  FileText,
  Columns,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StatePoint {
  step: number;
  label: string;
  token: string;
  x: number;
  y: number;
  z: number;
  norm: number;
  delta: number;
  cosineSim: number;
  prediction: string;
  groundTruth: string;
  isCorrect: boolean;
  nearestStates: { label: string; sim: number }[];
}

const TRAJECTORY_DATA: StatePoint[] = [
  { step: 0, label: 'S0', token: 'v0', x: -3.2, y: -1.8, z: -1.2, norm: 24.15, delta: 0.00, cosineSim: 1.000, prediction: 'v3', groundTruth: 'v3', isCorrect: true, nearestStates: [{ label: 'S1', sim: 0.81 }, { label: 'S2', sim: 0.65 }, { label: 'S3', sim: 0.42 }] },
  { step: 1, label: 'S1', token: 'v1', x: -1.8, y: -0.6, z: -0.2, norm: 25.82, delta: 18.7577, cosineSim: 0.812, prediction: 'v0', groundTruth: 'v0', isCorrect: true, nearestStates: [{ label: 'S0', sim: 0.81 }, { label: 'S2', sim: 0.88 }, { label: 'S3', sim: 0.64 }] },
  { step: 2, label: 'S2', token: 'v2', x: -0.7, y: 0.3, z: 0.4, norm: 26.34, delta: 6.6495, cosineSim: 0.895, prediction: 'v1', groundTruth: 'v1', isCorrect: true, nearestStates: [{ label: 'S1', sim: 0.88 }, { label: 'S3', sim: 0.91 }, { label: 'S4', sim: 0.72 }] },
  { step: 3, label: 'S3', token: 'v3', x: 0.1, y: 0.8, z: 0.7, norm: 26.55, delta: 2.0270, cosineSim: 0.941, prediction: 'v7', groundTruth: 'v7', isCorrect: true, nearestStates: [{ label: 'S2', sim: 0.91 }, { label: 'S4', sim: 0.93 }, { label: 'S8', sim: 0.74 }] },
  { step: 4, label: 'S4', token: 'v4', x: 0.5, y: 1.0, z: 0.9, norm: 26.62, delta: 0.6120, cosineSim: 0.962, prediction: 'v3', groundTruth: 'v3', isCorrect: true, nearestStates: [{ label: 'S3', sim: 0.93 }, { label: 'S8', sim: 0.95 }, { label: 'S12', sim: 0.79 }] },
  { step: 8, label: 'S8', token: 'v8', x: 0.72, y: 1.15, z: 1.02, norm: 26.66, delta: 0.2727, cosineSim: 0.985, prediction: 'v3', groundTruth: 'v3', isCorrect: true, nearestStates: [{ label: 'S4', sim: 0.95 }, { label: 'S12', sim: 0.99 }, { label: 'S16', sim: 0.98 }] },
  { step: 12, label: 'S12', token: 'v12', x: 0.74, y: 1.16, z: 1.03, norm: 26.67, delta: 0.0073, cosineSim: 0.999, prediction: 'v3', groundTruth: 'v3', isCorrect: true, nearestStates: [{ label: 'S8', sim: 0.99 }, { label: 'S16', sim: 1.00 }, { label: 'S4', sim: 0.96 }] },
  { step: 16, label: 'S16', token: 'v16', x: 0.741, y: 1.161, z: 1.031, norm: 26.67, delta: 0.0005, cosineSim: 1.000, prediction: 'v3', groundTruth: 'v3', isCorrect: true, nearestStates: [{ label: 'S12', sim: 1.00 }, { label: 'S8', sim: 0.99 }, { label: 'S4', sim: 0.96 }] },
];

const TRANSITION_DELTAS = [
  { transition: '0 → 1', delta: '18.7577', desc: 'Initial dynamic update from memory' },
  { transition: '1 → 2', delta: '6.6495', desc: 'Second step deceleration' },
  { transition: '2 → 3', delta: '2.0270', desc: 'Rapid contraction in state velocity' },
  { transition: '3 → 4', delta: '0.6120', desc: 'Sub-unit transition magnitude' },
  { transition: '4 → 8', delta: '0.2727', desc: 'Deep recurrent drift' },
  { transition: '8 → 12', delta: '0.0073', desc: 'Near-zero movement' },
  { transition: '12 → 16', delta: '0.0005', desc: 'Numerical stabilization floor' },
];

export const ThreeStateTrajectory: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(5); // default S5 as in reference
  const [representation, setRepresentation] = useState<'PCA' | 't-SNE' | 'UMAP'>('PCA');
  const [colorBy, setColorBy] = useState<string>('Step index');
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);
  const [showStateLabels, setShowStateLabels] = useState<boolean>(true);
  const [showClusters, setShowClusters] = useState<boolean>(false);
  const [showStartEnd, setShowStartEnd] = useState<boolean>(true);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'inspector' | 'metrics'>('inspector');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>('Transformer (126K)');
  const [viewMode2D, setViewMode2D] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);

  const selectedState = TRAJECTORY_DATA[selectedIndex];

  // Camera presets
  const handleCameraPreset = (preset: 'orbit' | 'top' | 'side' | 'front' | 'reset') => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'top') {
      cam.position.set(0, 11, 0.01);
      cam.lookAt(0, 0, 0);
    } else if (preset === 'side') {
      cam.position.set(11, 0, 0);
      cam.lookAt(0, 0, 0);
    } else if (preset === 'front') {
      cam.position.set(0, 0, 11);
      cam.lookAt(0, 0, 0);
    } else {
      // Orbit / Reset
      cam.position.set(4, 5, 8.5);
      cam.lookAt(0, 0, 0);
    }
  };

  // Timeline auto-play
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedIndex((prev) => (prev + 1) % TRAJECTORY_DATA.length);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Three.js Mount
  useEffect(() => {
    if (!containerRef.current || viewMode2D) return;
    const container = containerRef.current;
    const width = container.clientWidth || 640;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 5, 8.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Subtle 3D Bounding Box Wireframe with axes
    const boxGeo = new THREE.BoxGeometry(7, 5, 4);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x1a2638, transparent: true, opacity: 0.6 });
    const wireframeBox = new THREE.LineSegments(boxEdges, boxMat);
    scene.add(wireframeBox);

    // Subtle background scatter points (like in reference image)
    const bgGeo = new THREE.BufferGeometry();
    const bgCount = 120;
    const bgPositions = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount * 3; i += 3) {
      bgPositions[i] = (Math.random() - 0.5) * 6;
      bgPositions[i + 1] = (Math.random() - 0.5) * 4;
      bgPositions[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    const bgMat = new THREE.PointsMaterial({ color: 0x334155, size: 0.08, transparent: true, opacity: 0.4 });
    const bgPoints = new THREE.Points(bgGeo, bgMat);
    scene.add(bgPoints);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight.position.set(6, 8, 10);
    scene.add(dirLight);

    // Trajectory Line
    if (showTrajectory) {
      const pts = TRAJECTORY_DATA.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.85 });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);
    }

    // Nodes
    nodesRef.current = [];
    TRAJECTORY_DATA.forEach((pt, i) => {
      const isSelected = i === selectedIndex;
      const isStart = i === 0;
      const isEnd = i === TRAJECTORY_DATA.length - 1;

      let color = 0xa855f7; // purple "other states"
      if (isStart && showStartEnd) color = 0x38bdf8; // cyan start
      if (isEnd && showStartEnd) color = 0xf97316; // orange end
      if (isSelected) color = 0xf59e0b; // amber halo highlight

      const radius = isSelected ? 0.24 : isStart || isEnd ? 0.18 : 0.14;
      const geo = new THREE.SphereGeometry(radius, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.4,
        emissive: isSelected ? 0xf59e0b : 0x000000,
        emissiveIntensity: isSelected ? 0.4 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pt.x, pt.y, pt.z);
      mesh.userData = { index: i };
      scene.add(mesh);
      nodesRef.current.push(mesh);

      // Selected Halo Ring
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(0.32, 0.38, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pt.x, pt.y, pt.z);
        ring.lookAt(camera.position);
        scene.add(ring);
      }
    });

    // Orbit mouse controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let sphericalTheta = 0.5;
    let sphericalPhi = Math.PI / 3;
    const radius = 9.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalTheta -= dx * 0.01;
      sphericalPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalPhi - dy * 0.01));

      camera.position.x = radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = radius * Math.cos(sphericalPhi);
      camera.position.z = radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(0, 0, 0);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(nodesRef.current);
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.index;
        if (typeof idx === 'number') {
          setSelectedIndex(idx);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [selectedIndex, showTrajectory, showStartEnd, viewMode2D]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem 2rem' }}>
      {/* 1. View Header with Breadcrumb, Title & Top-Right Model Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#38bdf8', cursor: 'pointer' }}>Lab</span>
            <span>&gt;</span>
            <span style={{ color: '#94a3b8' }}>Latent Workbench</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            Latent State Trajectory
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Explore how the model&apos;s internal state evolves through the task. Each point represents a latent state.
          </p>
        </div>

        {/* Top-Right Badge Card (Task & Model Selector) */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: '#0a101d',
              border: '1px solid #1e293b',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
            }}
          >
            <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Layers size={13} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9' }}>Task A: Permutation Orbit</div>
              <div style={{ fontSize: '0.66rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>PRECOMPUTED DIAGNOSTIC RUN</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0a101d',
              border: '1px solid #1e293b',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Model Architecture</div>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="Transformer (1M)" style={{ background: '#0a101d', color: '#fff' }}>1M Scaled [Precomputed Diagnostic]</option>
              <option value="Transformer (126K)" style={{ background: '#0a101d', color: '#fff' }}>126K Baseline [Precomputed Diagnostic]</option>
              <option value="Transformer (5M Recovery)" style={{ background: '#0a101d', color: '#fff' }}>5M Recovery [Precomputed Diagnostic]</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main 3-Column Instrument Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '230px 1fr 310px',
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left Column: Visualization Controls */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
            Visualization Controls
          </div>

          {/* Representation Pills */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
              Representation
            </div>
            <div style={{ display: 'flex', gap: '3px', background: '#06090e', padding: '2px', borderRadius: '4px', border: '1px solid #141d2c' }}>
              {(['PCA', 't-SNE', 'UMAP'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRepresentation(r)}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: representation === r ? '#0284c7' : 'transparent',
                    color: representation === r ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  {r === 'PCA' ? 'PCA (3D)' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Color by */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
              Color by
            </div>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value)}
              style={{
                width: '100%',
                background: '#06090e',
                border: '1px solid #1e293b',
                color: '#e2e8f0',
                fontSize: '0.75rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '4px',
                outline: 'none',
              }}
            >
              <option value="Step index">Step index</option>
              <option value="State norm">State norm ||h||₂</option>
              <option value="Delta velocity">Delta velocity Δh</option>
            </select>
          </div>

          {/* Toggles (Switches) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: 'Show trajectory', val: showTrajectory, set: setShowTrajectory },
              { label: 'Show state labels', val: showStateLabels, set: setShowStateLabels },
              { label: 'Show clusters', val: showClusters, set: setShowClusters },
              { label: 'Show start/end', val: showStartEnd, set: setShowStartEnd },
            ].map((tg) => (
              <label key={tg.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{tg.label}</span>
                <input
                  type="checkbox"
                  checked={tg.val}
                  onChange={(e) => tg.set(e.target.checked)}
                  style={{
                    accentColor: '#0284c7',
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer',
                  }}
                />
              </label>
            ))}
          </div>

          {/* Camera View Buttons */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
              Camera View
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {(['Orbit', 'Top', 'Side', 'Front'] as const).map((cam) => (
                <button
                  key={cam}
                  onClick={() => handleCameraPreset(cam.toLowerCase() as any)}
                  style={{
                    background: cam === 'Orbit' ? '#0284c7' : '#0c1320',
                    border: '1px solid #1a2538',
                    color: cam === 'Orbit' ? '#ffffff' : '#94a3b8',
                    fontSize: '0.7rem',
                    padding: '0.35rem 0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {cam}
                </button>
              ))}
            </div>
          </div>

          {/* Reset View Button */}
          <button
            onClick={() => handleCameraPreset('reset')}
            style={{
              marginTop: 'auto',
              background: 'transparent',
              border: '1px solid #1e293b',
              borderRadius: '4px',
              color: '#94a3b8',
              fontSize: '0.74rem',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            Reset View
          </button>
        </div>

        {/* Center Column: Dominant 3D Latent Space Viewport */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Viewport Top Bar / Legend */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.7rem 1rem',
              borderBottom: '1px solid #172234',
              backgroundColor: '#070b12',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>
              Latent Space ({representation} Projection)
            </div>

            {/* Legend matching reference image */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.68rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '12px', height: '2px', background: '#818cf8', display: 'inline-block' }}></span>
                <span>Trajectory</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                <span>Start state</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f97316', display: 'inline-block' }}></span>
                <span>End state</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a855f7', display: 'inline-block' }}></span>
                <span>Other states</span>
              </div>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div
            ref={containerRef}
            style={{
              flex: 1,
              minHeight: '380px',
              position: 'relative',
              cursor: 'grab',
              backgroundColor: '#06090e',
            }}
          />

          {/* Projection Disclaimer Label (Prompt Section 4 & 13 requirement) */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: '#475569',
              background: 'rgba(6, 9, 14, 0.8)',
              padding: '2px 6px',
              borderRadius: '2px',
              pointerEvents: 'none',
            }}
          >
            2D/3D projection of measured latent state (PCA) • Observed results only
          </div>
        </div>

        {/* Right Column: Contextual Inspector */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {/* Inspector Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #172234', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <button
              onClick={() => setActiveInspectorTab('inspector')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeInspectorTab === 'inspector' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeInspectorTab === 'inspector' ? '#38bdf8' : '#64748b',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
              }}
            >
              State Inspector
            </button>
            <button
              onClick={() => setActiveInspectorTab('metrics')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeInspectorTab === 'metrics' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeInspectorTab === 'metrics' ? '#38bdf8' : '#64748b',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
              }}
            >
              Trajectory Metrics
            </button>
          </div>

          {/* Active State Header with < > Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
              State: {selectedState.label}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedIndex === 0}
                style={{
                  background: '#0e1624',
                  border: '1px solid #1e293b',
                  color: selectedIndex === 0 ? '#475569' : '#e2e8f0',
                  borderRadius: '3px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selectedIndex === 0 ? 'default' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setSelectedIndex((prev) => Math.min(TRAJECTORY_DATA.length - 1, prev + 1))}
                disabled={selectedIndex === TRAJECTORY_DATA.length - 1}
                style={{
                  background: '#0e1624',
                  border: '1px solid #1e293b',
                  color: selectedIndex === TRAJECTORY_DATA.length - 1 ? '#475569' : '#e2e8f0',
                  borderRadius: '3px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selectedIndex === TRAJECTORY_DATA.length - 1 ? 'default' : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {activeInspectorTab === 'inspector' ? (
            <>
              {/* Properties Table matching reference */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Step index</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedState.step}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Token</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedState.token}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Position (PC1, PC2, PC3)</span>
                  <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                    ({selectedState.x.toFixed(2)}, {selectedState.y.toFixed(2)}, {selectedState.z.toFixed(2)})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>State norm ||h||₂</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedState.norm.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Δ(h_t, h_&#123;t-1&#125;)</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedState.delta.toFixed(4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>cos(h_t, h_&#123;t-1&#125;)</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedState.cosineSim.toFixed(3)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Top prediction</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedState.prediction}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Ground truth</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{selectedState.groundTruth}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Correct</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#22c55e', fontWeight: 600 }}>
                    <CheckCircle size={13} />
                  </span>
                </div>
              </div>

              {/* Nearest States with Similarity Bars */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid #172234', paddingTop: '0.65rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                  Nearest states (cosine similarity)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedState.nearestStates.map((ns) => (
                    <div key={ns.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                      <span style={{ width: '22px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>{ns.label}</span>
                      <div style={{ flex: 1, height: '6px', background: '#0a101d', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${ns.sim * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <span style={{ width: '30px', textAlign: 'right', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.67rem' }}>
                        {ns.sim.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.74rem' }}>
              <div style={{ background: '#06090e', border: '1px solid #1e293b', borderRadius: '4px', padding: '0.6rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  MEASURED TRANSITION VELOCITY
                </div>
                <div style={{ fontSize: '0.67rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  In the 1M latent reasoning model, the internal recurrent state exhibits <strong>rapid numerical near-stabilization</strong> rather than ongoing dynamic computation.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '55px 75px 1fr', fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)', paddingBottom: '0.2rem', borderBottom: '1px solid #172234' }}>
                  <span>STEP</span>
                  <span>Δ MAG</span>
                  <span>OBSERVATION</span>
                </div>
                {TRANSITION_DELTAS.map((t) => (
                  <div key={t.transition} style={{ display: 'grid', gridTemplateColumns: '55px 75px 1fr', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '0.2rem 0', borderBottom: '1px solid #0d1522' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{t.transition}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{t.delta}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.64rem' }}>{t.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.35, borderTop: '1px solid #172234', paddingTop: '0.45rem' }}>
                Scientific distinction: This behavior is <em>rapid numerical near-stabilization</em>, NOT an exact mathematical fixed point. Coordinates represent a 3D Principal Component Analysis (PCA) projection.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Timeline Scrubber & Quick Actions Dock */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 310px',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Trajectory Timeline */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
              Trajectory Timeline
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Select a state to inspect its representation and predictions.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
            </button>

            {/* Interactive Timeline Track */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', padding: '0 0.5rem' }}>
              {/* Connecting line */}
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  right: '10px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #f97316 100%)',
                  zIndex: 1,
                }}
              />

              {/* State Dots */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', zIndex: 2 }}>
                {TRAJECTORY_DATA.map((pt, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={pt.label}
                      onClick={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          width: isSelected ? '18px' : '10px',
                          height: isSelected ? '18px' : '10px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#f59e0b' : idx === 0 ? '#38bdf8' : idx === TRAJECTORY_DATA.length - 1 ? '#f97316' : '#818cf8',
                          boxShadow: isSelected ? '0 0 10px #f59e0b' : 'none',
                          border: isSelected ? '2px solid #ffffff' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.67rem',
                          fontFamily: 'var(--font-mono)',
                          color: isSelected ? '#f59e0b' : '#64748b',
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {pt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Dock */}
        <div
          style={{
            backgroundColor: '#090e17',
            border: '1px solid #172234',
            borderRadius: '6px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#070c14',
                border: '1px solid #1a2538',
                color: '#cbd5e1',
                padding: '0.45rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <Play size={12} style={{ color: '#38bdf8' }} />
              <span>Animate</span>
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(TRAJECTORY_DATA, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'latent_trajectory_pca.json';
                a.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#070c14',
                border: '1px solid #1a2538',
                color: '#cbd5e1',
                padding: '0.45rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <Download size={12} style={{ color: '#38bdf8' }} />
              <span>Export</span>
            </button>
            <button
              onClick={() => setViewMode2D(!viewMode2D)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#070c14',
                border: '1px solid #1a2538',
                color: '#cbd5e1',
                padding: '0.45rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <Columns size={12} style={{ color: '#38bdf8' }} />
              <span>{viewMode2D ? '3D View' : 'Table View'}</span>
            </button>
            <button
              onClick={() => {
                alert(`Raw Latent Dimensions: Step ${selectedState.step}, ||h||=${selectedState.norm.toFixed(3)}, Δh=${selectedState.delta.toFixed(3)}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#070c14',
                border: '1px solid #1a2538',
                color: '#cbd5e1',
                padding: '0.45rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <FileText size={12} style={{ color: '#38bdf8' }} />
              <span>Raw Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
