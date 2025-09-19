imports.gi.versions.Gtk = "4.0";
const { Gtk, GLib, GdkPixbuf, Gio } = imports.gi;

function runCommand(command, callback) {
    const subprocess = Gio.Subprocess.new(
        ['bash', '-c', command],
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    );
    subprocess.communicate_utf8_async(null, null, (proc, res) => {
        try {
            const [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
            // Modificação: consideramos um erro se o processo não for bem-sucedido ou se o stderr tiver conteúdo.
            if (ok && !stderr) {
                callback(stdout ? stdout.trim() : null, null);
            } else {
                callback(null, stderr ? stderr.trim() : "Process failed or player not running.");
            }
        } catch (e) {
            console.error(`Error running command: ${command}`, e);
            callback(null, e.message);
        }
    });
}

function createSpotifyWidget() {
    const fixed = new Gtk.Fixed();
    fixed.set_size_request(350, 450);
    fixed.get_style_context().add_class('spotify-widget');

    const albumArt = new Gtk.Picture();
    albumArt.get_style_context().add_class('spotify-album-art');
    albumArt.set_size_request(310, 310);
    albumArt.set_can_shrink(false);
    fixed.put(albumArt, 20, 20);

    const titleLabel = new Gtk.Label({ label: "Nothing Playing", halign: Gtk.Align.START, xalign: 0 });
    titleLabel.get_style_context().add_class('spotify-title');
    fixed.put(titleLabel, 20, 345);

    const artistLabel = new Gtk.Label({ label: "Spotify", halign: Gtk.Align.START, xalign: 0 });
    artistLabel.get_style_context().add_class('spotify-artist');
    fixed.put(artistLabel, 20, 370);

    const controlsBox = new Gtk.Box({ spacing: 20 });
    controlsBox.get_style_context().add_class('spotify-controls');

    const prevButton = new Gtk.Button({ label: '󰒮' });
    prevButton.get_style_context().add_class('spotify-button');
    prevButton.connect('clicked', () => runCommand('playerctl --player=spotify previous', ()=>{}));

    const playPauseButton = new Gtk.Button({ label: '󰐊' });
    playPauseButton.get_style_context().add_class('spotify-button');
    playPauseButton.get_style_context().add_class('play-pause');
    playPauseButton.connect('clicked', () => runCommand('playerctl --player=spotify play-pause', ()=>{}));

    const nextButton = new Gtk.Button({ label: '󰒭' });
    nextButton.get_style_context().add_class('spotify-button');
    nextButton.connect('clicked', () => runCommand('playerctl --player=spotify next', ()=>{}));

    controlsBox.append(prevButton);
    controlsBox.append(playPauseButton);
    controlsBox.append(nextButton);

    const centerBox = new Gtk.CenterBox();
    centerBox.set_center_widget(controlsBox);
    centerBox.set_size_request(350, -1);
    fixed.put(centerBox, 0, 400);

    let currentArtUrl = '';
    function loadAlbumArt(url) {
        if (url === currentArtUrl) return;
        currentArtUrl = url;

        if (!url) {
            albumArt.set_paintable(null);
            return;
        }

        const loadPathIntoWidget = (path) => {
            try {
                if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
                    const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(path, 310, 310);
                    albumArt.set_pixbuf(pixbuf);
                } else {
                    albumArt.set_paintable(null);
                }
            } catch(e) {
                console.error("Failed to load image pixbuf: ", e);
                albumArt.set_paintable(null);
            }
        };

        if (url.startsWith('file://')) {
            const path = url.replace('file://', '');
            loadPathIntoWidget(path);
        } else if (url.startsWith('http')) {
            const cacheDir = GLib.get_user_cache_dir();
            const artPath = GLib.build_filenamev([cacheDir, 'astal-spotify-art.jpg']);
            
            const sourceFile = Gio.File.new_for_uri(url);
            const destFile = Gio.File.new_for_path(artPath);

            sourceFile.copy_async(
                destFile, 
                Gio.FileCopyFlags.OVERWRITE, 
                GLib.PRIORITY_DEFAULT, 
                null, // cancellable
                null, // progress_callback
                (source, res) => {
                    try {
                        source.copy_finish(res);
                        loadPathIntoWidget(artPath);
                    } catch(e) {
                        console.error(`Failed to download album art from ${url}: `, e);
                        albumArt.set_paintable(null);
                    }
                }
            );
        }
    }


    // ### INÍCIO DAS ALTERAÇÕES IMPORTANTES ###

    function updateSpotifyWidget() {
        // O comando 'status' é o nosso controlo principal.
        runCommand('playerctl --player=spotify status', (status, error) => {
            // Se houver um erro ou nenhum status, significa que o Spotify não está a tocar nada.
            if (error || !status) {
                fixed.set_visible(false); // Esconde o widget.
                return; // Pára a execução para não fazer chamadas desnecessárias.
            }

            // Se chegarmos aqui, o Spotify está ativo. Garantimos que o widget está visível.
            fixed.set_visible(true);

            // Agora, atualizamos o resto das informações.
            playPauseButton.set_label(status === 'Playing' ? '󰏤' : '󰐊');
            
            runCommand('playerctl --player=spotify metadata title', (title) => {
                if (title) {
                    titleLabel.set_label(title);
                } else {
                    titleLabel.set_label("Nothing Playing");
                    artistLabel.set_label("Spotify");
                    loadAlbumArt(null);
                }
            });

            runCommand('playerctl --player=spotify metadata artist', (artist) => {
                if (artist) artistLabel.set_label(artist);
            });

            runCommand('playerctl --player=spotify metadata mpris:artUrl', (url) => {
                loadAlbumArt(url);
            });
        });

        return GLib.SOURCE_CONTINUE;
    }

    // Esconde o widget por defeito para evitar o "flicker" inicial.
    fixed.set_visible(false);

    // ### FIM DAS ALTERAÇÕES IMPORTANTES ###

    GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, updateSpotifyWidget);
    updateSpotifyWidget(); // Chama uma vez para definir o estado inicial.

    return fixed;
}

var exports = { createSpotifyWidget };2