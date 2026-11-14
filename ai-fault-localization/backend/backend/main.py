from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ast

app = FastAPI(title="AI Fault Localization System")

# Allow the React frontend to connect with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

# Check the code for common problems
def find_code_issues(code):
    issues = []

    try:
        tree = ast.parse(code)
    except SyntaxError as error:
        return [{
            "type": "Syntax Error",
            "severity": "High",
            "line": error.lineno,
            "evidence": error.msg,
            "suggestion": "Check the syntax on this line."
        }]

    # Look through every part of the code
    for node in ast.walk(tree):

        # Find unsafe use of eval() and exec()
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in ["eval", "exec"]:
                    issues.append({
                        "type": "Unsafe Function",
                        "severity": "High",
                        "line": node.lineno,
                        "evidence": f"Use of {node.func.id}()",
                        "suggestion": "Avoid running dynamic code when possible."
                    })

        # Find except blocks that catch every error
        if isinstance(node, ast.ExceptHandler):
            if node.type is None:
                issues.append({
                    "type": "Bare Except",
                    "severity": "Medium",
                    "line": node.lineno,
                    "evidence": "An except block catches every exception.",
                    "suggestion": "Catch only the exceptions your code expects."
                })

        # Find lists, dictionaries, or sets used as default values
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for default in node.args.defaults:
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    issues.append({
                        "type": "Mutable Default Argument",
                        "severity": "Medium",
                        "line": default.lineno,
                        "evidence": f"Function '{node.name}' uses a mutable default.",
                        "suggestion": "Use None as the default and create the object inside the function."
                    })

    return issues


@app.get("/")
def home():
    return {
        "message": "AI Fault Localization System is running"
    }


@app.post("/analyze")
def analyze_code(request: CodeRequest):
    # Run the code checks
    issues = find_code_issues(request.code)

    # Send the results back to the frontend
    return {
        "status": "completed",
        "total_issues": len(issues),
        "faults": issues
    }
