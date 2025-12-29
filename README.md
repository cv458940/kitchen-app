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

1. Clone this repository or download the files
2. No dependencies or build process required!

### Usage

Simply open `index.html` in your web browser. That's it!

You can also serve it using any web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Then open http://localhost:8000 in your browser
```

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
