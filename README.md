# Clinic Queue (Pi Zero 2 W)

Gestion locale de file d’attente pour clinique dentaire : accueil, salles, affichage temps réel et annonces vocales Bluetooth. Backend Express + SQLite + socket.io, frontend React/Vite (unique app).

## Prérequis
- Raspberry Pi Zero 2 W (ou autre Pi) sur le même LAN que les clients.
- Node.js 18+ / npm.
- Packages OS audio/TTS : `sudo apt install ffmpeg mpg123 espeak-ng pulseaudio-utils` (ou `pico2wave` via `sudo apt install libttspico-utils`).
- SQLite déjà inclus sur Raspberry OS (`sudo apt install sqlite3` si besoin).
- Bluetooth activé et couplé à l’enceinte.

> Répéteurs Wi-Fi doivent être en mode **AP/Bridge/Repeater** (pas routeur/NAT) afin que tous les appareils restent sur le même LAN.

## Installation
```bash
git clone https://example.com/clinic-queue.git
cd clinic-queue
npm install
npm run build   # construit le frontend (client/dist)
```

### Pairer l’enceinte Bluetooth (exemple)
```bash
bluetoothctl power on
bluetoothctl scan on          # repérez l’adresse MAC
bluetoothctl pair AA:BB:CC:DD:EE:FF
bluetoothctl trust AA:BB:CC:DD:EE:FF
bluetoothctl connect AA:BB:CC:DD:EE:FF
```
Ensuite, choisissez l’enceinte comme sortie par défaut (PulseAudio/BlueZ) ou via l’UI Raspberry Pi. Le serveur lit un `chime.mp3` puis une synthèse vocale (`pico2wave` ou `espeak-ng` en français).

## Démarrage
- Dev (hot reload React + API) : `npm run dev`
  - Front: http://localhost:5173 (proxy vers API)
  - API/socket: http://localhost:3001
- Prod : `npm start` (sert les fichiers `client/dist` et l’API sur le port 3001 par défaut).

Frontend accessible depuis :  
`http://queue-hub.local:3001` ou `http://<IP_LAN>:3001`

Si `queue-hub.local` ne résout pas, consultez l’IP : `GET /api/info` retourne `{hostname, ip}` (visible aussi dans l’UI accueil).

## API REST
- `POST /api/checkin` `{nom, prenom, motif?}` -> ajoute en file, retourne `ticketId`.
- `GET /api/queue` -> patients en attente.
- `POST /api/next?room=2` -> prend le 1er en attente, marque `called`, annonce audio, émet socket `call`.
- `POST /api/recall?room=2` -> ré-annonce le dernier appelé de cette salle.
- `POST /api/skip?room=2` -> marque le patient courant de la salle comme `skipped`.
- `POST /api/skip?ticketId=4` -> marque absent/no show depuis l’accueil.
- `POST /api/requeue?ticketId=4` -> réinsère en fin de file.
- `POST /api/done?ticketId=4` -> marque `done`.
- `GET /api/history` -> 3 derniers appels (option `room` et `limit`).
- `GET /api/info` -> `{hostname, ip}`.

Socket.io émet `call` `{ticketId, nom, prenom, roomId, calledAt}` sur chaque appel/recall.

## Données
- SQLite persistant : `server/queue.db`.
- Table `patients_queue` avec colonnes (ticket_id, nom, prenom, motif, arrival_time, status, called_room, called_time, last_called).

## Service systemd
Copiez le service et activez-le pour démarrage automatique :
```bash
sudo cp systemd/clinic-queue.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable clinic-queue
sudo systemctl start clinic-queue
```
Chemin par défaut : `/home/pi/clinic-queue`. Adaptez `User`, `Group`, `WorkingDirectory` dans `systemd/clinic-queue.service` si besoin.

## Audio/TTS
- Carillon : `server/assets/chime.mp3` joué avant la voix.
- TTS (voix plus naturelle) :
  - prioritaire : `pico2wave` (SiVoX Pico) en français + `aplay`/`ffplay`
  - fallback : `espeak-ng` configuré en voix fr plus douce (féminine, vitesse modérée)
- Sortie : utilise la sortie audio par défaut (donc choisir l’enceinte Bluetooth comme périphérique principal). Si aucun moteur/lecteur n’est disponible, un log est affiché en fallback.

Pour une voix la plus naturelle possible sur le Pi :
```bash
sudo apt install libttspico-utils aplay ffmpeg
# test
pico2wave -l=fr-FR -w /tmp/test.wav "Le patient numéro dix est appelé à la salle un."
aplay /tmp/test.wav
```

## Notes d’usage
- Une seule app React avec sélection de mode `/` et mémorisation locale (localStorage).
- Mode Accueil : formulaire Nom/Prénom/Motif, affichage ticket généré, liste attente, bouton Absent/No-show + réinsertion fin de file, affichage hostname/IP.
- Mode Salle (1 ou 2) : boutons SUIVANT (retry automatique 2x sur échec réseau), RAPPELER (ré-annonce audio) et ABSENT/SKIP, affichage du dernier patient appelé.
- Mode Affichage : écran TV/tablette, met à jour en temps réel via socket.io, montre appel en cours, historique des 3 derniers, carrousel d’infos quand aucun appel.

## Dépannage rapide
- Vérifier l’IP : `curl http://localhost:3001/api/info`.
- Tester TTS : `pico2wave -l=fr-FR -w /tmp/test.wav "Test audio"` puis `aplay /tmp/test.wav`.
- Log service : `journalctl -u clinic-queue -f`.
