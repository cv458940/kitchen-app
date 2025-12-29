# Kitchen Checklist App

A simple, elegant web-based checklist application designed specifically for kitchen organization and task management.

## Features

- **Multiple Categories**: Organize tasks across four categories:
  - Cleaning
  - Inventory
  - Meal Prep
  - Shopping

- **Task Management**:
  - Add new tasks with a simple input field
  - Check/uncheck tasks as you complete them
  - Delete tasks you no longer need
  - Visual feedback for completed tasks

- **Data Persistence**: All your tasks are automatically saved to your browser's local storage, so they persist between sessions

- **Responsive Design**: Works great on desktop and mobile devices

- **Real-time Statistics**: See at a glance how many tasks you have total, completed, and remaining

## Getting Started

### Installation

1. **Clone or Download**:
   ```bash
   # Option 1: Clone the repository
   git clone <repository-url>
   cd kitchen-app

   # Option 2: Download ZIP
   # Click the "Code" button on GitHub and select "Download ZIP"
   # Extract the ZIP file to your desired location
   ```

2. **No Dependencies Required!**
   - This is a pure HTML/CSS/JavaScript app
   - No npm install, no build process, no configuration needed
   - All files are ready to run immediately

### How to Run the App

You have several options to run the application:

#### Method 1: Direct File Opening (Simplest)

**Perfect for: Quick local use, testing**

1. Navigate to the folder containing the files
2. Double-click on `index.html`
3. The app will open in your default web browser
4. Start using immediately!

**Note**: This method works great, but some browsers may have limitations with localStorage when opening files directly (using `file://` protocol).

---

#### Method 2: Using Python (Recommended)

**Perfect for: Development, full functionality, any operating system**

**On Windows:**
```bash
# Open Command Prompt or PowerShell in the project folder
# Then run:
python -m http.server 8000

# If you have Python 2:
python -m SimpleHTTPServer 8000
```

**On Mac/Linux:**
```bash
# Open Terminal in the project folder
# Then run:
python3 -m http.server 8000

# Or if python3 isn't found:
python -m http.server 8000
```

**Then:**
1. Open your web browser
2. Navigate to: `http://localhost:8000`
3. The app will be running!

**To stop the server**: Press `Ctrl + C` in the terminal

---

#### Method 3: Using Node.js (http-server)

**Perfect for: Node.js developers, professional development**

**First time setup:**
```bash
# Install http-server globally (one-time setup)
npm install -g http-server
```

**Running the app:**
```bash
# Navigate to the project folder in terminal
cd kitchen-app

# Start the server
http-server

# Or specify a port:
http-server -p 8080
```

**Then:**
1. Open your browser
2. Navigate to: `http://localhost:8080` (or the port shown in terminal)

---

#### Method 4: Using VS Code Live Server Extension

**Perfect for: VS Code users, automatic reload during development**

1. Install VS Code if you haven't already
2. Open VS Code
3. Install the "Live Server" extension:
   - Click Extensions icon (or press `Ctrl+Shift+X`)
   - Search for "Live Server" by Ritwick Dey
   - Click Install
4. Open the project folder in VS Code
5. Right-click on `index.html`
6. Select "Open with Live Server"
7. The app will open automatically in your browser!

**Bonus**: Any changes you make will auto-reload in the browser!

---

#### Method 5: Using PHP

**Perfect for: PHP developers**

```bash
# Navigate to project folder
cd kitchen-app

# Start PHP built-in server
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

---

#### Method 6: Deploy to Web (For Public Access)

**Perfect for: Sharing with others, accessing from anywhere**

**Free hosting options:**

1. **GitHub Pages** (Recommended):
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Add kitchen checklist app"
   git push origin main

   # Then in GitHub repository settings:
   # Settings → Pages → Source: main branch → Save
   # Your app will be live at: https://username.github.io/kitchen-app
   ```

2. **Netlify** (Easiest):
   - Go to [netlify.com](https://netlify.com)
   - Sign up for free
   - Drag and drop your project folder
   - Get instant live URL!

3. **Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up for free
   - Import your GitHub repository
   - Automatic deployment!

4. **Surge.sh**:
   ```bash
   npm install -g surge
   cd kitchen-app
   surge
   # Follow prompts, get instant URL
   ```

---

### Troubleshooting

**Problem: Double-clicking index.html doesn't work**
- Solution: Try a different browser, or use one of the server methods above

**Problem: "Python not found" error**
- Solution: Install Python from [python.org](https://python.org)
- On Mac: Python 3 is usually pre-installed, try `python3` instead of `python`
- On Windows: Make sure to check "Add Python to PATH" during installation

**Problem: "npm not found" error**
- Solution: Install Node.js from [nodejs.org](https://nodejs.org) (includes npm)

**Problem: Data not saving between sessions**
- Solution: Make sure you're using a server method (not file://) and that your browser allows localStorage

**Problem: Port 8000 already in use**
- Solution: Use a different port number:
  - Python: `python -m http.server 3000`
  - http-server: `http-server -p 3000`

---

### Quick Start Summary

**Absolute Beginner?**
→ Just double-click `index.html`

**Have Python installed?**
→ Run `python -m http.server 8000` and visit `http://localhost:8000`

**Use VS Code?**
→ Install Live Server extension, right-click `index.html`, select "Open with Live Server"

**Want to share with others?**
→ Deploy to Netlify (drag and drop) or GitHub Pages

## How to Use

1. **Select a Category**: Click on one of the four tabs (Cleaning, Inventory, Meal Prep, Shopping)
2. **Add Tasks**: Type your task in the input field and click "Add" or press Enter
3. **Complete Tasks**: Click the checkbox next to a task to mark it as complete
4. **Delete Tasks**: Click the "Delete" button to remove a task
5. **Switch Categories**: Click different tabs to view and manage tasks in different categories

## File Structure

```
kitchen-app/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── app.js          # Application logic and data management
└── README.md       # This file
```

## Technologies Used

- HTML5
- CSS3 (with animations and gradients)
- Vanilla JavaScript (ES6+)
- LocalStorage API for data persistence

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- LocalStorage API

## Future Enhancements

Potential features for future versions:
- Custom categories
- Task priorities
- Due dates and reminders
- Export/import functionality
- Dark mode
- Drag-and-drop reordering

## License

Free to use and modify for personal or commercial projects.
