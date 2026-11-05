# SDC Live Background 0.3.2 für Windows 11 / Lively Wallpaper

## Installation

1. Lively Wallpaper über https://www.rocksdanister.com/lively/ installieren.
   Empfohlen ist Lively 2.2 oder neuer mit dem Standard-Webplayer WebView2.
2. Die Datei **Live_Background_Lively_v0.3.2.zip direkt in das Lively-Fenster
   ziehen**. Diese ZIP muss für den Import nicht entpackt werden.
3. Das importierte Wallpaper auswählen.
4. Rechtsklick auf dessen Kachel > **Anpassen / Customise**.
5. Motiv wählen und bei Bedarf die weiteren Einstellungen ändern.

Als Standard startet **Neon-Emblem-SDC**. Es sind alle neun Motive enthalten:
Matrix-Regen, Code-Stream, Gewitter, Sternenfeld, Glühwürmchen,
Neon-Emblem-SDC, Neon-Emblem-Bazzite, Schwebende Blasen SDC und
Schwebende Blasen Bazzite.

## Einstellungen

- Motiv und Zufallsmodus; Wechselintervall von 1 bis 30 Minuten.
- Geschwindigkeit, 10 bis 60 FPS und 40 bis 100 % Renderauflösung.
- Abdunkelung der Hintergrundbilder hinter den Blasen.
- Eigene Logos und Hintergrundbilder getrennt für SDC und Bazzite.
- Manuelle Pause für Animation und Zufallswechsel.
- Standardwerte lassen sich über Lively wiederherstellen.

Zum Einstieg sind **24 FPS und 60 % Renderauflösung** voreingestellt.
Im Zufallsmodus kommt jedes Motiv einmal pro gemischter Runde vor; direkte
Wiederholungen werden vermieden. Beim Pausieren bleibt die Restzeit erhalten.

Die Einstellungen werden von Lively gespeichert. Die deutsche Übersetzung
der Einstellungen benötigt Lively 2.2 oder neuer. Lively kann für jeden
Bildschirm eigene Optionen speichern.

## Eigene Bilder

Die vier Bildauswahlen listen Bilder aus dem mitgelieferten Ordner
**assets** auf. Über Lively lassen sich weitere Bilder zu diesem Ordner
hinzufügen. Falls eine verwendete Lively-Version keine Schaltfläche zum
Hinzufügen anbietet: Rechtsklick auf die Wallpaper-Kachel > Dateispeicherort
öffnen, das Bild in **assets** kopieren und das Wallpaper neu laden.

Für Logos eignen sich transparente PNG- oder SVG-Dateien. Die Standardbilder
bleiben mitgeliefert. Über die jeweilige Auswahl kann jederzeit wieder das
SDC- oder Bazzite-Standardbild gewählt werden. Die globale Funktion
„Standardwerte wiederherstellen“ setzt auch die übrigen Einstellungen zurück.

## Maus, Touchscreen und Pause

Mausbewegung und Linksklick werden über Lively an die Animation weitergegeben.
Dazu unter Lively-Einstellungen > Hintergrundbild > Interaktion die
Mauseingabe aktivieren. Desktop-Symbole und Kontextmenüs werden von Lively
verwaltet.

Die Touch-Unterstützung des Webplayers bleibt enthalten. Die tatsächliche
Weitergabe von Touch-Ereignissen durch Lively muss auf dem jeweiligen
Windows-Gerät geprüft werden.

Die automatische Vollbild- und Akkupause unter **Lively-Einstellungen >
Leistung** festlegen. Dieses Paket verarbeitet Lively-Pausenmeldungen auch
für den Zufalls-Timer. Eine manuell gesetzte Pause bleibt beim Fortsetzen
durch Lively aktiv.

## Vorschau und Entfernen

Zum Ausprobieren ohne Desktop-Einbindung die ZIP entpacken und
**Preview.html** im Browser öffnen.

Zum Entfernen in Lively zunächst ein anderes Wallpaper auswählen, dann die
SDC-Wallpaper-Kachel löschen. Für diese Version werden weder Linux-Skripte
noch Administratorrechte benötigt.

## Prüfstatus

Die automatisierten Prüfungen testen die tatsächlichen HTML/JavaScript-
Animationen in Chromium sowie Lively-Einstellungen, Bildzuordnung,
Zufallswechsel und kombinierte manuelle/automatische Pause. Dabei werden
Lively-Ereignisse über die dokumentierte Schnittstelle simuliert.

Ein vollständiger Test der Desktop-Einbindung unter Windows 11 mit Lively
und der Touch-Eingaben auf einem Windows-Handheld ist separat erforderlich.
Die Windows-Desktop-Einbindung wird durch Lively bereitgestellt.

## Herkunft

Siehe **CREDITS.md**. Die Animationen basieren auf
https://github.com/ryth9419-jpg/livewallpaper.
