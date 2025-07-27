imports.gi.versions.Gtk = "4.0";
imports.gi.versions.GLib = "2.0";

const { Gtk, GLib, Gdk } = imports.gi;
const LayerShell = imports.gi.Gtk4LayerShell;

const app = new Gtk.Application({
    application_id: 'org.astal.widgets.custom',
    flags: imports.gi.Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect("activate", () => {
    // --- CSS Provider ---
    const provider = new Gtk.CssProvider();
    provider.load_from_path('style.css');
    Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    const win = new Gtk.ApplicationWindow({ application: app });
    win.set_default_size(1920, 1080); // Set to your full screen resolution
    win.set_decorated(false); // No titlebar or borders

    // --- THIS IS THE KEY PART ---
    // We connect to the "realize" signal to ensure the window exists before
    // telling the compositor how to handle it.
    win.connect('realize', () => {
        // Initialize the layer shell for this window
        LayerShell.init_for_window(win);
        
        // Set the layer to "BOTTOM". This places it on the desktop background,
        // behind all other windows. This is what makes it a "widget".
        LayerShell.set_layer(win, LayerShell.Layer.BOTTOM);

        // Set the namespace. This is important for some Wayland compositors.
        LayerShell.set_namespace(win, "astal-widgets");
        
        // Anchor the window to all edges of the output. This makes the
        // fullscreen window stay in place.
        LayerShell.set_anchor(win, LayerShell.Edge.TOP, true);
        LayerShell.set_anchor(win, LayerShell.Edge.BOTTOM, true);
        LayerShell.set_anchor(win, LayerShell.Edge.LEFT, true);
        LayerShell.set_anchor(win, LayerShell.Edge.RIGHT, true);
    });

    // --- Widget Creation (No changes here) ---
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
    fixed.put(smallStepsLabel, 50, 380);
    const gotThisLabel = new Gtk.Label({ label: "command + SPACE to open the explorer", css_classes: ["motivation-text-bold"] });
    fixed.put(gotThisLabel, 50, 420);


    // --- Time Update Function (No changes here) ---
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