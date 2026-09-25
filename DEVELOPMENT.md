# TappaScore Development Setup & Startup Guide

## One-Command Startup

You can start both the backend server and frontend development server simultaneously with a single command.

### Option 1: Command Line (PowerShell / Command Prompt)

Run the following command from the project root (`C:\Users\Parthik Rami\Desktop\tappascore-fullstack`):

```cmd
npm.cmd run dev
```

### Option 2: Windows Launcher Script

You can double-click or run the launcher script from the project root:

```cmd
start-dev.cmd
```

---

## Server Information & URLs

When the servers are running, access the app at:

- **Frontend URL:** [http://localhost:5173](http://localhost:5173)
- **Backend API & Socket.IO URL:** [http://localhost:5000](http://localhost:5000)
- **Owner / Super Admin Login:** [http://localhost:5173/owner/login](http://localhost:5173/owner/login)

---

## Output Labels

Log outputs are clearly tagged in the terminal:
- `[BACKEND]` (Yellow) - Backend Express & MongoDB logs
- `[FRONTEND]` (Cyan) - Vite frontend dev server logs

If either server encounters an error, the error details will be directly visible in the console.

---

## How to Stop the Servers

To shut down both servers:
- Press `Ctrl + C` in the terminal window where `npm.cmd run dev` or `start-dev.cmd` is running and confirm with `Y`, or
- Close the terminal window.
