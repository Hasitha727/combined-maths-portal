# Combined Maths LMS Portal (.NET 8 + React 19)

A full-stack, strict-timed university exam and assignment portal built with **ASP.NET Core Web API (.NET 8)** backend, **Entity Framework Core (SQLite)**, and **React 19 + Tailwind CSS** frontend.

---

## 🌟 Tech Stack

- **Backend**: ASP.NET Core Web API (.NET 8)
- **Database / ORM**: SQLite (`combinedmaths.db`) with Entity Framework Core 8
- **API Documentation**: Swagger / OpenAPI UI
- **Frontend**: React 19 (Hooks, SPA)
- **Styles**: Tailwind CSS v4 (Moodle Academic Theme)
- **Icons**: Lucide React
- **Dev Server & Bundler**: Vite 8 with reverse proxy to .NET

---

## 🚀 How to Run

### Option 1: One-Click PowerShell Script
```powershell
.\start-portal.ps1
```

### Option 2: Run Separately
1. **Start the .NET 8 Backend API**:
   ```bash
   dotnet run --project CombinedMaths.Api
   ```
   - API Base: `http://localhost:5000`
   - Swagger Documentation: `http://localhost:5000/swagger`

2. **Start the React Frontend**:
   ```bash
   npm run dev
   ```
   - Portal Web App: `http://localhost:5173`

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/users` | List preset users (Lecturer & Students) |
| `POST` | `/api/auth/login` | Log in user |
| `GET` | `/api/papers` | Get all exam model papers |
| `GET` | `/api/papers/{id}` | Get specific paper details |
| `POST` | `/api/papers` | Teacher creates a new paper |
| `GET` | `/api/submissions` | Get submissions (`?paperId=&studentIndex=`) |
| `POST` | `/api/submissions` | Submit student answer script with timer check |
| `PUT` | `/api/submissions/{id}/grade` | Teacher awards marks & feedback comments |
| `POST` | `/api/sessions/start` | Start strict-timed exam countdown session |
| `GET` | `/api/sessions/active` | Get active session for student |
| `POST` | `/api/sessions/{id}/tab-switch` | Log anti-cheat tab switch count |

