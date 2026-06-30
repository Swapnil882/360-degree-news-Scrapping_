# How to Run 360 News Report

## First-Time Setup

```powershell
# 1. Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r backend\requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..
```

## Run

### Option 1 — One command (recommended)

```powershell
.\run.ps1
```

### Option 2 — Individual terminals

**Terminal 1 — Backend**

```powershell
.\venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

**Terminal 2 — Frontend**

```powershell
cd frontend
npm run dev
```

### Option 3 — Background jobs (stays in same terminal)

```powershell
.\venv\Scripts\Activate.ps1
Start-Job -Name "backend" -ScriptBlock { cd backend; uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload }
Start-Job -Name "frontend" -ScriptBlock { cd frontend; npm run dev }
```

## URLs

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| API docs | http://127.0.0.1:8765/docs |

## Credentials

- **Admin login:** `admin` / `admin123`

## Stopping

| Method | Command |
|--------|---------|
| Individual terminals | `Ctrl+C` in each |
| `run.ps1` | Press any key |
| Background jobs | `Get-Job \| Stop-Job; Get-Job \| Remove-Job` |

## Troubleshooting

### `uvicorn` command not found or "Unable to create process"

The venv launcher scripts have stale paths (happens if venv was moved/copied).

**Fix:** Reinstall the package to regenerate launchers:

```powershell
python -m pip uninstall uvicorn -y
python -m pip install uvicorn
```

Or use `python -m` to bypass the launcher:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```
