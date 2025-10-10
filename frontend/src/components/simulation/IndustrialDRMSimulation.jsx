import React, { useState, useEffect } from "react";

// API Configuration
const DEFAULT_API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

// Available gases for selection
const AVAILABLE_GASES = ["CO2", "CO", "O2", "N2", "CH4", "H2", "Ar", "He"];

// Real DWSIM Stream Data - Comprehensive data from API
const DWSIM_STREAM_DATA = {
  stream_1: {
    stream_number: 1,
    custom_name: "6",
    temperature_K: 1123.15,
    temperature_C: 850.0000000000001,
    pressure_Pa: 101290.48764520987,
    pressure_bar: 1.0129048764520987,
    mass_flow_kg_s: 4.1099090168498747e-05,
    mass_flow_mg_s: 41.09909016849875,
    molar_flow_mol_s: 0.002664806055719852,
    volumetric_flow_m3_s: 0.00024571804476027054,
    density_kg_m3: 0.16726118022221845,
    molecular_weight_kg_mol: 15.422919833239618,
    enthalpy_kJ_kg: 1661.6947310060104,
    entropy_kJ_kg_K: 4.22424074526301,
    active: true,
    timestamp: "2025-09-26T19:15:07.545991"
  },
  stream_2: {
    stream_number: 2,
    custom_name: "CO2 Inlet",
    temperature_K: 194.14863959814645,
    temperature_C: -79.00136040185353,
    pressure_Pa: 101290.80824805237,
    pressure_bar: 1.0129080824805237,
    mass_flow_kg_s: 3.014711104789161e-05,
    mass_flow_mg_s: 30.14711104789161,
    molar_flow_mol_s: 0.0006850137140365514,
    volumetric_flow_m3_s: 1.231339813813584e-05,
    density_kg_m3: 2.4483177356641264,
    molecular_weight_kg_mol: 44.0095,
    enthalpy_kJ_kg: -96.0669464428917,
    entropy_kJ_kg_K: -0.39233336258119755,
    active: true,
    timestamp: "2025-09-26T19:15:07.548132"
  },
  stream_3: {
    stream_number: 3,
    custom_name: "CO2 Sink",
    temperature_K: 298.15,
    temperature_C: 25.0,
    pressure_Pa: 101325.001475328,
    pressure_bar: 1.01325001475328,
    mass_flow_kg_s: 3.014711104789161e-05,
    mass_flow_mg_s: 30.14711104789161,
    molar_flow_mol_s: 0.0006850137140365514,
    volumetric_flow_m3_s: 1.66666666666667e-05,
    density_kg_m3: 1.8088266628734928,
    molecular_weight_kg_mol: 44.0095,
    enthalpy_kJ_kg: -0.9476966777935648,
    entropy_kJ_kg_K: -0.0021313166589318634,
    active: true,
    timestamp: "2025-09-26T19:15:07.548404"
  },
  stream_4: {
    stream_number: 4,
    custom_name: "CH4 Inlet",
    temperature_K: 298.14982562087147,
    temperature_C: 24.99982562087149,
    pressure_Pa: 101290.48764520987,
    pressure_bar: 1.0129048764520987,
    mass_flow_kg_s: 1.0951979120607133e-05,
    mass_flow_mg_s: 10.951979120607133,
    molar_flow_mol_s: 0.0006826870143735521,
    volumetric_flow_m3_s: 1.6672347483564504e-05,
    density_kg_m3: 0.6568948452761991,
    molecular_weight_kg_mol: 16.04246,
    enthalpy_kJ_kg: -1.1461327371238315,
    entropy_kJ_kg_K: -0.002502336933443472,
    active: true,
    timestamp: "2025-09-26T19:15:07.548588"
  },
  stream_5: {
    stream_number: 5,
    custom_name: "CH4 Sink",
    temperature_K: 298.15,
    temperature_C: 25.0,
    pressure_Pa: 101325.000536472,
    pressure_bar: 1.01325000536472,
    mass_flow_kg_s: 1.0951979120607133e-05,
    mass_flow_mg_s: 10.951979120607133,
    molar_flow_mol_s: 0.0006826870143735521,
    volumetric_flow_m3_s: 1.66666666666667e-05,
    density_kg_m3: 0.6571187472364266,
    molecular_weight_kg_mol: 16.04246,
    enthalpy_kJ_kg: -1.146132726118704,
    entropy_kJ_kg_K: -0.002678494242719205,
    active: true,
    timestamp: "2025-09-26T19:15:07.548761"
  },
  stream_6: {
    stream_number: 6,
    custom_name: "R-Inlet",
    temperature_K: 238.96113689818398,
    temperature_C: -34.188863101816,
    pressure_Pa: 101290.48764520987,
    pressure_bar: 1.0129048764520987,
    mass_flow_kg_s: 4.1099090168498747e-05,
    mass_flow_mg_s: 41.09909016849875,
    molar_flow_mol_s: 0.0013677007284101036,
    volumetric_flow_m3_s: 2.664525542843033e-05,
    density_kg_m3: 1.5424543509778579,
    molecular_weight_kg_mol: 30.049768428707914,
    enthalpy_kJ_kg: -70.77268542949051,
    entropy_kJ_kg_K: -0.017705552171442786,
    active: true,
    timestamp: "2025-09-26T19:15:07.548942"
  }
};

// Updated Process Configuration - Improved PFD Layout with Better Spacing
const processConfig = {
  units: [
    { id: "InletStream1", type: "StreamController", x: 30, y: 40, width: 220, height: 110 },   // CO2 - Top inlet, more space
    { id: "InletStream2", type: "StreamController", x: 30, y: 280, width: 220, height: 110 },  // CH4 - Bottom inlet, more separation
    { id: "Mixer", type: "Mixer", x: 320, y: 180, width: 70, height: 70 },                     // Centered between inlets, larger
    { id: "Reactor", type: "Reactor", x: 450, y: 150, width: 130, height: 130 },               // Larger reactor
    { id: "Condenser", type: "Condenser", x: 640, y: 165, width: 110, height: 100 },           // Better positioned
    { id: "OutletStream", type: "OutletStream", x: 800, y: 160, width: 150, height: 120 },     // Larger, clearer outlet
  ],
  connections: [
    { 
      from: "InletStream1", 
      to: "Mixer", 
      color: "#3b82f6", 
      width: 3, 
      label: "CO₂ Feed",
      type: "diagonal-to-center"
    },
    { 
      from: "InletStream2", 
      to: "Mixer", 
      color: "#10b981", 
      width: 3, 
      label: "CH₄ Feed",
      type: "diagonal-to-center" 
    },
    { 
      from: "Mixer", 
      to: "Reactor", 
      color: "#14b8a6", 
      width: 4, 
      label: "Mixed Feed",
      type: "horizontal"
    },
    { 
      from: "Reactor", 
      to: "Condenser", 
      color: "#f59e0b", 
      width: 4, 
      label: "Hot Effluent",
      type: "horizontal"
    },
    { 
      from: "Condenser", 
      to: "OutletStream", 
      color: "#10b981", 
      width: 3, 
      label: "Outlet (Stream 6)",
      type: "horizontal"
    },
  ],
};

// Mock data for demonstration - Updated to match inlet streams
const mockStreamData = {
  InletStream1: {
    pv: 30.0, // mg/s
    temperature: 25,
    pressure: 1.0,
    gases: [{ name: "CO2", z: 1.0 }],
  },
  InletStream2: {
    pv: 11.0, // mg/s
    temperature: 25,
    pressure: 1.0,
    gases: [{ name: "CH4", z: 1.0 }],
  },
};

const mockKPIData = {
  ch4_conversion: 82.5,
  co2_conversion: 79.2,
  h2_co_ratio: 1.1,
  syngas_purity: 68.3,
};

export default function IndustrialDRMSimulation() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationData, setSimulationData] = useState({
    kpis: {
      ch4_conversion: 0,
      co2_conversion: 0,
      h2_co_ratio: 0,
      syngas_purity: 0
    }
  });
  const [activeTab, setActiveTab] = useState('streams');
  const [apiConnected, setApiConnected] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [dwsimApiUrl, setDwsimApiUrl] = useState("http://65.0.119.135:5000");
  const [selectedStream, setSelectedStream] = useState("stream_3"); // Default to Stream 3 (CO2 Sink)
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Simulation Parameters matching DWSIM API format - Using real DWSIM data as defaults
  const [simulationParams, setSimulationParams] = useState({
    inlet_modifications: {
      stream_1: {
        temperature_C: DWSIM_STREAM_DATA.stream_1.temperature_C,
        pressure_bar: DWSIM_STREAM_DATA.stream_1.pressure_bar
      },
      stream_3: {
        temperature_C: DWSIM_STREAM_DATA.stream_3.temperature_C,
        pressure_bar: DWSIM_STREAM_DATA.stream_3.pressure_bar,
        mass_flow_mg_s: DWSIM_STREAM_DATA.stream_3.mass_flow_mg_s
      },
      stream_4: {
        temperature_C: DWSIM_STREAM_DATA.stream_4.temperature_C,
        pressure_bar: DWSIM_STREAM_DATA.stream_4.pressure_bar,
        mass_flow_mg_s: DWSIM_STREAM_DATA.stream_4.mass_flow_mg_s
      }
    },
    output_streams: [1, 2, 6],
    include_all_streams: true
  });

  // Load saved parameters on component mount
  useEffect(() => {
    loadSimulationParams();
    checkApiHealth();
  }, [apiBaseUrl]);

  const saveSimulationParams = () => {
    try {
      const dataToSave = {
        simulationParams,
        dwsimApiUrl,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('dwsim_simulation_params', JSON.stringify(dataToSave));
      
      // Also provide JSON download option
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dwsim_params_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Parameters saved to localStorage and downloaded as JSON file!');
    } catch (error) {
      console.error('Error saving parameters:', error);
      alert('Error saving parameters');
    }
  };

  const loadSimulationParams = () => {
    try {
      const saved = localStorage.getItem('dwsim_simulation_params');
      if (saved) {
        const data = JSON.parse(saved);
        setSimulationParams(data.simulationParams || simulationParams);
        setDwsimApiUrl(data.dwsimApiUrl || dwsimApiUrl);
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setSimulationParams(data.simulationParams || data);
          setDwsimApiUrl(data.dwsimApiUrl || dwsimApiUrl);
          localStorage.setItem('dwsim_simulation_params', JSON.stringify(data));
          alert('Parameters loaded successfully!');
        } catch (error) {
          alert('Error loading file: Invalid JSON format');
        }
      };
      reader.readAsText(file);
    }
  };

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);
      if (response.ok) {
        setApiConnected(true);
        console.log("API connected successfully");
      } else {
        setApiConnected(false);
      }
    } catch (error) {
      setApiConnected(false);
      console.error("API connection failed:", error);
    }
  };

  const handleTestApi = async (quickTest = true) => {
    setIsTestingApi(true);
    
    try {
      const url = `${apiBaseUrl}/api/test-client?api_url=${encodeURIComponent(dwsimApiUrl)}&quick_test=${quickTest}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log("Successfully Connected");
          setApiConnected(true);
        } else {
          console.log("Connection Failed");
          setApiConnected(false);
        }
        
        // Add logs to the logs panel
        const newLogEntry = {
          timestamp: new Date().toLocaleString(),
          success: data.success,
          apiUrl: data.api_url,
          testType: data.test_type || (quickTest ? 'health_check' : 'full_examples'),
          logs: data.logs
        };
        
        setLogs(prevLogs => [...prevLogs, newLogEntry]);
        setShowLogs(true); // Auto-expand logs panel
        
        console.log("Test API Response:", data);
      } else {
        console.log("Connection Failed");
        setApiConnected(false);
        
        // Add error log
        const errorLogEntry = {
          timestamp: new Date().toLocaleString(),
          success: false,
          apiUrl: dwsimApiUrl,
          testType: 'error',
          logs: `HTTP Error ${response.status}: ${response.statusText}`
        };
        
        setLogs(prevLogs => [...prevLogs, errorLogEntry]);
        setShowLogs(true);
      }
    } catch (error) {
      console.log("Connection Failed");
      setApiConnected(false);
      
      // Add error log
      const errorLogEntry = {
        timestamp: new Date().toLocaleString(),
        success: false,
        apiUrl: dwsimApiUrl,
        testType: 'error',
        logs: `Network Error: ${error.message}`
      };
      
      setLogs(prevLogs => [...prevLogs, errorLogEntry]);
      setShowLogs(true);
      
      console.error("Test API error:", error);
    }
    
    setIsTestingApi(false);
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    
    try {
      console.log("Starting DWSIM simulation...");
      console.log("Payload:", JSON.stringify(simulationParams, null, 2));

      // Add log entry for simulation start
      const startLog = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: 'Starting DWSIM simulation...',
        details: simulationParams
      };
      setLogs(prev => [startLog, ...prev]);

      // Send simulation request to backend (which runs the Python script)
      const response = await fetch(`${DEFAULT_API_BASE_URL}/api/dwsim/simulation/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(simulationParams)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("DWSIM Simulation Response:", data);
        console.log("data.success:", data.success);
        console.log("data.database_summary:", data.database_summary);
        console.log("Full API Response (formatted):", JSON.stringify(data, null, 2));

        // Add log entry for simulation output
        const outputLog = {
          timestamp: new Date().toLocaleTimeString(),
          type: data.success ? 'success' : 'error',
          message: data.success ? 'Simulation completed successfully' : 'Simulation failed',
          details: data.output
        };
        setLogs(prev => [outputLog, ...prev]);

        // Process the response data using database_summary if available
        if (data.success && data.database_summary) {
          console.log("✅ Using database_summary path");
          const dbData = data.database_summary;
          
          const processedData = {
            success: data.success,
            simulation_id: data.simulation_id,
            timestamp: data.timestamp,
            output: data.output,
            error: data.error,
            // Use database summary for structured information
            summary: {
              total_streams: dbData.total_streams,
              active_streams: dbData.active_streams,
              active_stream_names: dbData.active_stream_names,
              modifications_count: dbData.modifications_count
            },
            modifications_applied: [`Modified ${dbData.modifications_count} parameters`],
            // Use results data if available, otherwise empty
            all_streams: data.results?.all_streams || {},
            kpis: calculateKPIs(data.results?.all_streams ? Object.values(data.results.all_streams) : []),
            raw_response: data // Store full response for logs
          };
          
          setSimulationData(processedData);
          
          // Add success log with database info
          const dbLog = {
            timestamp: new Date().toLocaleTimeString(),
            type: 'success',
            message: `Simulation complete - Total: ${dbData.total_streams}, Active: ${dbData.active_streams}`,
            details: `Active streams: ${dbData.active_stream_names.join(', ')}`
          };
          setLogs(prev => [dbLog, ...prev]);
          
        } else if (data.success) {
          console.log("⚠️ Using fallback path - database_summary missing");
          // Fallback for success case without database summary
          const processedData = {
            success: data.success,
            simulation_id: data.simulation_id,
            timestamp: data.timestamp,
            output: data.output,
            error: data.error,
            results: data.results,
            all_streams: data.results?.all_streams || {},
            modifications_applied: data.results?.modifications_applied || [],
            summary: data.results?.summary || {
              total_streams: 'Unknown',
              active_streams: 'Unknown',
              active_stream_names: [],
              modifications_count: 0
            },
            kpis: data.results ? calculateKPIs(Object.values(data.results.all_streams || {})) : {},
            raw_response: data
          };
          setSimulationData(processedData);
          
        } else {
          // Handle failure case
          const processedData = {
            success: data.success,
            simulation_id: data.simulation_id,
            timestamp: data.timestamp,
            output: data.output,
            error: data.error,
            results: data.results,
            all_streams: {},
            modifications_applied: [],
            summary: {
              total_streams: 'Failed',
              active_streams: 'Failed',
              active_stream_names: [],
              modifications_count: 0
            },
            kpis: {},
            raw_response: data
          };
          setSimulationData(processedData);
        }

        // Add to logs with detailed stream data
        let detailedLogs = `✅ Simulation completed successfully!\n\nModifications Applied:\n${data.modifications_applied?.join('\n') || 'None'}\n\nActive Streams: ${data.database_summary?.active_streams || 'Unknown'}\nTotal Streams: ${data.database_summary?.total_streams || 'Unknown'}`;
        
        // Add detailed stream information if available
        if (data.results && data.results.all_streams) {
          detailedLogs += '\n\n' + '='.repeat(60) + '\nDETAILED STREAM DATA\n' + '='.repeat(60);
          
          // Get stream name mapping from database_summary
          const streamMapping = data.database_summary?.stream_mapping || {};
          
          Object.entries(data.results.all_streams).forEach(([streamKey, streamData]) => {
            if (streamData && typeof streamData === 'object') {
              // Get the display name from database mapping
              const streamNum = streamData.stream_number;
              const displayName = streamMapping[streamNum]?.custom_name || streamMapping[streamNum]?.display_name || streamData.custom_name || 'Unknown';
              
              detailedLogs += `\n\n${streamKey.toUpperCase()} - ${displayName} (Stream ${streamData.stream_number})`;
              detailedLogs += `\n  Status: ${streamData.active ? 'ACTIVE' : 'INACTIVE'}`;
              detailedLogs += `\n  Temperature: ${streamData.temperature_C?.toFixed(2)} °C (${streamData.temperature_K?.toFixed(2)} K)`;
              detailedLogs += `\n  Pressure: ${streamData.pressure_bar?.toFixed(4)} bar (${streamData.pressure_Pa?.toFixed(2)} Pa)`;
              detailedLogs += `\n  Mass Flow: ${streamData.mass_flow_mg_s?.toFixed(4)} mg/s`;
              
              if (streamData.molar_flow_mol_s) {
                detailedLogs += `\n  Molar Flow: ${streamData.molar_flow_mol_s?.toFixed(6)} mol/s`;
              }
              if (streamData.density_kg_m3) {
                const density = streamData.density_kg_m3 === "infinite" ? "∞" : streamData.density_kg_m3.toFixed(4);
                detailedLogs += `\n  Density: ${density} kg/m³`;
              }
              if (streamData.molecular_weight_kg_mol) {
                detailedLogs += `\n  Molecular Weight: ${streamData.molecular_weight_kg_mol?.toFixed(4)} kg/mol`;
              }
              if (streamData.enthalpy_kJ_kg) {
                detailedLogs += `\n  Enthalpy: ${streamData.enthalpy_kJ_kg?.toFixed(2)} kJ/kg`;
              }
              if (streamData.entropy_kJ_kg_K) {
                detailedLogs += `\n  Entropy: ${streamData.entropy_kJ_kg_K?.toFixed(4)} kJ/(kg·K)`;
              }
            }
          });
        }
        
        // Add database summary details
        if (data.database_summary && data.database_summary.active_stream_names) {
          detailedLogs += '\n\n' + '='.repeat(60) + '\nACTIVE STREAM NAMES\n' + '='.repeat(60);
          detailedLogs += `\n${data.database_summary.active_stream_names.join(', ')}`;
        }
        
        const logEntry = {
          timestamp: new Date().toLocaleString(),
          success: true,
          apiUrl: dwsimApiUrl,
          testType: 'simulation',
          logs: detailedLogs
        };
        
        setLogs(prevLogs => [...prevLogs, logEntry]);
        setShowLogs(true);

      } else {
        const errorText = await response.text();
        console.error("Simulation failed:", response.status, errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // Use default error message if JSON parsing fails
        }

        setSimulationData({
          success: false,
          error: errorMessage,
          timestamp: new Date().toLocaleString(),
          raw_response: errorText
        });

        // Add error to logs
        const errorLogEntry = {
          timestamp: new Date().toLocaleString(),
          success: false,
          apiUrl: dwsimApiUrl,
          testType: 'simulation',
          logs: `❌ Simulation failed: ${errorMessage}\n\nResponse: ${errorText}`
        };
        
        setLogs(prevLogs => [...prevLogs, errorLogEntry]);
        setShowLogs(true);

        alert(`Simulation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Simulation error:", error);
      const errorMessage = `Network Error: ${error.message}`;
      
      setSimulationData({
        success: false,
        error: errorMessage,
        timestamp: new Date().toLocaleString()
      });

      // Add error to logs  
      const errorLogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        message: 'Network error during simulation',
        details: error.message
      };
      
      setLogs(prev => [errorLogEntry, ...prev]);
      setShowLogs(true);

      alert(`Simulation failed: ${errorMessage}`);
    }
    
    setIsRunning(false);
  };

  // Calculate KPIs from simulation output streams
  const calculateKPIs = (outputStreams) => {
    if (!outputStreams) {
      return {
        ch4_conversion: 0,
        co2_conversion: 0,
        h2_co_ratio: 0,
        syngas_purity: 0
      };
    }

    // Handle both object format (old) and array format (new database)
    const streams = Array.isArray(outputStreams) ? outputStreams : Object.values(outputStreams);
    
    if (streams.length === 0) {
      return {
        ch4_conversion: 0,
        co2_conversion: 0,
        h2_co_ratio: 0,
        syngas_purity: 0
      };
    }

    // Find specific streams for DRM calculations
    const activeStreams = streams.filter(stream => stream.active);
    
    // Simple KPI calculations based on available data
    // These are placeholder calculations - in a real scenario, these would be based on 
    // actual chemical analysis of the streams
    
    let ch4_conversion = 0;
    let co2_conversion = 0;
    let h2_co_ratio = 1.0;
    let syngas_purity = 0;
    
    if (activeStreams.length > 0) {
      // Calculate based on temperature and flow rates as proxies
      const avgTemp = activeStreams.reduce((sum, stream) => sum + (stream.temperature_C || 0), 0) / activeStreams.length;
      const totalFlow = activeStreams.reduce((sum, stream) => sum + (stream.mass_flow_mg_s || 0), 0);
      
      // Mock calculations based on typical DRM performance
      ch4_conversion = Math.min(95, Math.max(0, (avgTemp - 600) / 10)); // Higher temp = higher conversion
      co2_conversion = Math.min(90, Math.max(0, (avgTemp - 650) / 12));
      h2_co_ratio = 0.8 + (totalFlow / 1000); // Mock ratio based on flow
      syngas_purity = Math.min(85, Math.max(40, 40 + (avgTemp - 500) / 20));
    }

    return {
      ch4_conversion: Math.max(0, ch4_conversion),
      co2_conversion: Math.max(0, co2_conversion), 
      h2_co_ratio: Math.max(0, h2_co_ratio),
      syngas_purity: Math.max(0, syngas_purity)
    };
  };

  const updateSimulationParam = (path, value) => {
    setSimulationParams(prev => {
      const newParams = { ...prev };
      const keys = path.split('.');
      let current = newParams;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      // Handle array values for output_streams
      if (keys[keys.length - 1] === 'output_streams' && Array.isArray(value)) {
        current[keys[keys.length - 1]] = value;
      } else if (typeof value === 'boolean') {
        current[keys[keys.length - 1]] = value;
      } else {
        current[keys[keys.length - 1]] = parseFloat(value) || 0;
      }
      
      return newParams;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* API Configuration Panel */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center space-x-4 mb-3">
          <label className="text-sm font-medium">DWSIM API URL:</label>
          <input
            type="text"
            value={dwsimApiUrl}
            onChange={(e) => setDwsimApiUrl(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm w-64 focus:border-blue-500 focus:outline-none"
            placeholder="http://65.0.119.135:5000"
          />
          <button
            onClick={() => handleTestApi(true)}
            disabled={isTestingApi}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isTestingApi 
                ? 'bg-yellow-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isTestingApi ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Testing...</span>
              </div>
            ) : (
              'Test API'
            )}
          </button>
          <button
            onClick={() => handleTestApi(false)}
            disabled={isTestingApi}
            className={`px-2 py-1 rounded text-xs font-medium ${
              isTestingApi 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            Run Examples
          </button>
          {/* Status Badge */}
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            apiConnected 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {apiConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Save/Load Parameters Row */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-300">Parameters:</label>
          <button
            onClick={saveSimulationParams}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium"
          >
            💾 Save
          </button>
          <button
            onClick={loadSimulationParams}
            className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm font-medium"
          >
            📁 Load Saved
          </button>
          {/* Upload functionality removed for cleaner UI */}
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Panel - Stream Cards */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <StreamCardsPanel 
            streams={DWSIM_STREAM_DATA}
            selectedStream={selectedStream}
            onSelectStream={setSelectedStream}
          />
        </div>

        {/* Main Process Display */}
        <div className="flex-1 p-4">
          <div className="bg-gray-800 rounded-lg h-full relative overflow-auto border-2 border-gray-700">
            <div className="absolute top-4 left-4 text-sm font-medium text-teal-400">
              DRM Process Flow Diagram
            </div>
            
            {/* Process Diagram */}
            <div className="min-w-[1000px] min-h-[600px] h-full relative pt-12">
              <ProcessSchematicDiagram 
                config={processConfig} 
                isRunning={isRunning}
                simulationParams={simulationParams}
                simulationData={simulationData}
                onParamChange={updateSimulationParam}
              />
              
              {/* KPI Dashboard Overlay */}
              {simulationData?.success && (
                <div className="absolute top-16 right-4">
                  <KPIDashboard kpis={simulationData.kpis} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          
          {/* Navigation Tabs */}
          <div className="bg-gray-700 border-b border-gray-700">
            <div className="flex">
              {[
                { id: 'streams', label: 'Streams' },
                { id: 'process', label: 'Process' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-r border-gray-700 ${
                    activeTab === tab.id 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'streams' && (
              <StreamPropertiesPanel 
                selectedStream={selectedStream}
                streamData={DWSIM_STREAM_DATA[selectedStream]}
                simulationParams={simulationParams}
                onParamChange={updateSimulationParam}
              />
            )}
            
            {activeTab === 'process' && (
              <ProcessControlPanel 
                simulationParams={simulationParams}
                onParamChange={updateSimulationParam}
              />
            )}
          </div>

          {/* Run Simulation and View Results Buttons */}
          <div className="p-4 border-t border-gray-700 space-y-3">
            <button
              onClick={handleRunSimulation}
              disabled={isRunning || !apiConnected}
              className={`w-full py-3 px-4 rounded font-bold text-white ${
                isRunning 
                  ? 'bg-orange-500 cursor-not-allowed' 
                  : apiConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isRunning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>RUNNING...</span>
                </div>
              ) : (
                'RUN SIMULATION'
              )}
            </button>

            {/* View Results Button */}
            <button
              onClick={() => setShowResultsModal(true)}
              className="w-full mt-3 py-3 px-4 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              📊 VIEW RESULTS
            </button>
            
            {simulationData && (
              <div className="mt-2 text-xs text-emerald-400">
                Last run: {simulationData.timestamp}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Working Modal */}
      {showResultsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={() => setShowResultsModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-11/12 max-w-6xl max-h-5/6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">DRM Simulation Results</h2>
              <button 
                onClick={() => setShowResultsModal(false)}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto" style={{ maxHeight: '70vh' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KPIs */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">CH₄ Conversion</div>
                  <div className="text-4xl font-bold">75.5%</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">CO₂ Conversion</div>
                  <div className="text-4xl font-bold">72.3%</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">H₂/CO Ratio</div>
                  <div className="text-4xl font-bold">1.05</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Reactor Duty</div>
                  <div className="text-4xl font-bold">187.5</div>
                  <div className="text-sm opacity-90 mt-1">kW</div>
                </div>
              </div>

              {/* Stream Data */}
              <div className="mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Stream Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {simulationData?.all_streams && Object.entries(simulationData.all_streams).slice(0, 3).map(([key, stream]) => (
                    <div key={key} className="border-b border-gray-200 pb-2">
                      <div className="font-semibold text-gray-700">{key}: {stream.custom_name || 'Stream'}</div>
                      <div className="text-sm text-gray-600">
                        Temp: {stream.temperature_C?.toFixed(1)}°C | 
                        Pressure: {stream.pressure_bar?.toFixed(2)} bar | 
                        Flow: {stream.mass_flow_mg_s?.toFixed(2)} mg/s
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowResultsModal(false)}
                className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 flex justify-between items-center text-xs">
        <div className="flex space-x-6">
          <span className={`${isRunning ? 'text-orange-400' : 'text-green-400'}`}>
            System: {isRunning ? 'RUNNING' : 'READY'}
          </span>
          <span>Selected: {DWSIM_STREAM_DATA[selectedStream]?.custom_name || 'None'} (Stream {DWSIM_STREAM_DATA[selectedStream]?.stream_number})</span>
          <span>CO₂: {simulationParams.inlet_modifications.stream_3.mass_flow_mg_s} mg/s</span>
          <span>CH₄: {simulationParams.inlet_modifications.stream_4.mass_flow_mg_s} mg/s</span>
          {simulationData?.success && (
            <span className="text-teal-400">
              Last: {simulationData.kpis?.ch4_conversion?.toFixed(1) || 0}% CH₄ conv
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className={`${apiConnected ? 'text-green-400' : 'text-red-400'}`}>
            API: {apiConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-gray-400">
            DWSIM API Ready
          </div>
        </div>
      </div>

      {/* Logs Panel */}
      {logs.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="px-4 py-2">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center space-x-2 text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              <span>📋 API Test Logs ({logs.length})</span>
              <span className="text-xs">{showLogs ? '▼' : '▶'}</span>
            </button>
            
            {showLogs && (
              <div className="mt-3">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
                  >
                    Clear Logs
                  </button>
                </div>
                
                <div className="bg-gray-900 rounded border border-gray-600 max-h-80 overflow-y-auto">
                  {logs.slice().reverse().map((logEntry, index) => (
                    <div key={logs.length - 1 - index} className="border-b border-gray-700 last:border-b-0">
                      <div className="px-3 py-2 bg-gray-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            logEntry.success 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {logEntry.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            logEntry.testType === 'health_check' 
                              ? 'bg-blue-500/20 text-blue-400'
                              : logEntry.testType === 'full_examples'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {logEntry.testType === 'health_check' ? 'HEALTH' : 
                             logEntry.testType === 'full_examples' ? 'EXAMPLES' : 'ERROR'}
                          </span>
                          <span className="text-xs text-gray-400">{logEntry.timestamp}</span>
                          <span className="text-xs text-blue-400">→ {logEntry.apiUrl}</span>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">
                          {logEntry.logs}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Stream Cards Panel Component
function StreamCardsPanel({ streams, selectedStream, onSelectStream }) {
  const streamEntries = Object.entries(streams);

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-bold text-teal-400 mb-4">DWSIM Streams</h3>
      <div className="space-y-3">
        {streamEntries.map(([streamKey, streamData]) => (
          <div
            key={streamKey}
            onClick={() => onSelectStream(streamKey)}
            className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedStream === streamKey
                ? 'border-teal-400 bg-teal-400/10 shadow-lg shadow-teal-400/20'
                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-white text-sm">
                {streamData.custom_name}
              </div>
              <div className={`w-2 h-2 rounded-full ${
                streamData.active ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
            
            <div className="text-xs text-gray-300 mb-2 font-medium">
              Stream {streamData.stream_number}
            </div>
            
            <div className="space-y-1 text-xs text-gray-400">
              <div>Flow: {streamData.mass_flow_mg_s.toFixed(2)} mg/s</div>
              <div>Temp: {streamData.temperature_C.toFixed(1)}°C</div>
              <div>Press: {streamData.pressure_bar.toFixed(3)} bar</div>
            </div>
            
            {selectedStream === streamKey && (
              <div className="mt-2 text-xs text-teal-400">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Stream Properties Panel Component
function StreamPropertiesPanel({ selectedStream, streamData, simulationParams, onParamChange }) {
  if (!streamData) return null;

  const isEditable = selectedStream === 'stream_3' || selectedStream === 'stream_4';
  const streamKey = selectedStream.replace('stream_', '');

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-gray-600 pb-3">
        <h3 className="text-lg font-bold text-teal-400">Stream {streamData.stream_number}</h3>
        <div className="text-sm text-gray-300">{streamData.custom_name}</div>
        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2 ${
          streamData.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {streamData.active ? '● Active' : '● Inactive'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Temperature */}
        <div className="bg-gray-700 p-3 rounded">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Temperature</label>
          {isEditable ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications[selectedStream]?.temperature_C || streamData.temperature_C}
                onChange={(e) => onParamChange(`inlet_modifications.${selectedStream}.temperature_C`, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">°C</span>
            </div>
          ) : (
            <div className="text-white font-mono text-lg">
              {streamData.temperature_C.toFixed(2)} °C
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            ({streamData.temperature_K.toFixed(2)} K)
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-gray-700 p-3 rounded">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Pressure</label>
          {isEditable ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.001"
                value={simulationParams.inlet_modifications[selectedStream]?.pressure_bar || streamData.pressure_bar}
                onChange={(e) => onParamChange(`inlet_modifications.${selectedStream}.pressure_bar`, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">bar</span>
            </div>
          ) : (
            <div className="text-white font-mono text-lg">
              {streamData.pressure_bar.toFixed(4)} bar
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            ({streamData.pressure_Pa.toFixed(2)} Pa)
          </div>
        </div>

        {/* Mass Flow */}
        <div className="bg-gray-700 p-3 rounded">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Mass Flow Rate</label>
          {isEditable ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications[selectedStream]?.mass_flow_mg_s || streamData.mass_flow_mg_s}
                onChange={(e) => onParamChange(`inlet_modifications.${selectedStream}.mass_flow_mg_s`, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">mg/s</span>
            </div>
          ) : (
            <div className="text-white font-mono text-lg">
              {streamData.mass_flow_mg_s.toFixed(4)} mg/s
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            ({(streamData.mass_flow_kg_s * 1000).toExponential(3)} g/s)
          </div>
        </div>

        {/* Additional Properties (Read-only) */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Additional Properties</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-400">Molar Flow:</div>
              <div className="text-white font-mono">{streamData.molar_flow_mol_s.toFixed(6)} mol/s</div>
            </div>
            <div>
              <div className="text-gray-400">Density:</div>
              <div className="text-white font-mono">{streamData.density_kg_m3.toFixed(3)} kg/m³</div>
            </div>
            <div>
              <div className="text-gray-400">Mol Weight:</div>
              <div className="text-white font-mono">{streamData.molecular_weight_kg_mol.toFixed(3)} g/mol</div>
            </div>
            <div>
              <div className="text-gray-400">Enthalpy:</div>
              <div className="text-white font-mono">{streamData.enthalpy_kJ_kg.toFixed(2)} kJ/kg</div>
            </div>
          </div>
        </div>

        {!isEditable && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded p-3">
            <div className="text-sm text-blue-300">
              ℹ️ This stream is read-only. Only Streams 3 and 4 can be edited.
            </div>
          </div>
        )}

        {isEditable && (
          <div className="bg-green-500/20 border border-green-500/30 rounded p-3">
            <div className="text-sm text-green-300">
              ✏️ This stream is editable. Changes will be applied in simulation.
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
          <div>Last Updated: {new Date(streamData.timestamp).toLocaleString()}</div>
          <div>Stream UUID: {streamData.custom_name}</div>
        </div>
      </div>
    </div>
  );
}

// Outlet Stream Unit Component - Enhanced for Better Readability
function OutletStreamUnit({ unit, streamData }) {
  return (
    <div
      className="bg-green-500/20 border-2 border-green-400 rounded-xl flex flex-col relative shadow-xl shadow-green-500/30 backdrop-blur-sm"
      style={{
        width: `${unit.width}px`,
        height: `${unit.height}px`,
      }}
    >
      {/* Header */}
      <div className="bg-green-500/30 text-center py-2 rounded-t-lg border-b border-green-400/50">
        <div className="text-sm font-bold text-green-200">OUTLET STREAM</div>
        <div className="text-xs text-green-300">Stream {streamData.stream_number}</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-3 py-2 text-center space-y-3">
        <div className="bg-green-800/40 rounded-lg p-2">
          <div className="text-xs text-green-300 mb-1">Flow Rate</div>
          <div className="text-lg font-bold text-white">{streamData.mass_flow_mg_s.toFixed(2)}</div>
          <div className="text-xs text-green-300">mg/s</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-800/40 rounded p-2">
            <div className="text-green-300">Temp</div>
            <div className="font-bold text-white">{streamData.temperature_C.toFixed(1)}°C</div>
          </div>
          <div className="bg-green-800/40 rounded p-2">
            <div className="text-green-300">Press</div>
            <div className="font-bold text-white">{streamData.pressure_bar.toFixed(3)} bar</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-1 text-xs text-green-400 bg-green-500/20 rounded-b-lg">
        Main Product
      </div>
    </div>
  );
}

// Process Schematic Diagram Component
function ProcessSchematicDiagram({
  config,
  isRunning,
  simulationParams,
  simulationData,
  onParamChange,
}) {
  const getUnitById = (id) => config.units.find((unit) => unit.id === id);

  const getConnectionPoint = (unitId, side = "center") => {
    const unit = getUnitById(unitId);
    if (!unit) return { x: 0, y: 0 };

    const centerX = unit.x + unit.width / 2;
    const centerY = unit.y + unit.height / 2;

    switch (side) {
      case "right":
        return { x: unit.x + unit.width, y: centerY };
      case "left":
        return { x: unit.x, y: centerY };
      case "top":
        return { x: centerX, y: unit.y };
      case "bottom":
        return { x: centerX, y: unit.y + unit.height };
      default:
        return { x: centerX, y: centerY };
    }
  };

  const generateConnectionLines = () => {
    return config.connections.map((conn, index) => {
      const fromUnit = getUnitById(conn.from);
      const toUnit = getUnitById(conn.to);

      if (!fromUnit || !toUnit) return null;

      const fromCenter = getConnectionPoint(conn.from, "center");
      const toCenter = getConnectionPoint(conn.to, "center");
      
      let pathData = "";
      let fromPoint, toPoint;

      switch (conn.type) {
        case "diagonal-to-center":
          // Clean diagonal lines from inlet streams to mixer center
          if (conn.from === "InletStream1") {
            // Top inlet: exit from right-center, connect to top of mixer
            fromPoint = { x: fromUnit.x + fromUnit.width, y: fromUnit.y + fromUnit.height/2 };
            toPoint = { x: toUnit.x + toUnit.width/2, y: toUnit.y + toUnit.height/2 };
          } else if (conn.from === "InletStream2") {
            // Bottom inlet: exit from right-center, connect to bottom of mixer  
            fromPoint = { x: fromUnit.x + fromUnit.width, y: fromUnit.y + fromUnit.height/2 };
            toPoint = { x: toUnit.x + toUnit.width/2, y: toUnit.y + toUnit.height/2 };
          }
          
          // Create smooth diagonal path
          pathData = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
          break;

        case "horizontal":
          // Clean horizontal connections for main process flow
          fromPoint = { x: fromUnit.x + fromUnit.width, y: fromCenter.y };
          toPoint = { x: toUnit.x, y: toCenter.y };
          
          // Create horizontal path with slight curve if heights differ
          const heightDiff = Math.abs(fromPoint.y - toPoint.y);
          if (heightDiff < 5) {
            // Straight horizontal line
            pathData = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
          } else {
            // Smooth horizontal connection with vertical adjustment
            const midX = (fromPoint.x + toPoint.x) / 2;
            pathData = `M ${fromPoint.x} ${fromPoint.y} 
                       C ${midX} ${fromPoint.y}, ${midX} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`;
          }
          break;

        default:
          // Fallback to simple line
          fromPoint = getConnectionPoint(conn.from, "right");
          toPoint = getConnectionPoint(conn.to, "left");
          pathData = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
      }

      const labelX = (fromPoint.x + toPoint.x) / 2;
      const labelY = (fromPoint.y + toPoint.y) / 2 - 12;

      return (
        <g key={`connection-${index}`}>
          {/* Outer glow effect */}
          <path
            d={pathData}
            fill="none"
            stroke={conn.color}
            strokeWidth={conn.width + 2}
            opacity="0.3"
            filter="url(#pipeGlow)"
          />
          
          {/* Main pipe */}
          <path
            d={pathData}
            fill="none"
            stroke={conn.color}
            strokeWidth={conn.width}
            opacity="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Arrow head */}
          <polygon
            points={`${toPoint.x - 8},${toPoint.y - 4} ${toPoint.x - 8},${toPoint.y + 4} ${toPoint.x - 2},${toPoint.y}`}
            fill={conn.color}
            opacity="0.9"
          />
          
          {/* Pipe Label */}
          <text
            x={labelX}
            y={labelY}
            fill={conn.color}
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            className="font-mono drop-shadow-sm"
          >
            {conn.label}
          </text>
        </g>
      );
    }).filter(Boolean);
  };

  return (
    <div className="w-full h-full relative">
      {/* Process Units */}
      {config.units.map((unit) => (
        <div
          key={unit.id}
          className="absolute"
          style={{
            left: `${unit.x}px`,
            top: `${unit.y}px`,
          }}
        >
          <ProcessUnit
            unit={unit}
            isRunning={isRunning}
            simulationParams={simulationParams}
            onParamChange={onParamChange}
            simulationData={simulationData}
          />
        </div>
      ))}

      {/* Connection Lines */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      >
        <defs>
          {/* Enhanced glow effects for professional look */}
          <filter id="pipeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {generateConnectionLines()}
      </svg>
    </div>
  );
}

// Process Unit Component
function ProcessUnit({
  unit,
  isRunning,
  simulationParams,
  onParamChange,
  simulationData,
}) {
  switch (unit.type) {
    case "StreamController":
      return (
        <StreamControllerUnit
          id={unit.id}
          simulationParams={simulationParams}
          onParamChange={onParamChange}
        />
      );

    case "Mixer":
      return <MixerUnit unit={unit} />;

    case "Reactor":
      return <ReactorUnit unit={unit} isRunning={isRunning} />;

    case "Condenser":
      return <CondenserUnit unit={unit} />;

    case "OutletStream":
      return <OutletStreamUnit unit={unit} streamData={DWSIM_STREAM_DATA.stream_6} />;

    default:
      return <div>Unknown unit type: {unit.type}</div>;
  }
}

// Stream Controller Unit Component - Enhanced Readability
function StreamControllerUnit({ id, simulationParams, onParamChange }) {
  const streamInfo = {
    InletStream1: { label: "CO₂ Feed Stream", color: "bg-blue-500/20 border-blue-400", streamKey: "stream_3", titleColor: "text-blue-300" },
    InletStream2: { label: "CH₄ Feed Stream", color: "bg-green-500/20 border-green-400", streamKey: "stream_4", titleColor: "text-green-300" },
  };

  const info = streamInfo[id] || { label: "Inlet Stream", color: "bg-gray-500/20 border-gray-400", streamKey: "stream_1", titleColor: "text-gray-300" };
  const streamData = simulationParams.inlet_modifications[info.streamKey] || {};
  const defaultStreamData = DWSIM_STREAM_DATA[info.streamKey] || {};

  return (
    <div className={`${info.color} border-2 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden`}
         style={{ width: `${220}px`, height: `${110}px` }}>
      
      {/* Header */}
      <div className={`${info.color.replace('/20', '/30')} px-3 py-2 border-b border-current/30`}>
        <div className={`${info.titleColor} font-bold text-sm text-center`}>{info.label}</div>
        <div className="text-xs text-gray-300 text-center">DWSIM {info.streamKey}</div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Flow */}
          <div className="text-center">
            <div className="text-gray-300 mb-1">Flow</div>
            <input
              type="number"
              step="0.1"
              value={streamData.mass_flow_mg_s || defaultStreamData.mass_flow_mg_s || 0}
              onChange={(e) => onParamChange(`inlet_modifications.${info.streamKey}.mass_flow_mg_s`, e.target.value)}
              className="bg-gray-800/60 border border-gray-600 rounded px-1 py-1 text-white text-xs w-full focus:border-teal-400 focus:outline-none text-center"
            />
            <div className="text-gray-400 text-xs mt-1">mg/s</div>
          </div>

          {/* Temperature */}
          <div className="text-center">
            <div className="text-gray-300 mb-1">Temp</div>
            <input
              type="number"
              value={streamData.temperature_C || defaultStreamData.temperature_C || 25}
              onChange={(e) => onParamChange(`inlet_modifications.${info.streamKey}.temperature_C`, e.target.value)}
              className="bg-gray-800/60 border border-gray-600 rounded px-1 py-1 text-white text-xs w-full focus:border-teal-400 focus:outline-none text-center"
            />
            <div className="text-gray-400 text-xs mt-1">°C</div>
          </div>

          {/* Pressure */}
          <div className="text-center">
            <div className="text-gray-300 mb-1">Press</div>
            <input
              type="number"
              step="0.001"
              value={streamData.pressure_bar || defaultStreamData.pressure_bar || 1.0}
              onChange={(e) => onParamChange(`inlet_modifications.${info.streamKey}.pressure_bar`, e.target.value)}
              className="bg-gray-800/60 border border-gray-600 rounded px-1 py-1 text-white text-xs w-full focus:border-teal-400 focus:outline-none text-center"
            />
            <div className="text-gray-400 text-xs mt-1">bar</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mixer Unit Component - Enhanced
function MixerUnit({ unit }) {
  return (
    <div
      className="bg-purple-500/20 border-2 border-purple-400 rounded-full flex items-center justify-center relative shadow-xl shadow-purple-500/30 backdrop-blur-sm"
      style={{
        width: `${unit.width}px`,
        height: `${unit.height}px`,
      }}
    >
      <div className="text-white font-bold text-sm text-center">
        MIXER
      </div>
      
      {/* Visual mixing indicators */}
      <div className="absolute inset-2 border border-purple-300/40 rounded-full animate-pulse"></div>
      <div className="absolute inset-4 border border-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
}

// Reactor Unit Component - Enhanced
function ReactorUnit({ unit }) {
  return (
    <div
      className="bg-orange-500/20 border-2 border-orange-400 rounded-xl flex flex-col relative shadow-xl shadow-orange-500/30 backdrop-blur-sm"
      style={{
        width: `${unit.width}px`,
        height: `${unit.height}px`,
      }}
    >
      {/* Header */}
      <div className="bg-orange-500/30 text-center py-2 rounded-t-lg border-b border-orange-400/50">
        <div className="text-sm font-bold text-orange-200">DRM REACTOR</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-3 py-2">
        <div className="bg-orange-800/40 rounded-lg p-2 text-center mb-2">
          <div className="text-sm font-mono text-white">
            CH₄ + CO₂ → H₂ + CO
          </div>
        </div>
        
        <div className="text-xs text-orange-300 text-center">
          Dry Reforming Reaction
        </div>
      </div>

      {/* Footer with activity indicator */}
      <div className="bg-orange-500/20 rounded-b-lg py-1 flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
        </div>
      </div>
    </div>
  );
}

// Condenser Unit Component - Aligned and compact
function CondenserUnit({ unit }) {
  return (
    <div
      className="bg-cyan-500/20 border-2 border-cyan-400 rounded-lg flex flex-col items-center justify-center relative shadow-lg shadow-cyan-500/25"
      style={{
        width: `${unit.width}px`,
        height: `${unit.height}px`,
      }}
    >
      <div className="absolute top-1 text-xs font-bold text-cyan-300">
        CONDENSER
      </div>

      {/* Cooling coils visualization */}
      <div className="w-4/5 h-3/5 rounded bg-repeat flex items-center justify-center"
           style={{
             backgroundImage: 'repeating-linear-gradient(90deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.2) 2px, transparent 2px, transparent 6px)'
           }}>
        {/* Central cooling element */}
        <div className="w-1/2 h-1/2 border border-cyan-400/40 rounded bg-cyan-500/10"></div>
      </div>

      <div className="absolute bottom-1 text-xs text-cyan-300 opacity-80">
        Cooling
      </div>
    </div>
  );
}

// Flowmeter Group Unit Component - Professional alignment
function FlowmeterGroupUnit({ unit, simulationData }) {
  const flowmeters = [
    { id: "FM01", label: "S1", desc: "Hot Effluent", color: "bg-orange-500/20 border-orange-400 text-orange-300" },
    { id: "FM02", label: "S2", desc: "Cold Outlet", color: "bg-blue-500/20 border-blue-400 text-blue-300" },
    { id: "FM03", label: "S6", desc: "Syngas", color: "bg-green-500/20 border-green-400 text-green-300" },
  ];

  return (
    <div
      className="flex flex-col justify-center space-y-2"
      style={{
        width: `${unit.width}px`,
        height: `${unit.height}px`,
      }}
    >
      <div className="text-xs font-bold text-emerald-300 text-center mb-1">
        FLOWMETERS
      </div>
      {flowmeters.map((fm, index) => (
        <div
          key={fm.id}
          className={`${fm.color} border rounded p-1 text-center shadow-md transition-all duration-200 hover:shadow-lg`}
        >
          <div className="text-xs font-bold">{fm.id}</div>
          <div className="text-xs opacity-90">{fm.label}</div>
          <div className="text-xs opacity-70">{fm.desc}</div>
        </div>
      ))}
    </div>
  );
}

// Process Control Panel Component
function ProcessControlPanel({ simulationParams, onParamChange }) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold text-teal-400">Simulation Parameters</h3>
      
      <div className="space-y-4">
        {/* Reactor Conditions */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-semibold text-gray-300 mb-3">Reactor (Stream 1)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Temperature (°C)</label>
              <input
                type="number"
                value={simulationParams.inlet_modifications.stream_1.temperature_C || 850}
                onChange={(e) => onParamChange('inlet_modifications.stream_1.temperature_C', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Pressure (bar)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications.stream_1.pressure_bar || 1.0}
                onChange={(e) => onParamChange('inlet_modifications.stream_1.pressure_bar', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* CO2 Feed Stream */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-semibold text-gray-300 mb-3">CO₂ Feed (Stream 3)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400">Flow (mg/s)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications.stream_3.mass_flow_mg_s || 30}
                onChange={(e) => onParamChange('inlet_modifications.stream_3.mass_flow_mg_s', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Temperature (°C)</label>
              <input
                type="number"
                value={simulationParams.inlet_modifications.stream_3.temperature_C || 25}
                onChange={(e) => onParamChange('inlet_modifications.stream_3.temperature_C', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Pressure (bar)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications.stream_3.pressure_bar || 1.0}
                onChange={(e) => onParamChange('inlet_modifications.stream_3.pressure_bar', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* CH4 Feed Stream */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-semibold text-gray-300 mb-3">CH₄ Feed (Stream 4)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400">Flow (mg/s)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications.stream_4.mass_flow_mg_s || 11}
                onChange={(e) => onParamChange('inlet_modifications.stream_4.mass_flow_mg_s', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Temperature (°C)</label>
              <input
                type="number"
                value={simulationParams.inlet_modifications.stream_4.temperature_C || 25}
                onChange={(e) => onParamChange('inlet_modifications.stream_4.temperature_C', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Pressure (bar)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.inlet_modifications.stream_4.pressure_bar || 1.0}
                onChange={(e) => onParamChange('inlet_modifications.stream_4.pressure_bar', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Output Configuration */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-semibold text-gray-300 mb-3">Output Configuration</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Output Streams (comma-separated)</label>
              <input
                type="text"
                value={simulationParams.output_streams.join(', ')}
                onChange={(e) => {
                  const streams = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                  onParamChange('output_streams', streams);
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:border-purple-500 focus:outline-none"
                placeholder="6, 7"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include_all_streams"
                checked={simulationParams.include_all_streams}
                onChange={(e) => onParamChange('include_all_streams', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="include_all_streams" className="text-xs text-gray-400">
                Include all streams in response
              </label>
            </div>
          </div>
        </div>

        {/* JSON Payload Preview */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-semibold text-gray-300 mb-2">JSON Payload Preview</h4>
          <pre className="text-xs font-mono bg-gray-800 p-2 rounded overflow-x-auto text-gray-300 max-h-40 overflow-y-auto">
            {JSON.stringify(simulationParams, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Trends Panel Component
// KPI Dashboard Component - Real-time process metrics
function KPIDashboard({ kpis }) {
  if (!kpis) return null;

  const kpiItems = [
    { label: "CH₄ Conv.", value: kpis.ch4_conversion, unit: "%", color: "text-green-400", threshold: 75 },
    { label: "CO₂ Conv.", value: kpis.co2_conversion, unit: "%", color: "text-blue-400", threshold: 70 },
    { label: "H₂/CO", value: kpis.h2_co_ratio, unit: "", color: "text-purple-400", decimals: 2, threshold: 0.8 },
    { label: "Purity", value: kpis.syngas_purity, unit: "%", color: "text-orange-400", threshold: 60 }
  ];

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-4 shadow-xl">
      <div className="text-sm font-bold text-teal-300 mb-3 text-center">PROCESS KPIs</div>
      <div className="grid grid-cols-2 gap-3">
        {kpiItems.map((kpi, index) => (
          <div key={index} className="bg-gray-700/50 border border-gray-600 rounded p-2 text-center">
            <div className="text-xs text-gray-300 mb-1">{kpi.label}</div>
            <div className={`text-lg font-bold ${kpi.color}`}>
              {(kpi.value || 0).toFixed(kpi.decimals || 1)}{kpi.unit}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full transition-all duration-500 ${
                  (kpi.value || 0) >= kpi.threshold ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, ((kpi.value || 0) / (kpi.threshold * 1.5)) * 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Results Panel Component - Enhanced with full API response
function ResultsPanel({ simulationData, isRunning }) {
  const [showLogs, setShowLogs] = useState(false);

  if (isRunning) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-48">
        <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-teal-400 font-medium">Running Simulation...</div>
        <div className="text-xs text-gray-400 mt-2">Processing DWSIM model</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold text-purple-400">Simulation Results</h3>
      
      {simulationData ? (
        <div className="space-y-3">
          {/* Status */}
          <div className="bg-gray-700 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white">Status</div>
              <div className={`text-xs px-2 py-1 rounded ${
                simulationData.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {simulationData.success ? 'SUCCESS' : 'FAILED'}
              </div>
            </div>
            <div className="text-xs text-gray-300">{simulationData.timestamp}</div>
            {simulationData.flowsheet_name && (
              <div className="text-xs text-gray-400 mt-1">Model: {simulationData.flowsheet_name}</div>
            )}
          </div>

          {/* KPIs Summary */}
          {simulationData.kpis && (
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm font-medium text-blue-400 mb-2">Performance Metrics</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-300">
                  <span className="text-gray-400">CH₄ Conv:</span> {simulationData.kpis.ch4_conversion?.toFixed(1)}%
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">CO₂ Conv:</span> {simulationData.kpis.co2_conversion?.toFixed(1)}%
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">H₂/CO:</span> {simulationData.kpis.h2_co_ratio?.toFixed(2)}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Purity:</span> {simulationData.kpis.syngas_purity?.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* All Streams Data */}
          {simulationData.all_streams && Object.keys(simulationData.all_streams).length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-teal-400">Stream Details (All Streams)</div>
              {Object.entries(simulationData.all_streams).map(([streamKey, streamData]) => (
                <div key={streamKey} className="bg-gray-700 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white text-sm">
                      {streamData.custom_name} (Stream {streamData.stream_number})
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      streamData.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {streamData.active ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>
                  
                  {streamData.error ? (
                    <div className="text-red-400 text-xs">{streamData.error}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                      <div className="text-gray-300">
                        <span className="text-gray-400">Temp:</span> {streamData.temperature_C?.toFixed(2)}°C 
                        <span className="text-gray-500"> ({(streamData.temperature_C + 273.15)?.toFixed(1)}K)</span>
                      </div>
                      <div className="text-gray-300">
                        <span className="text-gray-400">Press:</span> {streamData.pressure_bar?.toFixed(4)} bar
                        <span className="text-gray-500"> ({(streamData.pressure_bar * 100000)?.toFixed(0)} Pa)</span>
                      </div>
                      <div className="text-gray-300">
                        <span className="text-gray-400">Flow:</span> {streamData.mass_flow_mg_s?.toFixed(4)} mg/s
                        <span className="text-gray-500"> ({(streamData.mass_flow_mg_s / 1000000)?.toExponential(2)} kg/s)</span>
                      </div>
                      {streamData.enthalpy_kJ_kg && (
                        <div className="text-gray-300">
                          <span className="text-gray-400">Enthalpy:</span> {streamData.enthalpy_kJ_kg?.toFixed(2)} kJ/kg
                        </div>
                      )}
                      {streamData.density_kg_m3 && (
                        <div className="text-gray-300">
                          <span className="text-gray-400">Density:</span> {
                            streamData.density_kg_m3 === "infinite" ? "∞" : streamData.density_kg_m3?.toFixed(4)
                          } kg/m³
                        </div>
                      )}
                      {streamData.molecular_weight_kg_mol && (
                        <div className="text-gray-300">
                          <span className="text-gray-400">MW:</span> {streamData.molecular_weight_kg_mol?.toFixed(4)} kg/mol
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {simulationData.summary && (
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm font-medium text-blue-400 mb-2">Simulation Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="text-gray-300">
                  <span className="text-gray-400">Total Streams:</span> {simulationData.summary.total_streams || 'Unknown'}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Active Streams:</span> {simulationData.summary.active_streams || 'Unknown'}
                </div>
                {simulationData.summary.active_stream_names && simulationData.summary.active_stream_names.length > 0 && (
                  <div className="col-span-2 text-gray-300">
                    <span className="text-gray-400">Active IDs:</span> {simulationData.summary.active_stream_names.join(', ')}
                  </div>
                )}
              </div>
              
              {/* Modifications Applied */}
              {simulationData.modifications_applied && simulationData.modifications_applied.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Modifications Applied:</div>
                  <div className="text-xs text-green-300">
                    {simulationData.modifications_applied.join(', ')}
                  </div>
                </div>
              )}
              
              {(!simulationData.modifications_applied || simulationData.modifications_applied.length === 0) && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400">Modifications Applied: None</div>
                </div>
              )}
            </div>
          )}

          {/* Modifications Applied */}
          {simulationData.modifications_applied && simulationData.modifications_applied.length > 0 && (
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm font-medium text-yellow-400 mb-2">Modifications Applied</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {simulationData.modifications_applied.map((mod, index) => (
                  <div key={index} className="text-xs text-gray-300">{mod}</div>
                ))}
              </div>
            </div>
          )}

          {/* Simulation Output */}
          {simulationData.output && (
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm font-medium text-cyan-400 mb-2">Simulation Console Output</div>
              <div className="bg-gray-800 p-3 rounded text-xs font-mono text-gray-300 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{simulationData.output}</pre>
              </div>
            </div>
          )}

          {/* Logs Section */}
          <div className="bg-gray-700 p-3 rounded">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              <span>Full API Response (Debug)</span>
              <span className="text-xs">{showLogs ? '▼' : '▶'}</span>
            </button>
            
            {showLogs && (
              <div className="mt-3 bg-gray-800 p-3 rounded text-xs font-mono text-gray-300 max-h-60 overflow-y-auto">
                <pre>{JSON.stringify(simulationData.raw_response, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Error Display */}
          {simulationData.error && (
            <div className="bg-red-500/20 border border-red-500/30 p-3 rounded">
              <div className="text-sm font-medium text-red-400 mb-1">Error</div>
              <div className="text-xs text-red-300">{simulationData.error}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">⚗️</div>
          <div>No simulation results yet</div>
          <div className="text-xs mt-2">Configure parameters and run simulation</div>
        </div>
      )}

    </div>
  );
}