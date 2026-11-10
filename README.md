# Player System (React + TypeScript)

A browser-only player account and dashboard demo. It does **not** use a database or server.

## Requirements
- Node.js (LTS recommended)
- Visual Studio Code

## Run it in VS Code
1. Download and extract this ZIP.
2. Open VS Code.
3. Select **File → Open Folder** and choose the extracted `player-system-typescript` folder.
4. Open **Terminal → New Terminal**.
5. Install dependencies:
   ```bash
   npm install
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
7. Open the local URL Vite prints (usually `http://localhost:5173`).

## Deploy to Vercel
1. Create or sign in to a Vercel account.
2. Push this project to a GitHub repository.
3. In Vercel, choose **Add New → Project** and import that repository.
4. Vercel should detect Vite automatically. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Select **Deploy**.

You can also install the Vercel CLI and deploy from the project terminal:
```bash
npm install -g vercel
vercel
```
Follow the prompts. For a production deployment, run:
```bash
vercel --prod
```

## Important: no database
Accounts and inventory are saved in the browser's `localStorage` on the device/browser where they were created. This means:
- Clearing browser data can erase accounts.
- Accounts do not sync between devices or browsers.
- This is a learning/demo implementation, **not secure authentication**. Passwords are stored in browser storage. Do not use real or reused passwords.
- For a real public application, use a secure authentication provider and a database.

## Included features
- Player login and registration
- Automatically generated Player ID / account number
- Username, password with show/hide, email, and class selection
- Dashboard with player profile
- Inventory sections for Armor, Weapons, and Miscellaneous items
- Add and remove inventory items
- Logout
