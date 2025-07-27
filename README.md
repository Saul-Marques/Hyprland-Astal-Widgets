<img width="1919" height="1078" alt="image" src="https://github.com/user-attachments/assets/9a089b81-5b85-4237-b96e-0b07d9fbf0e1" />

# Hyprland Astal Widgets

A set of desktop widgets for the [Hyprland](https://hyprland.org/) Wayland compositor, built with GJS (GNOME JavaScript bindings) and GTK4. This project leverages the `gtk4-layer-shell` library to place widgets directly on the background.

## Overview

These widgets are designed to be highly customizable and provide at-a-glance information. The project includes:

*   A large, prominent main clock and the current date.
*   Multiple time zone clocks.
*   A calendar for the current month.
*   Customizable text labels for notes or keyboard shortcuts.

The styling is handled entirely via CSS, making it easy to theme and integrate existing desktop setup. The layout is managed using `Gtk.Fixed`, allowing for precise pixel-perfect.

## Features

*   **Main Clock and Date:** A large, clock and the current date.
*   **Multiple Time Zone Clocks:** Display the time in different cities with UTC offsets.
*   **Monthly Calendar:** A simple calendar for the current month, with the current day highlighted.
*   **Customizable Labels:** Includes text and keyboard shortcut hints that you can easily change.
*   **CSS-Based Styling:** Easily change the look and feel of every widget. Modify fonts, colors, sizes, and more in the `style.css` file.

## Dependencies

Before running this project, you need to have the following dependencies installed on your system.

*   **Hyprland:** A dynamic tiling Wayland compositor.
*   **GJS:** JavaScript bindings for GNOME (`gjs`).
*   **GTK4 Layer Shell:** A library to create panels and other desktop components for Wayland using the Layer Shell protocol with GTK4 (`gtk4-layer-shell`).
## How It Works

The application is written in JavaScript and uses GJS to interact with GTK4 for creating the user interface. The key files are:

*   **`main.js`**: This is the core application logic. It creates a transparent, full-screen GTK window and uses `gtk4-layer-shell` to set its `layer` to `BOTTOM`, effectively placing it on the desktop background behind all other windows. It then adds and updates the various labels and the calendar.

*   **`style.css`**: This file defines the visual appearance of all the widgets. You can modify this file to change fonts, colors, sizes, and more. All widgets are assigned CSS classes in `main.js` for easy styling.

*   **`run.sh`**: A simple shell script to launch the widgets. It uses `LD_PRELOAD` to ensure that the `gtk4-layer-shell` library is loaded before the application starts. This is crucial for the window to be correctly treated as a desktop layer by Hyprland.

*   **`utils.js`**: Contains helper functions. The included snippet hints at reactive data binding capabilities through the Astal library for more complex setups.

## Usage

To run the widgets, simply execute the `run.sh` script from your terminal.

First, make the script executable:
```bash
chmod +x run.sh
```

Then, run it:
```bash
./run.sh
```

To have the widgets start automatically with Hyprland, add the following line to your `hyprland.conf`:```
exec = /path/to/your/project/run.sh
```

## Customization

You can easily customize the widgets by editing the `main.js` and `style.css` files.

### Changing Widget Layout

To change the position of a widget, you need to edit its coordinates in the `fixed.put()` call within `main.js`. The coordinates are (X, Y) from the top-left corner of the screen.

For example, to move the main clock:
```javascript
// main.js

// Main Clock
const mainClock = new Gtk.Label({ label: "", css_classes: ["main-clock"] });
// Change the X and Y values (760, 100) to move the clock
fixed.put(mainClock, 760, 100);
```

### Changing Widget Styles

To alter the appearance (colors, fonts, etc.), modify the corresponding CSS class in `style.css`.

For example, to change the color and font size of the main clock:
```css
/* style.css */

.main-clock {
    font-family: "SF Pro Display", sans-serif;
    font-size: 200px; /* Change the font size */
    font-weight: bold;
    color: #FFFFFF; /* Change the color */
}
```

## License

This project is open-source. Feel free to modify and distribute it as you see fit. Please consider providing attribution if you use it in a public rice or project.

---
