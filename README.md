# DamTrack

A simple habit tracking application built with vanilla JavaScript.

## Features

- Create, edit, and delete habits
- Two track types: Periodic (frequency-based) and Measurement (value tracking)
- Assign colors to habits for visual identification
- Calendar view with month and year views
- Weekly progress tracking in To Do tab
- Statistics with streaks, averages, and graphs
- Dark/Light mode toggle
- Data stored in browser localStorage
- Export/Import data as JSON

## Project Structure

```
damtrack/
├── frontend/
│   ├── index.html    # Main HTML
│   ├── styles.css    # Styling
│   └── app.js        # JavaScript logic
├── assets/
│   └── images/       # iOS setup screenshots
└── README.md
```

## Usage

Open `frontend/index.html` in your browser.

1. **Add Tracks**: Click "+ Add Track" to create a new habit with name, type, frequency, and color
2. **Track Progress**: Click "Done Today" for periodic tracks or "+ Record" for measurements
3. **Calendar View**: Toggle visibility of tracks in the calendar using the switch
4. **Edit History**: Click any day in the calendar to toggle completion or enter measurements
5. **Settings**: Click the gear icon to access Export/Import and theme settings

## iOS Home Screen Setup

You can add DamTrack to your iPhone home screen for a native app-like experience:

1. **Open in Safari**: Navigate to your DamTrack URL in Safari
2. **Tap Share**: Tap the Share button (square with arrow) at the bottom of the screen
3. **Add to Home Screen**: Scroll down and tap "Add to Home Screen"
4. **Name & Add**: Enter a name (or keep "DamTrack") and tap "Add"

The app will now appear on your home screen with its own icon, and will open in full-screen mode without Safari's navigation bar.

> **Tip**: You can also find step-by-step visual instructions inside the app by clicking Settings (gear icon) → "iOS App Setup"

![iOS Setup Step 1](assets/images/1.PNG)
![iOS Setup Step 2](assets/images/2.PNG)
![iOS Setup Step 3](assets/images/3.PNG)
