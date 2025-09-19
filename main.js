imports.searchPath.unshift('.');

imports.gi.versions.Gtk = "4.0";
imports.gi.versions.GLib = "2.0";

const { Gtk, GLib, Gdk, Gio } = imports.gi;
const LayerShell = imports.gi.Gtk4LayerShell;
const SpotifyWidget = imports.spotify; // Your new Spotify import

// --- 1. THEME CONFIGURATION ---
// IMPORTANT: Replace 'YOUR_USER' with your actual username.
const themes = {
    'blue': {
        css: '/home/saul/minhaconfig/themes/blue.css',
        wallpaper: '/home/saul/minhaconfig/wallpapers/blue.jpg',
    },
    'green': {
        css: '/home/saul/minhaconfig/themes/green.css',
        wallpaper: '/home/saul/minhaconfig/wallpapers/green.jpg',
    },
    'dark': {
        css: '/home/saul/minhaconfig/themes/dark.css',
        wallpaper: '/home/saul/minhaconfig/wallpapers/dark.jpg',
    },
    'orange': {
        css: '/home/saul/minhaconfig/themes/orange.css',
        wallpaper: '/home/saul/minhaconfig/wallpapers/orange.jpg',
    },
};

// --- 2. STATE MANAGEMENT ---
const THEME_STATE_DIR = GLib.get_home_dir() + '/.config/astal-widgets';
const THEME_STATE_FILE = THEME_STATE_DIR + '/current_theme';

function saveCurrentTheme(themeName) {
    try {
        GLib.mkdir_with_parents(THEME_STATE_DIR, 0o755);
        GLib.file_set_contents(THEME_STATE_FILE, themeName);
    } catch (e) {
        logError(e);
    }
}

function loadCurrentTheme() {
    try {
        const [ok, contents] = GLib.file_get_contents(THEME_STATE_FILE);
        if (ok) {
            const themeName = new TextDecoder().decode(contents);
            return themes[themeName] ? themeName : 'blue';
        }
    } catch (e) {
        // File likely doesn't exist.
    }
    return 'blue'; // Default theme
}

const app = new Gtk.Application({
    application_id: 'org.astal.widgets.custom',
    flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect("activate", () => {
    // We combine CSS providers. One for themes, one for the static Spotify widget.
    // NOTE: The Spotify widget now needs to load its own CSS. I'll assume it's in a file called 'spotify.css'
    const themeProvider = new Gtk.CssProvider();
    Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), themeProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    // This provider is for widgets that should NOT change with the theme.
    const staticProvider = new Gtk.CssProvider();
    // ASSUMPTION: Your spotify.js needs spotify.css to style itself.
    staticProvider.load_from_path('style.css');
    Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), staticProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);


    // --- 3. THEME APPLYING FUNCTION ---
    function applyTheme(themeName) {
        if (!themes[themeName]) {
            print(`Theme "${themeName}" not found.`);
            return;
        }
        const theme = themes[themeName];
        // We only load the THEME CSS into the themeProvider. The staticProvider is untouched.
        themeProvider.load_from_path(theme.css);

        // Change the wallpaper using hyprctl
        // IMPORTANT: Replace 'DP-1' with your monitor's name.
        const monitorName = 'eDP-1';
        const hyprctl_command = `hyprctl hyprpaper wallpaper "${monitorName},${theme.wallpaper}"`;
        GLib.spawn_command_line_async(hyprctl_command);

        saveCurrentTheme(themeName);
        print(`Applied theme: ${themeName}`);
    }

    const win = new Gtk.ApplicationWindow({ application: app });
    win.set_default_size(1920, 1080);
    win.set_decorated(false);

    win.connect('realize', () => {
        LayerShell.init_for_window(win);
        LayerShell.set_layer(win, LayerShell.Layer.BOTTOM);
        LayerShell.set_namespace(win, "astal-widgets");
        LayerShell.set_anchor(win, LayerShell.Edge.TOP, true);
        LayerShell.set_anchor(win, LayerShell.Edge.BOTTOM, true);
        LayerShell.set_anchor(win, LayerShell.Edge.LEFT, true);
        LayerShell.set_anchor(win, LayerShell.Edge.RIGHT, true);
    });

    // --- Widget Creation ---
    const fixed = new Gtk.Fixed();
    win.set_child(fixed);

    // Main Clock
    const mainClock = new Gtk.Label({ label: "", css_classes: ["main-clock"] });
    fixed.put(mainClock, 760, 100);

    // Date
    const dateLabel = new Gtk.Label({ label: "", css_classes: ["date-label"] });
    fixed.put(dateLabel, 885, 70);

    // Additional Clocks
    const laClock = createTimeZoneClock("TOK", 8);
    fixed.put(laClock.container, 50, 50);
    const seoClock = createTimeZoneClock("SEO", 8);
    fixed.put(seoClock.container, 50, 80);
    const sydClock = createTimeZoneClock("SYD", 10);
    fixed.put(sydClock.container, 50, 110);

    // Calendar
    const calendarGrid = createCalendar();
    fixed.put(calendarGrid, 50, 180);

    // Motivational Text
    const smallStepsLabel = new Gtk.Label({ label: "command + M to shutdown", css_classes: ["motivation-text"] });
    fixed.put(smallStepsLabel, 50, 400);
    const gotThisLabel = new Gtk.Label({ label: "command + SPACE to open the explorer", css_classes: ["motivation-text-bold"] });
    fixed.put(gotThisLabel, 50, 440);

    // --- NEW: Spotify Widget ---
    const spotifyWidget = SpotifyWidget.createSpotifyWidget();
    fixed.put(spotifyWidget, 1540, 550);


const themePickerBox = new Gtk.Box({ spacing: 10 });
fixed.put(themePickerBox, 50, 500);

for (const themeName in themes) {
    const button = new Gtk.Button({ css_classes: ["theme-picker-button"] });
    const themeColors = {
        'blue': 'rgba(30, 58, 138, 0.7)',
        'green': 'rgba(22, 101, 52, 0.7)',
        'dark': 'rgba(17, 24, 39, 0.8)',
        'orange': 'rgba(255, 174, 0, 0.8)',

    };

    const css_data = `.theme-picker-button.${themeName} { background-color: ${themeColors[themeName]}; }`;
    
    // Create and apply a specific provider for this button's style
    const buttonProvider = new Gtk.CssProvider();
    // THE FIX: Add the length of the string as the second argument
    buttonProvider.load_from_data(css_data, css_data.length);

    // Add a class to the button to target it with the CSS
    button.get_style_context().add_class(themeName);

    // Apply the provider to the button's style context
    button.get_style_context().add_provider(buttonProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    button.set_tooltip_text(`Switch to ${themeName} theme`);
    button.connect('clicked', () => {
        applyTheme(themeName);
    });
    themePickerBox.append(button);
}

    // --- Time Update Function ---
    function updateTime() {
        const now = GLib.DateTime.new_now_local();
        mainClock.set_label(now.format("%H:%M"));
        dateLabel.set_label(now.format("%A, %B %e"));
        laClock.timeLabel.set_label(now.add_hours(8).format("%H:%M"));
        seoClock.timeLabel.set_label(now.add_hours(8).format("%H:%M"));
        sydClock.timeLabel.set_label(now.add_hours(10).format("%H:%M"));
        return GLib.SOURCE_CONTINUE;
    }
    
    GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, updateTime);
    updateTime();

    // --- 5. INITIAL THEME LOAD ---
    const initialTheme = loadCurrentTheme();
    applyTheme(initialTheme);

    win.present();
});

