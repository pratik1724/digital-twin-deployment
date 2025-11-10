"""Git deploy testing"""

import subprocess
import os
import platform
import sys
import hashlib
import time

def get_file_hash(file_path):
    """Calculates the SHA256 hash of a file to check for changes."""
    sha256_hash = hashlib.sha256()
    if not os.path.exists(file_path):
        return ""
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def run_command(command, working_directory):
    """Runs a command in a specified directory and returns the process."""
    print(f"Executing: {' '.join(command)} in {working_directory}")
    use_shell = platform.system() == "Windows"
    try:
        return subprocess.Popen(command, cwd=working_directory, shell=use_shell)
    except FileNotFoundError as e:
        print(f"ERROR: Could not execute command: {command[0]}")
        print(f"Details: {e}")
        sys.exit(1)

def ensure_backend_venv(backend_dir):
    """Ensures the backend virtual environment exists and has dependencies."""
    venv_dir = os.path.join(backend_dir, 'venv')
    requirements_path = os.path.join(backend_dir, 'requirements.txt')
    stamp_path = os.path.join(backend_dir, '.pip_hash')
    
    if platform.system() == "Windows":
        python_executable = os.path.join(venv_dir, "Scripts", "python.exe")
        uvicorn_executable = os.path.join(venv_dir, "Scripts", "uvicorn.exe")
    else:
        python_executable = os.path.join(venv_dir, "bin", "python3")
        uvicorn_executable = os.path.join(venv_dir, "bin", "uvicorn")

    # 1. Create venv if missing
    if not os.path.exists(python_executable):
        print(f"Creating virtual environment in {venv_dir}...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)

    # 2. Check and install requirements
    current_req_hash = get_file_hash(requirements_path)
    installed_req_hash = ""
    if os.path.exists(stamp_path):
        with open(stamp_path, 'r') as f:
            installed_req_hash = f.read().strip()

    # Force install if hash mismatches OR if uvicorn is missing despite a matching hash
    if current_req_hash != installed_req_hash or not os.path.exists(uvicorn_executable):
        print("Updating backend dependencies...")
        subprocess.run([python_executable, "-m", "pip", "install", "-r", "requirements.txt"], cwd=backend_dir, check=True)
        with open(stamp_path, 'w') as f:
            f.write(current_req_hash)
    else:
        print("Backend requirements are up to date.")
        
    return uvicorn_executable

def main():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')

    print("--- Starting Backend Setup ---")
    uvicorn_executable = ensure_backend_venv(backend_dir)

    # Start Backend
    backend_cmd = [uvicorn_executable, "server:app", "--reload", "--host", "0.0.0.0", "--port", "8001"]
    backend_process = run_command(backend_cmd, backend_dir)

    print("\n--- Starting Frontend Setup ---")
    # (Your existing frontend logic is fine, kept it simple here)
    if not os.path.exists(os.path.join(frontend_dir, 'node_modules')):
         print("Installing frontend dependencies...")
         subprocess.run(["npm", "install", "--legacy-peer-deps"], cwd=frontend_dir, check=True, shell=(platform.system() == "Windows"))
    
    # Use 'npm start' instead of 'yarn' to be more universal if yarn isn't installed
    frontend_cmd = ["npm", "start"]
    # If you PREFER yarn, change it back: frontend_cmd = ["yarn", "start"]
    frontend_process = run_command(frontend_cmd, frontend_dir)

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n--- Shutting down servers ---")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == "__main__":
    main()
