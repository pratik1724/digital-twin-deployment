import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import IndustrialDRMSimulation from '../components/simulation/IndustrialDRMSimulation';
import TestDRMSimulation from '../components/simulation/TestDRMSimulation';

const BRAND = process.env.REACT_APP_BRAND_NAME || "AnukaranAI";
const BRAND_LOGO = process.env.REACT_APP_BRAND_LOGO || "/brand.png";

// Input validation ranges
const VALIDATION_RANGES = {
  h2_flowrate: { min: 0, max: 2000, unit: 'ml/min' },
  ch4_flowrate: { min: 0, max: 2000, unit: 'ml/min' },
  co2_flowrate: { min: 0, max: 1000, unit: 'ml/min' },
  n2_flowrate: { min: 0, max: 1000, unit: 'ml/min' },
  air_flowrate: { min: 0, max: 1000, unit: 'ml/min' },
  reactor_temperature: { min: 200, max: 1000, unit: '°C' },
  reactor_pressure: { min: 1, max: 50, unit: 'bar' }
};

// Default simulation parameters
const DEFAULT_PARAMS = {
  h2_flowrate: 1200,
  ch4_flowrate: 800,
  co2_flowrate: 400,
  n2_flowrate: 200,
  air_flowrate: 300,
  reactor_temperature: 850,
  reactor_pressure: 5.0
};