// Helper functions (No changes here)
function createTimeZoneClock(city, offset) {
    const box = new Gtk.Box({ spacing: 10 });
    const cityLabel = new Gtk.Label({ label: city, css_classes: ["city-label"] });
    const timeLabel = new Gtk.Label({ label: "--:--", css_classes: ["time-zone-time"] });
    const offsetString = offset > 0 ? `+${offset}` : offset.toString();
    const offsetLabel = new Gtk.Label({ label: offsetString, css_classes: ["time-offset"] });
    box.append(cityLabel);
    box.append(timeLabel);
    box.append(offsetLabel);
    return { container: box, timeLabel: timeLabel };
}

function createCalendar() {
    const grid = new Gtk.Grid({ row_spacing: 10, column_spacing: 15 });
    const now = GLib.DateTime.new_now_local();
    const year = now.get_year();
    const month = now.get_month();
    const day = now.get_day_of_month();
    const monthLabel = new Gtk.Label({ label: now.format("%B").toUpperCase(), css_classes: ["calendar-month"] });
    grid.attach(monthLabel, 0, 0, 7, 1);
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    for (let i = 0; i < daysOfWeek.length; i++) {
        const label = new Gtk.Label({ label: daysOfWeek[i], css_classes: ["calendar-header"] });
        grid.attach(label, i, 1, 1, 1);
    }
    const firstOfMonth = GLib.DateTime.new_local(year, month, 1, 0, 0, 0);
    const daysInMonth = GLib.Date.get_days_in_month(month, year);
    const dayOfWeek = firstOfMonth.get_day_of_week() % 7;
    let currentDay = 1;
    for (let row = 2; row < 8 && currentDay <= daysInMonth; row++) {
        for (let col = 0; col < 7; col++) {
            if (row === 2 && col < dayOfWeek) {
                grid.attach(new Gtk.Label({ label: "" }), col, row, 1, 1);
            } else if (currentDay <= daysInMonth) {
                const label = new Gtk.Label({ label: currentDay.toString(), css_classes: ["calendar-day"] });
                if (currentDay === day) {
                    label.get_style_context().add_class("current-day");
                }
                grid.attach(label, col, row, 1, 1);
                currentDay++;
            }
        }
    }
    return grid;
}

app.run([]);