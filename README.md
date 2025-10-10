# SMR Dashboard - Digital Twin Platform

SMR Dashboard - Digital Twin Platform
🌟 Overview
The SMR (Steam Methane Reforming) Dashboard is a comprehensive digital twin platform designed for real-time monitoring, advanced simulation, and AI-powered insights for industrial reactor operations. Built with a modern React frontend and a robust FastAPI backend, it offers a powerful and intuitive interface for engineers and operators.

This platform provides three distinct simulation types (CFD, Machine Learning, and First Order Principle), a real-time metrics dashboard with 25+ process variables, and an intelligent RAG-based assistant, SMR IntelliAssist, to answer complex questions about the SMR process.

🏗️ Architecture
The platform is built on a decoupled architecture, ensuring scalability and maintainability.

Frontend (React) → API Layer (FastAPI) → Simulation Engine (Python/Cantera) → Database (MongoDB)
                ↓
            Data Sources (CSV/AWS SiteWise) → Metrics Dashboard → 3D Visualization
Frontend: A responsive React application provides the user interface for data visualization and simulation control.

Backend: A FastAPI server handles API requests, user authentication, simulation orchestration, and communication with the database.

Simulation Engine: A Python-based engine, utilizing Cantera, performs First Order Principle simulations.

Database: MongoDB stores user data and simulation results.

RAG Assistant: A Retrieval-Augmented Generation system using ChromaDB provides intelligent assistance.

🚀 Key Features
1. Real-time Metrics Dashboard
Live Data Visualization: Displays over 25 critical process metrics, including inlet/outlet flowrates, temperatures, and pressures, with sparkline charts for trend analysis.

Interactive Details: Users can click on any metric to view a detailed modal with historical data and zoom/pan capabilities.

Data Integration: Seamlessly integrates with CSV files for historical data analysis, with a 6-hour data trend view.

2. Enhanced Simulation Console
The platform offers three distinct simulation types to cater to different analysis needs:

CFD Simulation: Provides Computational Fluid Dynamics modeling with interactive parameter inputs and a 3D visualization of the reactor geometry.

Machine Learning ANN Simulation: Demonstrates the integration of an Artificial Neural Network model for predictive analysis, complete with model accuracy and performance metrics.

First Order Principle Simulation: Utilizes a Cantera-based kinetic model for in-depth scientific simulations. Users can input various parameters and receive detailed results on conversions, yields, and outlet compositions.

3. SMR IntelliAssist (RAG Assistant)
AI-Powered Queries: An intelligent assistant that can answer complex questions about the SMR process, safety procedures, and operational guidelines.

Context-Aware Responses: Leverages a knowledge base of technical documents to provide accurate and contextually relevant answers.

Vector Search: Utilizes ChromaDB for efficient and accurate information retrieval.

4. 3D Digital Twin Visualization
Interactive 3D Model: Features an interactive 3D model of the SMR reactor (smr.glb).

Data Overlay: Allows for real-time data to be overlaid onto the 3D model for enhanced visualization and analysis.

🛠️ Technology Stack
Component	Technology
Frontend	React 18, React Router, Three.js, Tailwind CSS, Shadcn/UI
Backend	FastAPI, MongoDB, ChromaDB, Pydantic
Simulation & AI	Cantera, OpenAI/Anthropic, NumPy/Pandas, Sentence-Transformers
🚦 Getting Started
Follow these steps to get the SMR Dashboard up and running on your local machine.

Prerequisites
Node.js 18+

Python 3.9+

MongoDB

Docker (optional)

Installation
Clone the Repository

Bash

git clone <repository_url>
cd digital-twin-deployment
Backend Setup

Bash

cd backend
pip install -r requirements.txt
Frontend Setup

Bash

cd ../frontend
yarn install
Environment Configuration
Create a .env file in both the frontend and backend directories and add the following environment variables:

Backend (backend/.env):

MONGO_URL=mongodb://localhost:27017/
DB_NAME=digital_twin_db
Frontend (frontend/.env):

REACT_APP_BACKEND_URL=http://localhost:8001
Running the Application
Start the Backend Server

Bash

cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
Start the Frontend Application

Bash

cd frontend
yarn start
Alternatively, you can run the start.py script from the root directory to start both the backend and frontend concurrently:

Bash

python start.py
Access the Application

Frontend: http://localhost:3000

Backend API: http://localhost:8001/docs

Login: Use the default credentials:

Username: User

Password: India@12

📄 License
This project is developed for industrial digital twin applications. See the LICENSE file for details.
