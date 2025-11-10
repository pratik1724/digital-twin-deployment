"""Git deploy testing"""

import subprocess
import os
import platform
import sys
import hashlib

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
    return subprocess.Popen(command, cwd=working_directory, shell=use_shell)

def main():
    """
    Main function to set up environment, install dependencies if needed, and start servers.
    """
    # --- Backend Setup ---
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    venv_dir = os.path.join(backend_dir, 'venv')
    requirements_path = os.path.join(backend_dir, 'requirements.txt')
    stamp_path = os.path.join(backend_dir, '.pip_hash')
    print("--- Starting Backend Setup ---")

    # Create a virtual environment if it doesn't exist
    if not os.path.exists(venv_dir):
        print(f"Creating virtual environment in {venv_dir}")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)

    # Determine the python executable path within the venv
    python_executable = os.path.join(venv_dir, "Scripts", "python.exe") if platform.system() == "Windows" else os.path.join(venv_dir, "bin", "python")

    # Check if backend dependencies need to be installed
    current_req_hash = get_file_hash(requirements_path)
    installed_req_hash = ""
    if os.path.exists(stamp_path):
        with open(stamp_path, 'r') as f:
            installed_req_hash = f.read().strip()

    if current_req_hash != installed_req_hash:
        print("New or updated backend requirements detected. Installing...")
        pip_install_command = [python_executable, "-m", "pip", "install", "-r", "requirements.txt"]
        subprocess.run(pip_install_command, cwd=backend_dir, check=True)
        with open(stamp_path, 'w') as f:
            f.write(current_req_hash)
    else:
        print("Backend requirements are already up to date.")

    # Start the backend server
    uvicorn_executable = os.path.join(venv_dir, "Scripts", "uvicorn.exe") if platform.system() == "Windows" else os.path.join(venv_dir, "bin", "uvicorn")
    backend_command = [uvicorn_executable, "server:app", "--reload", "--host", "0.0.0.0", "--port", "8001"]
    backend_process = run_command(backend_command, backend_dir)

    # --- Frontend Setup ---
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    node_modules_path = os.path.join(frontend_dir, 'node_modules')
    print("\n--- Starting Frontend Setup ---")

    # Install frontend dependencies only if node_modules folder is missing
    if not os.path.exists(node_modules_path):
        print("Node modules not found. Installing frontend dependencies...")
        yarn_install_command = ["yarn", "install"]
        subprocess.run(yarn_install_command, cwd=frontend_dir, check=True, shell=platform.system() == "Windows")
    else:
        print("Frontend dependencies already installed.")

    # Start the frontend server
    frontend_command = ["yarn", "start"]
    frontend_process = run_command(frontend_command, frontend_dir)

    # Keep the script running and wait for processes to exit
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n--- Shutting down servers ---")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == "__main__":
    main()
