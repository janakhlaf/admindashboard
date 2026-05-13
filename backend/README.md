Navigate to the backend directory : 
## cd backend
Create virtual environment : 
## python -m venv venv
Activate virtual environment :
## venv\Scripts\activate
Install all backend dependencies from requirements file:
## pip install -r requirements.txt
Install backend libraries :
## pip install fastapi uvicorn sqlalchemy psycopg[binary]
▶️ Run Backend:
## uvicorn main:app --reload

 ## ⚠️ VS Code Interpreter Issue
If FastAPI shows as not recognized, select the virtual environment manually:
- Open Command Palette (Ctrl + Shift + P)
- Select: Python: Select Interpreter
- Choose: backend/venv/Scripts/python.exe
This ensures VS Code uses the correct environment.
............
## cd backend
## venv\Scripts\activate
## uvicorn main:app --reload
.....................
📌 Required Libraries (must be installed):
## pip install python-dotenv==1.2.2
## pip install requests==2.33.1 
## pip install python-multipart==0.0.26
## pip install openai==2.32.0
## مهم: نعمل ال .env (على جهاز كل واحد يدوي منعطيهم الاكواد يلي عنا فيه)