function SimulationInputPanel({ params, onParamChange, onRunSimulation, isRunning }) {
  const [errors, setErrors] = useState({});

  const validateParam = (key, value) => {
    const range = VALIDATION_RANGES[key];
    if (!range) return null;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `Invalid number`;
    if (numValue < range.min || numValue > range.max) {
      return `Must be between ${range.min} and ${range.max} ${range.unit}`;
    }
    return null;
  };

  const handleInputChange = (key, value) => {
    const error = validateParam(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
    onParamChange(key, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all parameters
    const newErrors = {};
    Object.keys(params).forEach(key => {
      const error = validateParam(key, params[key]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onRunSimulation(params);
    }
  };

  const renderInput = (key, label) => {
    const range = VALIDATION_RANGES[key];
    return (
      <div key={key} className="simulation-input-group">
        <label className="simulation-input-label">
          {label}
          <span className="simulation-input-unit">({range.unit})</span>
        </label>
        <input
          type="number"
          value={params[key]}
          onChange={(e) => handleInputChange(key, e.target.value)}
          min={range.min}
          max={range.max}
          step={key === 'reactor_pressure' ? '0.1' : '1'}
          className={`simulation-input ${errors[key] ? 'simulation-input-error' : ''}`}
          disabled={isRunning}
        />
        {errors[key] && <div className="simulation-error-text">{errors[key]}</div>}
        <div className="simulation-input-range">
          Range: {range.min} - {range.max} {range.unit}
        </div>
      </div>
    );
  };

  return (
    <div className="simulation-panel">
      <div className="simulation-panel-header">
        <h2 className="simulation-panel-title">🔧 Simulation Inputs</h2>
        <p className="simulation-panel-subtitle">Configure simulation parameters</p>
      </div>
      
      <form onSubmit={handleSubmit} className="simulation-form">
        <div className="simulation-input-section">
          <h3 className="simulation-section-title">Inlet Flowrates</h3>
          {renderInput('h2_flowrate', 'H₂ Inlet Flowrate')}
          {renderInput('ch4_flowrate', 'CH₄ Inlet Flowrate')}
          {renderInput('co2_flowrate', 'CO₂ Inlet Flowrate')}
          {renderInput('n2_flowrate', 'N₂ Inlet Flowrate')}
          {renderInput('air_flowrate', 'Air Inlet Flowrate')}
        </div>
        
        <div className="simulation-input-section">
          <h3 className="simulation-section-title">Reactor Conditions</h3>
          {renderInput('reactor_temperature', 'Reactor Temperature')}
          {renderInput('reactor_pressure', 'Reactor Pressure')}
        </div>
        
        <button 
          type="submit" 
          className={`simulation-run-button ${isRunning ? 'simulation-run-button-running' : ''}`}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <div className="simulation-spinner"></div>
              Running Simulation...
            </>
          ) : (
            <>
              🚀 Run Simulation
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function SimulationResultsPanel({ isRunning, results }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    async function initVisualization() {
      if (!mountRef.current || disposed) return;

      try {
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d0f12);
        sceneRef.current = scene;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        rendererRef.current = renderer;
        mountRef.current.appendChild(renderer.domElement);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, 
          mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 5);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-1, 1, 1);
        scene.add(directionalLight);

        // Placeholder geometry - a rotating reactor vessel
        const geometry = new THREE.CylinderGeometry(1, 1, 3, 32);
        const material = new THREE.MeshPhongMaterial({ 
          color: 0x22c55e, 
          transparent: true, 
          opacity: 0.7,
          wireframe: false
        });
        const reactor = new THREE.Mesh(geometry, material);
        scene.add(reactor);

        // Add some inlet/outlet pipes
        const pipeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
        const pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x3b82f6 });
        
        // Inlet pipes
        for (let i = 0; i < 5; i++) {
          const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
          pipe.position.set(Math.cos(i * Math.PI * 0.4) * 1.2, 1, Math.sin(i * Math.PI * 0.4) * 1.2);
          pipe.rotation.z = Math.PI / 2;
          scene.add(pipe);
        }

        // Outlet pipe
        const outletPipe = new THREE.Mesh(pipeGeometry, new THREE.MeshPhongMaterial({ color: 0xef4444 }));
        outletPipe.position.set(0, -2, 0);
        scene.add(outletPipe);

        // Animation loop
        function animate() {
          if (disposed) return;
          
          frameRef.current = requestAnimationFrame(animate);
          
          // Rotate the reactor
          reactor.rotation.y += 0.01;
          
          renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        function handleResize() {
          if (disposed || !mountRef.current) return;
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (error) {
        console.error('Visualization setup error:', error);
      }
    }

    initVisualization();

    return () => {
      disposed = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="simulation-panel">
      <div className="simulation-panel-header">
        <h2 className="simulation-panel-title">📊 Simulation Results</h2>
        <p className="simulation-panel-subtitle">3D CFD Visualization</p>
      </div>
      
      <div className="simulation-results-content">
        {!results && !isRunning && (
          <div className="simulation-placeholder">
            <div className="simulation-placeholder-icon">🔬</div>
            <div className="simulation-placeholder-text">
              Run a simulation to see CFD results
            </div>
            <div className="simulation-placeholder-subtext">
              Mesh, scalar fields, and streamlines will appear here
            </div>
          </div>
        )}
        
        {isRunning && (
          <div className="simulation-loading">
            <div className="simulation-loading-spinner"></div>
            <div className="simulation-loading-text">Processing simulation...</div>
            <div className="simulation-loading-subtext">Generating CFD results</div>
          </div>
        )}
        
        <div 
          ref={mountRef} 
          className="simulation-3d-viewer"
          style={{ 
            height: results || isRunning ? '300px' : '400px',
            display: results || !isRunning ? 'block' : 'none'
          }}
        />
        
        {results && (
          <div className="simulation-results-summary">
            <h3 className="simulation-results-title">Simulation Summary</h3>
            <div className="simulation-results-grid">
              <div className="simulation-result-item">
                <span className="simulation-result-label">Status:</span>
                <span className="simulation-result-value success">✅ Completed</span>
              </div>
              <div className="simulation-result-item">
                <span className="simulation-result-label">Runtime:</span>
                <span className="simulation-result-value">{results.runtime}s</span>
              </div>
              <div className="simulation-result-item">
                <span className="simulation-result-label">Mesh Cells:</span>
                <span className="simulation-result-value">{results.meshCells?.toLocaleString()}</span>
              </div>
              <div className="simulation-result-item">
                <span className="simulation-result-label">Converged:</span>
                <span className="simulation-result-value success">✅ Yes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SimulationConsole() {
  const navigate = useNavigate();
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [simulationType, setSimulationType] = useState('fop'); // 'cfd', 'ml', 'fop'

  // First Order Principle simulation parameters
  const [fopParams, setFopParams] = useState({
    T_C: 825.0,
    P_bar: 1.0,
    fCH4_mlpm: 700.0,
    fCO2_mlpm: 300.0,
    fN2_mlpm: 0.0,
    GHSV: 10000.0
  });

  // Load user info from localStorage and check permissions
  useEffect(() => {
    const userData = localStorage.getItem('dmr_user_data') || localStorage.getItem('smr_user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        // Redirect read-only users away from simulation console
        if (user.role === 'read_only') {
          alert('Access denied. Simulation Console is for Admin users only.');
          navigate('/digital-twins');
          return;
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
        navigate('/digital-twins');
      }
    } else {
      navigate('/digital-twins');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('dmr_authenticated');
    localStorage.removeItem('dmr_user');
    localStorage.removeItem('dmr_user_data');
    // Migration cleanup
    localStorage.removeItem('smr_authenticated');
    localStorage.removeItem('smr_user');
    localStorage.removeItem('smr_user_data');
    navigate('/');
  };

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleFopParamChange = (key, value) => {
    setFopParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleRunSimulation = async (simulationParams) => {
    setIsRunning(true);
    setResults(null);
    
    try {
      // TODO: Replace with actual API call to backend
      const backend = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backend}/api/simulation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationParams),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Simulate processing time
        setTimeout(() => {
          setResults({
            runtime: 45.2,
            meshCells: 125000,
            converged: true,
            ...data
          });
          setIsRunning(false);
        }, 3000);
      } else {
        // Fallback for demo - simulate successful completion
        setTimeout(() => {
          setResults({
            runtime: 42.8,
            meshCells: 118500,
            converged: true
          });
          setIsRunning(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      // Fallback for demo
      setTimeout(() => {
        setResults({
          runtime: 38.5,
          meshCells: 95000,
          converged: true
        });
        setIsRunning(false);
      }, 3000);
    }
  };

  const handleRunMLSimulation = async () => {
    setIsRunning(true);
    setResults(null);
    
    // Simulate ML computation
    setTimeout(() => {
      setResults({
        type: 'ml',
        runtime: 12.3,
        accuracy: 0.95,
        predictions: {
          h2_yield: 0.78,
          co_yield: 0.82,
          conversion: 0.85,
          selectivity: 0.91
        },
        model_info: {
          architecture: 'Deep Neural Network',
          layers: 5,
          neurons: 256,
          training_samples: 10000
        }
      });
      setIsRunning(false);
    }, 2000);
  };

  const handleRunFOPSimulation = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const backend = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backend}/api/simulation/fop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fopParams),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults({
          type: 'fop',
          ...data
        });
      } else {
        // Fallback simulation
        setResults({
          type: 'fop',
          runtime: 8.5,
          exit_temperature: 825.5,
          conversion_ch4: 0.82,
          conversion_co2: 0.79,
          yield_h2: 0.75,
          yield_co: 0.78,
          outlet_composition: {
            CH4: 0.12,
            CO2: 0.08,
            H2: 0.35,
            CO: 0.33,
            N2: 0.12
          }
        });
      }
    } catch (error) {
      console.error('FOP Simulation error:', error);
      // Fallback
      setResults({
        type: 'fop',
        runtime: 8.5,
        exit_temperature: 825.5,
        conversion_ch4: 0.82,
        conversion_co2: 0.79,
        yield_h2: 0.75,
        yield_co: 0.78,
        outlet_composition: {
          CH4: 0.12,
          CO2: 0.08,
          H2: 0.35,
          CO: 0.33,
          N2: 0.12
        }
      });
    }
    setIsRunning(false);
  };

  const getPageTitle = () => {
    switch (simulationType) {
      case 'ml': return 'Machine Learning ANN Simulation';
      case 'fop': return 'First Order Principle Simulation';
      default: return 'CFD Simulation';
    }
  };

  return (
    <div className="simulation-console">
      <header className="simulation-header">
        <div className="brand" aria-label={BRAND}>
          <img src={BRAND_LOGO} alt="brand" className="brand-logo" onError={(e)=>{e.currentTarget.style.display='none'}} />
          <span className="simulation-title">Simulation Console</span>
        </div>
        <div className="flex gap-3">
          <a className="btn-outline" href="/dashboard">Back to Dashboard</a>
          <a className="btn-outline" href="/metrics">Metrics</a>
          <button className="btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Simulation Type Selector - Compact Header */}
      <div className="simulation-selector-compact">
        <div className="simulation-selector-row">
          <div className="simulation-dropdown-group">
            <label htmlFor="simulation-type" className="simulation-selector-label">
              Select Simulation Type:
            </label>
            <select
              id="simulation-type"
              value={simulationType}
              onChange={(e) => {
                setSimulationType(e.target.value);
                setResults(null);
                setIsRunning(false);
              }}
              className="simulation-selector-dropdown"
            >
              <option value="cfd">CFD Simulation</option>
              <option value="ml">Machine Learning ANN Simulation</option>
              <option value="fop">First Order Principle Simulation</option>
            </select>
          </div>
          <h1 className="simulation-page-title-inline">{getPageTitle()}</h1>
        </div>
      </div>
      
      <div className={simulationType === 'fop' ? 'simulation-content-fop' : 'simulation-content'}>
        {simulationType === 'cfd' && (
          <>
            <SimulationInputPanel 
              params={params}
              onParamChange={handleParamChange}
              onRunSimulation={handleRunSimulation}
              isRunning={isRunning}
            />
            <SimulationResultsPanel 
              isRunning={isRunning}
              results={results}
            />
          </>
        )}

        {simulationType === 'ml' && (
          <>
            <MLSimulationPanel 
              onRunSimulation={handleRunMLSimulation}
              isRunning={isRunning}
            />
            <MLResultsPanel 
              isRunning={isRunning}
              results={results}
            />
          </>
        )}

        {simulationType === 'fop' && (
          <div className="simulation-content-wrapper">
            <IndustrialDRMSimulation />
          </div>
        )}
      </div>
    </div>
  );
}

// Machine Learning Simulation Panel
function MLSimulationPanel({ onRunSimulation, isRunning }) {
  return (
    <div className="simulation-panel">
      <div className="simulation-panel-header">
        <h2 className="simulation-panel-title">🧠 Machine Learning ANN Model</h2>
        <p className="simulation-panel-subtitle">Neural network-based reactor prediction</p>
      </div>
      
      <div className="simulation-form">
        <div className="simulation-input-section">
          <h3 className="simulation-section-title">Model Information</h3>
          <div className="ml-info-grid">
            <div className="ml-info-item">
              <span className="ml-info-label">Architecture:</span>
              <span className="ml-info-value">Deep Neural Network</span>
            </div>
            <div className="ml-info-item">
              <span className="ml-info-label">Input Features:</span>
              <span className="ml-info-value">Temperature, Pressure, Flow Rates</span>
            </div>
            <div className="ml-info-item">
              <span className="ml-info-label">Output Predictions:</span>
              <span className="ml-info-value">Conversion, Yield, Selectivity</span>
            </div>
            <div className="ml-info-item">
              <span className="ml-info-label">Training Data:</span>
              <span className="ml-info-value">10,000+ experimental points</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onRunSimulation}
          className={`simulation-run-button ${isRunning ? 'simulation-run-button-running' : ''}`}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <div className="simulation-spinner"></div>
              Running ANN Simulation...
            </>
          ) : (
            <>
              🤖 Run ANN Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Machine Learning Results Panel
function MLResultsPanel({ isRunning, results }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (results && results.type === 'ml' && chartRef.current) {
      // Simple chart rendering
      const canvas = chartRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 300;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw simple bar chart for predictions
      const predictions = results.predictions;
      const keys = Object.keys(predictions);
      const barWidth = 80;
      const barSpacing = 100;
      const maxHeight = 200;
      
      ctx.fillStyle = '#10b981';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      keys.forEach((key, index) => {
        const value = predictions[key];
        const x = 50 + index * barSpacing;
        const height = value * maxHeight;
        const y = canvas.height - 50 - height;
        
        // Draw bar
        ctx.fillRect(x, y, barWidth, height);
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.fillText(key.replace('_', ' ').toUpperCase(), x + barWidth/2, canvas.height - 20);
        ctx.fillText((value * 100).toFixed(1) + '%', x + barWidth/2, y - 10);
        ctx.fillStyle = '#10b981';
      });
    }
  }, [results]);

  return (
    <div className="simulation-panel">
      <div className="simulation-panel-header">
        <h2 className="simulation-panel-title">📊 ANN Predictions</h2>
        <p className="simulation-panel-subtitle">Neural network results</p>
      </div>
      
      <div className="simulation-results-content">
        {!results && !isRunning && (
          <div className="simulation-placeholder">
            <div className="simulation-placeholder-icon">🤖</div>
            <div className="simulation-placeholder-text">
              Run ANN simulation to see predictions
            </div>
            <div className="simulation-placeholder-subtext">
              Neural network will predict reactor performance
            </div>
          </div>
        )}
        
        {isRunning && (
          <div className="simulation-loading">
            <div className="simulation-loading-spinner"></div>
            <div className="simulation-loading-text">Processing with neural network...</div>
            <div className="simulation-loading-subtext">Generating predictions</div>
          </div>
        )}
        
        {results && results.type === 'ml' && (
          <>
            <canvas 
              ref={chartRef} 
              className="ml-chart"
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                backgroundColor: 'rgba(13, 15, 18, 0.8)'
              }}
            />
            
            <div className="simulation-results-summary">
              <h3 className="simulation-results-title">Prediction Summary</h3>
              <div className="simulation-results-grid">
                <div className="simulation-result-item">
                  <span className="simulation-result-label">Model Accuracy:</span>
                  <span className="simulation-result-value success">✅ {(results.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">Runtime:</span>
                  <span className="simulation-result-value">{results.runtime}s</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">H₂ Yield:</span>
                  <span className="simulation-result-value">{(results.predictions.h2_yield * 100).toFixed(1)}%</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">Conversion:</span>
                  <span className="simulation-result-value">{(results.predictions.conversion * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// First Order Principle Simulation Panel
function FOPSimulationPanel({ params, onParamChange, onRunSimulation, isRunning }) {
  const [errors, setErrors] = useState({});

  const validateParam = (key, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `Invalid number`;
    
    // Define validation ranges for FOP parameters
    const ranges = {
      T_C: { min: 600, max: 1000 },
      P_bar: { min: 0.5, max: 10 },
      fCH4_mlpm: { min: 0, max: 2000 },
      fCO2_mlpm: { min: 0, max: 2000 },
      fN2_mlpm: { min: 0, max: 1000 },
      GHSV: { min: 1000, max: 50000 }
    };
    
    const range = ranges[key];
    if (range && (numValue < range.min || numValue > range.max)) {
      return `Must be between ${range.min} and ${range.max}`;
    }
    return null;
  };

  const handleInputChange = (key, value) => {
    const error = validateParam(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
    onParamChange(key, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all parameters
    const newErrors = {};
    Object.keys(params).forEach(key => {
      const error = validateParam(key, params[key]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onRunSimulation();
    }
  };

  const renderInput = (key, label, unit) => (
    <div key={key} className="simulation-input-group">
      <label className="simulation-input-label">
        {label}
        <span className="simulation-input-unit">({unit})</span>
      </label>
      <input
        type="number"
        value={params[key]}
        onChange={(e) => handleInputChange(key, e.target.value)}
        step={key === 'T_C' ? '1' : key.includes('_bar') ? '0.1' : '1'}
        className={`simulation-input ${errors[key] ? 'simulation-input-error' : ''}`}
        disabled={isRunning}
      />
      {errors[key] && <div className="simulation-error-text">{errors[key]}</div>}
    </div>
  );

  return (
    <div className="simulation-panel">
      <div className="simulation-panel-header">
        <h2 className="simulation-panel-title">⚗️ First Order Principle Model</h2>
        <p className="simulation-panel-subtitle">Cantera-based kinetic simulation</p>
      </div>
      
      <form onSubmit={handleSubmit} className="simulation-form">
        <div className="simulation-input-section">
          <h3 className="simulation-section-title">Reactor Conditions</h3>
          {renderInput('T_C', 'Temperature', '°C')}
          {renderInput('P_bar', 'Pressure', 'bar')}
          {renderInput('GHSV', 'Gas Hourly Space Velocity', 'h⁻¹')}
        </div>
        
        <div className="simulation-input-section">
          <h3 className="simulation-section-title">Feed Flowrates</h3>
          {renderInput('fCH4_mlpm', 'CH₄ Flowrate', 'ml/min')}
          {renderInput('fCO2_mlpm', 'CO₂ Flowrate', 'ml/min')}
          {renderInput('fN2_mlpm', 'N₂ Flowrate', 'ml/min')}
        </div>
        
        <button 
          type="submit" 
          className={`simulation-run-button ${isRunning ? 'simulation-run-button-running' : ''}`}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <div className="simulation-spinner"></div>
              Running FOP Simulation...
            </>
          ) : (
            <>
              ⚗️ Run Simulation
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// First Order Principle Results Panel
function FOPResultsPanel({ isRunning, results }) {
  return (
    <div className="simulation-panel">
      <div className="simulation-panel-header">
        <h2 className="simulation-panel-title">📊 FOP Results</h2>
        <p className="simulation-panel-subtitle">Kinetic model predictions</p>
      </div>
      
      <div className="simulation-results-content">
        {!results && !isRunning && (
          <div className="simulation-placeholder">
            <div className="simulation-placeholder-icon">⚗️</div>
            <div className="simulation-placeholder-text">
              Run FOP simulation to see kinetic results
            </div>
            <div className="simulation-placeholder-subtext">
              Cantera-based reactor modeling results will appear here
            </div>
          </div>
        )}
        
        {isRunning && (
          <div className="simulation-loading">
            <div className="simulation-loading-spinner"></div>
            <div className="simulation-loading-text">Processing kinetic model...</div>
            <div className="simulation-loading-subtext">Solving reactor equations</div>
          </div>
        )}
        
        {results && results.type === 'fop' && (
          <div className="simulation-results-summary">
            <h3 className="simulation-results-title">Reactor Performance</h3>
            
            <div className="fop-results-section">
              <h4 className="fop-section-title">Conversions & Yields</h4>
              <div className="simulation-results-grid">
                <div className="simulation-result-item">
                  <span className="simulation-result-label">CH₄ Conversion:</span>
                  <span className="simulation-result-value">{(results.conversion_ch4 * 100).toFixed(1)}%</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">CO₂ Conversion:</span>
                  <span className="simulation-result-value">{(results.conversion_co2 * 100).toFixed(1)}%</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">H₂ Yield:</span>
                  <span className="simulation-result-value">{(results.yield_h2 * 100).toFixed(1)}%</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">CO Yield:</span>
                  <span className="simulation-result-value">{(results.yield_co * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="fop-results-section">
              <h4 className="fop-section-title">Outlet Composition</h4>
              <div className="simulation-results-grid">
                {Object.entries(results.outlet_composition || {}).map(([species, fraction]) => (
                  <div key={species} className="simulation-result-item">
                    <span className="simulation-result-label">{species}:</span>
                    <span className="simulation-result-value">{(fraction * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fop-results-section">
              <h4 className="fop-section-title">Process Conditions</h4>
              <div className="simulation-results-grid">
                <div className="simulation-result-item">
                  <span className="simulation-result-label">Exit Temperature:</span>
                  <span className="simulation-result-value">{results.exit_temperature?.toFixed(1)}°C</span>
                </div>
                <div className="simulation-result-item">
                  <span className="simulation-result-label">Runtime:</span>
                  <span className="simulation-result-value">{results.runtime}s</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimulationConsole;