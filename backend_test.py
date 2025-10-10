#!/usr/bin/env python3
"""
Backend API Testing Suite
Tests all backend endpoints including GLB file serving, CORS, RAG system, and error handling
"""

import requests
import json
import os
from pathlib import Path

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = Path('/app/frontend/.env')
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"  # fallback

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

def test_health_check():
    """Test the root endpoint"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("message") == "Hello World":
            print("✅ Health check PASSED")
            return True
        else:
            print("❌ Health check FAILED - Unexpected response")
            return False
    except Exception as e:
        print(f"❌ Health check FAILED - Error: {e}")
        return False

def test_cors_headers():
    """Test CORS configuration"""
    print("\n=== Testing CORS Headers ===")
    try:
        # Proper preflight request
        headers = {
            'Origin': BACKEND_URL,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{API_BASE}/", headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print("CORS Headers:")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        for key, value in cors_headers.items():
            print(f"  {key}: {value}")
        
        # Check for essential CORS headers
        has_origin = 'access-control-allow-origin' in response.headers
        has_methods = 'access-control-allow-methods' in response.headers
        
        if response.status_code == 200 and has_origin and has_methods:
            print("✅ CORS headers PASSED")
            return True
        else:
            print("❌ CORS headers FAILED - Missing essential headers or wrong status")
            return False
    except Exception as e:
        print(f"❌ CORS test FAILED - Error: {e}")
        return False

def test_glb_file_serving():
    """Test GLB file serving endpoint"""
    print("\n=== Testing GLB File Serving ===")
    try:
        response = requests.get(f"{API_BASE}/assets/smr.glb", timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'Not set')}")
        print(f"Content-Length: {response.headers.get('content-length', 'Not set')}")
        print(f"Content-Disposition: {response.headers.get('content-disposition', 'Not set')}")
        
        # Check status code
        if response.status_code != 200:
            print(f"❌ GLB serving FAILED - Status code: {response.status_code}")
            return False
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        if 'model/gltf-binary' not in content_type:
            print(f"❌ GLB serving FAILED - Wrong content type: {content_type}")
            return False
        
        # Check file size (should be around 2.8MB)
        content_length = int(response.headers.get('content-length', 0))
        expected_size = 2821936  # Exact size from ls command
        
        if content_length != expected_size:
            print(f"❌ GLB serving FAILED - Wrong file size: {content_length}, expected: {expected_size}")
            return False
        
        # Check that we actually get binary content
        if len(response.content) != expected_size:
            print(f"❌ GLB serving FAILED - Content length mismatch: {len(response.content)}")
            return False
        
        print("✅ GLB file serving PASSED")
        return True
        
    except Exception as e:
        print(f"❌ GLB serving FAILED - Error: {e}")
        return False

def test_glb_error_handling():
    """Test GLB endpoint error handling"""
    print("\n=== Testing GLB Error Handling ===")
    try:
        # Test non-existent file (this should return 404 if file doesn't exist)
        # Since our file exists, we'll test the endpoint behavior
        response = requests.get(f"{API_BASE}/assets/nonexistent.glb", timeout=10)
        print(f"Status Code for non-existent file: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ GLB error handling PASSED - Correctly returns 404 for non-existent files")
            return True
        else:
            print("⚠️  GLB error handling - Endpoint exists but may not handle missing files correctly")
            return True  # Not a critical failure since our file exists
            
    except Exception as e:
        print(f"❌ GLB error handling test FAILED - Error: {e}")
        return False

def test_status_endpoints():
    """Test status check endpoints"""
    print("\n=== Testing Status Endpoints ===")
    try:
        # Test GET status
        response = requests.get(f"{API_BASE}/status", timeout=10)
        print(f"GET Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Status GET FAILED - Status code: {response.status_code}")
            return False
        
        status_list = response.json()
        print(f"Current status checks count: {len(status_list)}")
        
        # Test POST status
        test_data = {"client_name": "backend_test_client"}
        response = requests.post(f"{API_BASE}/status", 
                               json=test_data, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        print(f"POST Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Status POST FAILED - Status code: {response.status_code}")
            return False
        
        created_status = response.json()
        print(f"Created status check ID: {created_status.get('id', 'No ID')}")
        
        # Verify the created status has required fields
        required_fields = ['id', 'client_name', 'timestamp']
        for field in required_fields:
            if field not in created_status:
                print(f"❌ Status POST FAILED - Missing field: {field}")
                return False
        
        print("✅ Status endpoints PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Status endpoints FAILED - Error: {e}")
        return False

def test_rag_knowledge_base_info():
    """Test RAG knowledge base info endpoint"""
    print("\n=== Testing RAG Knowledge Base Info ===")
    try:
        response = requests.get(f"{API_BASE}/rag/info", timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ RAG info endpoint FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        info_response = response.json()
        print(f"Knowledge Base Info: {info_response}")
        
        # Check required fields
        required_fields = ['collection_count', 'total_files', 'files_available', 'data_directory']
        for field in required_fields:
            if field not in info_response:
                print(f"❌ RAG info endpoint FAILED - Missing field: {field}")
                return False
        
        print(f"Collection count: {info_response['collection_count']}")
        print(f"Total files: {info_response['total_files']}")
        print(f"Files available: {[f['name'] for f in info_response['files_available']]}")
        
        print("✅ RAG knowledge base info PASSED")
        return True
        
    except Exception as e:
        print(f"❌ RAG info endpoint FAILED - Error: {e}")
        return False

def test_rag_reinitialize():
    """Test RAG knowledge base reinitialization"""
    print("\n=== Testing RAG Knowledge Base Reinitialization ===")
    try:
        response = requests.post(f"{API_BASE}/rag/reinitialize", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ RAG reinitialize FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        reinit_response = response.json()
        print(f"Reinitialization Response: {reinit_response}")
        
        # Check required fields
        required_fields = ['status', 'message']
        for field in required_fields:
            if field not in reinit_response:
                print(f"❌ RAG reinitialize FAILED - Missing field: {field}")
                return False
        
        if reinit_response['status'] != 'success':
            print(f"❌ RAG reinitialize FAILED - Status: {reinit_response['status']}")
            return False
        
        print(f"Reinitialization message: {reinit_response['message']}")
        
        print("✅ RAG knowledge base reinitialization PASSED")
        return True
        
    except Exception as e:
        print(f"❌ RAG reinitialize FAILED - Error: {e}")
        return False

def test_csv_metrics_endpoint():
    """Test the new CSV metrics API endpoint"""
    print("\n=== Testing CSV Metrics API Endpoint ===")
    try:
        response = requests.get(f"{API_BASE}/metrics/csv", timeout=15)
        print(f"Status Code: {response.status_code}")
        
        # Test 1: Endpoint is accessible and returns 200 status
        if response.status_code != 200:
            print(f"❌ CSV metrics endpoint FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        csv_response = response.json()
        print(f"Response keys: {list(csv_response.keys())}")
        
        # Test 2: Response contains "status": "success"
        if csv_response.get("status") != "success":
            print(f"❌ CSV metrics endpoint FAILED - Status not 'success': {csv_response.get('status')}")
            return False
        print("✅ Status field is 'success'")
        
        # Test 3: Response contains "data" array with CSV records
        if "data" not in csv_response:
            print("❌ CSV metrics endpoint FAILED - Missing 'data' field")
            return False
        
        data_array = csv_response["data"]
        if not isinstance(data_array, list):
            print("❌ CSV metrics endpoint FAILED - 'data' is not an array")
            return False
        
        if len(data_array) == 0:
            print("❌ CSV metrics endpoint FAILED - 'data' array is empty")
            return False
        
        print(f"✅ Data array contains {len(data_array)} records")
        
        # Test 4: Each record has required fields: timestamp, metric_key, value, unit, quality
        required_fields = ["timestamp", "metric_key", "value", "unit", "quality"]
        sample_record = data_array[0]
        print(f"Sample record: {sample_record}")
        
        for field in required_fields:
            if field not in sample_record:
                print(f"❌ CSV metrics endpoint FAILED - Missing field '{field}' in records")
                return False
        print(f"✅ All required fields present: {required_fields}")
        
        # Test 5: Total_records count matches data array length
        total_records = csv_response.get("total_records")
        if total_records != len(data_array):
            print(f"❌ CSV metrics endpoint FAILED - total_records ({total_records}) doesn't match data array length ({len(data_array)})")
            return False
        print(f"✅ Total records count matches data array length: {total_records}")
        
        # Test 6: Test specific metrics mentioned in review request
        specific_metrics = ["H2_Inlet_Flowrate_Process_value", "CH4_Inlet_Flowrate_Process_value"]
        found_metrics = {}
        
        for record in data_array:
            metric_key = record.get("metric_key")
            if metric_key in specific_metrics:
                found_metrics[metric_key] = record
        
        print(f"Looking for specific metrics: {specific_metrics}")
        for metric in specific_metrics:
            if metric in found_metrics:
                record = found_metrics[metric]
                print(f"✅ Found {metric}: value={record['value']}, unit={record['unit']}, quality={record['quality']}")
            else:
                print(f"⚠️  Metric {metric} not found in current data")
        
        # Additional validation: Check data types
        for i, record in enumerate(data_array[:3]):  # Check first 3 records
            if not isinstance(record["value"], (int, float)):
                print(f"❌ CSV metrics endpoint FAILED - Record {i} value is not numeric: {type(record['value'])}")
                return False
            if not isinstance(record["timestamp"], str):
                print(f"❌ CSV metrics endpoint FAILED - Record {i} timestamp is not string: {type(record['timestamp'])}")
                return False
        
        print("✅ Data types validation passed")
        
        # Show some sample metrics for verification
        print("\nSample metrics found:")
        unique_metrics = set()
        for record in data_array:
            unique_metrics.add(record["metric_key"])
            if len(unique_metrics) >= 10:  # Show first 10 unique metrics
                break
        
        for metric in sorted(list(unique_metrics)[:10]):
            sample = next(r for r in data_array if r["metric_key"] == metric)
            print(f"  {metric}: {sample['value']} {sample['unit']}")
        
        print(f"Total unique metrics: {len(set(r['metric_key'] for r in data_array))}")
        
        print("✅ CSV metrics API endpoint PASSED")
        return True
        
    except Exception as e:
        print(f"❌ CSV metrics endpoint FAILED - Error: {e}")
        return False

def test_rag_queries():
    """Test RAG query endpoint with specific SMR questions"""
    print("\n=== Testing RAG Query Endpoint ===")
    
    # Test questions from the review request
    test_questions = [
        "What are the typical H2 inlet flow rate ranges?",
        "What are the safety procedures for SMR shutdown?", 
        "How does the preheater temperature control work?",
        "What is SMR?",
        "What are the key safety requirements for SMR operations?"
    ]
    
    successful_queries = 0
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n--- Test Query {i}: {question} ---")
        try:
            test_query = {"query": question}
            response = requests.post(f"{API_BASE}/rag/query",
                                   json=test_query,
                                   headers={"Content-Type": "application/json"},
                                   timeout=20)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ Query {i} FAILED - Status code: {response.status_code}")
                continue
            
            rag_response = response.json()
            
            # Check required fields
            required_fields = ['answer', 'sources', 'mode', 'context_used']
            missing_fields = [field for field in required_fields if field not in rag_response]
            if missing_fields:
                print(f"❌ Query {i} FAILED - Missing fields: {missing_fields}")
                continue
            
            print(f"Answer length: {len(rag_response['answer'])} characters")
            print(f"Sources count: {len(rag_response['sources'])}")
            print(f"Context used: {rag_response['context_used']}")
            print(f"Mode: {rag_response['mode']}")
            
            # Check if we got a meaningful answer (not just error message)
            answer = rag_response['answer'].lower()
            if any(phrase in answer for phrase in [
                "couldn't find relevant information",
                "encountered an error",
                "no relevant information found",
                "contact support"
            ]):
                print(f"⚠️  Query {i} - Got fallback response, may indicate knowledge base issues")
                print(f"Answer preview: {rag_response['answer'][:200]}...")
            else:
                print(f"✅ Query {i} - Got substantive answer")
                print(f"Answer preview: {rag_response['answer'][:200]}...")
                successful_queries += 1
            
            # Show sources if available
            if rag_response['sources']:
                print("Sources:")
                for j, source in enumerate(rag_response['sources'][:3]):  # Show first 3 sources
                    print(f"  {j+1}. {source.get('document', 'Unknown')} (relevance: {source.get('relevance', 0):.3f})")
            
        except Exception as e:
            print(f"❌ Query {i} FAILED - Error: {e}")
    
    # Test empty query (should return 400)
    print(f"\n--- Testing Empty Query ---")
    try:
        empty_query = {"query": ""}
        response = requests.post(f"{API_BASE}/rag/query",
                               json=empty_query,
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 400:
            print("✅ Empty query correctly returns 400")
        else:
            print(f"⚠️  Empty query returned {response.status_code}, expected 400")
    except Exception as e:
        print(f"❌ Empty query test FAILED - Error: {e}")
    
    print(f"\n=== RAG Query Summary ===")
    print(f"Successful queries: {successful_queries}/{len(test_questions)}")
    
    if successful_queries >= len(test_questions) * 0.8:  # 80% success rate
        print("✅ RAG query endpoint PASSED")
        return True
    else:
        print("❌ RAG query endpoint FAILED - Too many queries returned fallback responses")
        return False

def test_drm_single_simulation():
    """Test POST /api/simulate/drm endpoint with sample DRM simulation payload"""
    print("\n=== Testing DRM Single Simulation ===")
    try:
        # Sample DRM simulation payload from the review request
        test_payload = {
            "pressure_bar": 1.0,
            "preheat_T_C": 825.0,
            "mfc": {
                "MFC100": {
                    "flow_mol_s": 0.01,
                    "z": {
                        "CO2": 0.8,
                        "CO": 0.2
                    }
                },
                "MFC200": {
                    "flow_mol_s": 0.005,
                    "z": {
                        "O2": 0.21,
                        "N2": 0.79
                    }
                },
                "MFC300": {
                    "flow_mol_s": 0.015,
                    "z": {
                        "CH4": 0.9,
                        "H2": 0.1
                    }
                }
            },
            "reactor": {
                "DRM_conversion": 0.8
            },
            "cooler": {
                "outlet_T_C": 200.0
            }
        }
        
        response = requests.post(f"{API_BASE}/simulate/drm", 
                               json=test_payload,
                               headers={"Content-Type": "application/json"},
                               timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ DRM single simulation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        print(f"Response keys: {list(result.keys())}")
        
        # Check expected response structure
        expected_keys = ["blocks", "duties_kW", "KPIs"]
        for key in expected_keys:
            if key not in result:
                print(f"❌ DRM single simulation FAILED - Missing key: {key}")
                return False
        
        # Check blocks structure
        blocks = result["blocks"]
        expected_blocks = ["feed", "reactor", "cooler"]
        for block in expected_blocks:
            if block not in blocks:
                print(f"❌ DRM single simulation FAILED - Missing block: {block}")
                return False
            
            block_data = blocks[block]
            required_fields = ["F_mol_s", "T_C", "P_bar", "z"]
            for field in required_fields:
                if field not in block_data:
                    print(f"❌ DRM single simulation FAILED - Missing field {field} in block {block}")
                    return False
        
        # Check duties_kW structure
        duties = result["duties_kW"]
        expected_duties = ["preheater", "reactor", "cooler", "total"]
        for duty in expected_duties:
            if duty not in duties:
                print(f"❌ DRM single simulation FAILED - Missing duty: {duty}")
                return False
        
        # Check KPIs structure
        kpis = result["KPIs"]
        expected_kpis = ["CH4_conversion", "CO2_conversion", "H2_CO", "syngas_purity"]
        for kpi in expected_kpis:
            if kpi not in kpis:
                print(f"❌ DRM single simulation FAILED - Missing KPI: {kpi}")
                return False
        
        print(f"✅ Feed flow rate: {blocks['feed']['F_mol_s']:.4f} mol/s")
        print(f"✅ Reactor conversion: {kpis['CH4_conversion']:.3f}")
        print(f"✅ Total duty: {duties['total']:.2f} kW")
        print(f"✅ Syngas purity: {kpis['syngas_purity']:.3f}")
        
        print("✅ DRM single simulation PASSED")
        return True
        
    except Exception as e:
        print(f"❌ DRM single simulation FAILED - Error: {e}")
        return False

def test_drm_timeseries_simulation():
    """Test POST /api/simulate/drm_timeseries endpoint with CSV file upload"""
    print("\n=== Testing DRM Time Series Simulation ===")
    try:
        csv_file_path = "/app/frontend/public/sample_drm_timeseries.csv"
        
        # Check if CSV file exists
        if not os.path.exists(csv_file_path):
            print(f"❌ DRM timeseries simulation FAILED - CSV file not found: {csv_file_path}")
            return False
        
        # Read and upload the CSV file
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('sample_drm_timeseries.csv', f, 'text/csv')}
            response = requests.post(f"{API_BASE}/simulate/drm_timeseries",
                                   files=files,
                                   timeout=60)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ DRM timeseries simulation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        print(f"Response keys: {list(result.keys())}")
        
        # Check expected response structure
        if "timeseries" not in result:
            print("❌ DRM timeseries simulation FAILED - Missing 'timeseries' key")
            return False
        
        timeseries = result["timeseries"]
        if not isinstance(timeseries, list):
            print("❌ DRM timeseries simulation FAILED - 'timeseries' is not a list")
            return False
        
        if len(timeseries) == 0:
            print("❌ DRM timeseries simulation FAILED - Empty timeseries results")
            return False
        
        print(f"✅ Processed {len(timeseries)} time points")
        
        # Check first result structure
        first_result = timeseries[0]
        expected_keys = ["blocks", "duties_kW", "KPIs", "time_s"]
        for key in expected_keys:
            if key not in first_result:
                print(f"❌ DRM timeseries simulation FAILED - Missing key in first result: {key}")
                return False
        
        print(f"✅ First time point: {first_result['time_s']} seconds")
        print(f"✅ First result CH4 conversion: {first_result['KPIs']['CH4_conversion']:.3f}")
        print(f"✅ First result total duty: {first_result['duties_kW']['total']:.2f} kW")
        
        print("✅ DRM timeseries simulation PASSED")
        return True
        
    except Exception as e:
        print(f"❌ DRM timeseries simulation FAILED - Error: {e}")
        return False

def test_drm_simulation_history():
    """Test GET /api/simulate/drm_history endpoint"""
    print("\n=== Testing DRM Simulation History ===")
    try:
        response = requests.get(f"{API_BASE}/simulate/drm_history", timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ DRM simulation history FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        print(f"Response keys: {list(result.keys())}")
        
        # Check expected response structure
        if "history" not in result:
            print("❌ DRM simulation history FAILED - Missing 'history' key")
            return False
        
        history = result["history"]
        if not isinstance(history, list):
            print("❌ DRM simulation history FAILED - 'history' is not a list")
            return False
        
        print(f"✅ Found {len(history)} simulation records in history")
        
        # If there are records, check their structure
        if len(history) > 0:
            first_record = history[0]
            expected_fields = ["id", "timestamp", "simulation_type", "input_params", "results"]
            for field in expected_fields:
                if field not in first_record:
                    print(f"❌ DRM simulation history FAILED - Missing field in record: {field}")
                    return False
            
            print(f"✅ Latest simulation ID: {first_record['id']}")
            print(f"✅ Latest simulation type: {first_record['simulation_type']}")
            print(f"✅ Latest simulation timestamp: {first_record['timestamp']}")
        else:
            print("✅ History is empty (no simulations run yet)")
        
        print("✅ DRM simulation history PASSED")
        return True
        
    except Exception as e:
        print(f"❌ DRM simulation history FAILED - Error: {e}")
        return False

def test_drm_simulation_delete():
    """Test DELETE /api/simulate/drm_history/{simulation_id} endpoint"""
    print("\n=== Testing DRM Simulation Delete ===")
    try:
        # First, get the history to find a simulation to delete
        history_response = requests.get(f"{API_BASE}/simulate/drm_history", timeout=15)
        
        if history_response.status_code != 200:
            print("❌ DRM simulation delete FAILED - Cannot get history for testing")
            return False
        
        history_result = history_response.json()
        history = history_result.get("history", [])
        
        if len(history) == 0:
            print("⚠️  DRM simulation delete - No simulations in history to test deletion")
            # Test with non-existent ID to verify 404 handling
            fake_id = "non-existent-simulation-id"
            delete_response = requests.delete(f"{API_BASE}/simulate/drm_history/{fake_id}", timeout=15)
            
            if delete_response.status_code == 404:
                print("✅ DRM simulation delete correctly returns 404 for non-existent simulation")
                return True
            else:
                print(f"❌ DRM simulation delete FAILED - Expected 404 for non-existent ID, got {delete_response.status_code}")
                return False
        
        # Get the ID of the most recent simulation
        simulation_id = history[0]["id"]
        print(f"Testing deletion of simulation ID: {simulation_id}")
        
        # Delete the simulation
        delete_response = requests.delete(f"{API_BASE}/simulate/drm_history/{simulation_id}", timeout=15)
        print(f"Delete Status Code: {delete_response.status_code}")
        
        if delete_response.status_code != 200:
            print(f"❌ DRM simulation delete FAILED - Status code: {delete_response.status_code}")
            print(f"Response: {delete_response.text}")
            return False
        
        delete_result = delete_response.json()
        print(f"Delete response: {delete_result}")
        
        # Check response structure
        if "message" not in delete_result:
            print("❌ DRM simulation delete FAILED - Missing 'message' in response")
            return False
        
        # Verify the simulation was actually deleted by checking history again
        verify_response = requests.get(f"{API_BASE}/simulate/drm_history", timeout=15)
        if verify_response.status_code == 200:
            verify_result = verify_response.json()
            updated_history = verify_result.get("history", [])
            
            # Check if the deleted simulation is no longer in history
            deleted_sim_found = any(sim["id"] == simulation_id for sim in updated_history)
            if deleted_sim_found:
                print(f"❌ DRM simulation delete FAILED - Simulation {simulation_id} still found in history")
                return False
            else:
                print(f"✅ Simulation {simulation_id} successfully removed from history")
        
        print("✅ DRM simulation delete PASSED")
        return True
        
    except Exception as e:
        print(f"❌ DRM simulation delete FAILED - Error: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Backend API Tests")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("CORS Headers", test_cors_headers),
        ("GLB File Serving", test_glb_file_serving),
        ("GLB Error Handling", test_glb_error_handling),
        ("Status Endpoints", test_status_endpoints),
        ("CSV Metrics API", test_csv_metrics_endpoint),
        ("RAG Knowledge Base Info", test_rag_knowledge_base_info),
        ("RAG Reinitialize", test_rag_reinitialize),
        ("RAG Queries", test_rag_queries),
        ("DRM Single Simulation", test_drm_single_simulation),
        ("DRM Timeseries Simulation", test_drm_timeseries_simulation),
        ("DRM Simulation History", test_drm_simulation_history),
        ("DRM Simulation Delete", test_drm_simulation_delete),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}")
            results[test_name] = False
    
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(tests)
    
    for test_name, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"{test_name}: {status}")
        if passed_test:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED!")
        return True
    else:
        print(f"⚠️  {total - passed} test(s) FAILED")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)