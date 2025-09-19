Move frontend assets into the backend to allow serving them via HTTP.

Steps:
1. Copy frontend `assets/` folder into `backend/src/assets/` (preserve subfolders like `images/`).
   On Windows PowerShell (from repo root):

   # copy all files recursively from frontend assets to backend
   Copy-Item -Path .\assets\* -Destination .\backend\src\assets\ -Recurse -Force

2. Start backend (node) and ensure static serving works. Example:

   # from backend folder
   cd backend
   npm install
   node src/app.js

3. Access an image from the frontend by using the backend base URL configured in your app (e.g., http://localhost:3000/assets/images/skillhive_logo.png).

Notes:
- For user uploads, follow existing project guidance and save uploads into `backend/src/assets/uploads/` (use multer in routes).
- If you want to serve assets from a CDN or different host, update frontend `RemoteAsset` helper to point there.
