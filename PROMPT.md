Tu es un ingénieur senior full-stack. Génère un projet complet **queue handling + affichage salle d’attente + annonces vocales Bluetooth** pour une clinique dentaire, optimisé pour tourner sur un **Raspberry Pi Zero 2 W** en réseau local.  
**Crée tous les fichiers directement dans le workspace ouvert dans VSCode, en respectant l’arborescence demandée ci-dessous.**

## Contexte fonctionnel
- Les patients arrivent, vont à l’accueil.
- La secrétaire saisit **Nom, Prénom** (des doublons sont possibles).
- Quand elle valide, le patient est ajouté à une **file FIFO** (ordre d’arrivée).
- Le système attribue automatiquement un **numéro unique (Ticket)** visible à la secrétaire.
- Chaque salle de dentiste a un téléphone qui utilise la même app et choisit son mode “Salle 1” ou “Salle 2” avec un bouton **“SUIVANT”**.
- Quand un dentiste appuie sur “SUIVANT”, le prochain patient en attente est appelé et affecté à cette salle.
- La salle d’attente doit :
  1) **Afficher** l’appel (Ticket + Salle) en temps réel  
  2) **Annoncer** via un haut-parleur Bluetooth :  
     “Le patient numéro X est appelé à la salle Y.”

## Exigences UX

### App frontend UNIQUE
Une seule app React. Page d’accueil `/` = écran de sélection du mode :
- Boutons :
  - “Accueil / Secrétaire”
  - “Salle d’attente / Affichage”
  - “Salle 1”
  - “Salle 2”
- Quand un mode est choisi, rediriger vers la route correspondante.
- **Ajouter une checkbox/bouton “Se souvenir du choix sur cet appareil”.**
  - Si activé, sauvegarder dans localStorage :
    - `rememberMode = "true"`
    - `clinicMode = "reception" | "display" | "room1" | "room2"`
  - Si non activé, effacer `clinicMode` et mettre `rememberMode="false"`.
- **Auto-redirection :**
  - Au chargement de `/`, si `rememberMode="true"` et `clinicMode` existe, auto-rediriger vers la route correspondante (avec `replace:true`).
- **Ajouter un bouton “Oublier le mode mémorisé”** qui :
  - efface `clinicMode`
  - met `rememberMode="false"`
  - désactive la checkbox.
- Chaque mode doit être utilisable fullscreen sur tablette/TV/téléphone.

### Mode Accueil / Secrétaire
Route: `/reception`
- Formulaire : Nom, Prénom, (optionnel) Motif / Type soins.
- Bouton “Ajouter à la file”
- Afficher Ticket généré.
- Liste des patients en attente avec : Ticket, Nom, Prénom, Heure arrivée, Statut.
- Possibilité de marquer “Absent/No show” et de réinsérer en fin de file.

### Mode Salle Dentiste
Routes: `/room/1` et `/room/2`
- Affiche Salle X.
- Bouton géant “SUIVANT”
- Bouton “RAPPELER” (ré-annonce dernier patient de cette salle)
- Bouton “ABSENT / SKIP” pour le patient courant.
- Afficher le dernier patient appelé dans cette salle.

### Mode Salle d’attente / Affichage
Route: `/display`
- Fullscreen friendly.
- Zone principale : “EN COURS : Ticket X → Salle Y”.
- Historique des 3 derniers appels.
- Auto-rafraîchissement en temps réel (WebSocket).
- Entre les appels, afficher un carrousel simple de contenus éducatifs / promo (placeholders ok).

## Contraintes techniques
- Projet **local-first** (fonctionne sans internet).
- Les téléphones peuvent être connectés via des **répéteurs Wi-Fi/mesh** mais restent sur le **même LAN**.
- Backend léger, fiable.
- Stockage persistant **SQLite**.
- Temps réel via **socket.io**.
- Synthèse vocale offline FR (espeak-ng ou pico2wave).
- Lecture sur haut-parleur Bluetooth.
- **Fallback IP si `queue-hub.local` ne marche pas :**
  - ajouter `GET /api/info` => `{hostname, ip}`
  - afficher cette info dans le README et dans l’UI réception.
- **Côté room UI :**
  - si `POST /api/next` échoue (connexion faible), retry automatique **2 fois** en affichant un message “connexion faible, nouvel essai…”.
- README doit préciser : les répéteurs doivent être en mode **AP/Bridge/Repeater** (pas mode routeur/NAT).

## Stack imposée
- Backend : **Node.js + Express**
- DB : **SQLite (better-sqlite3 ou sqlite3)**
- WebSocket : **socket.io**
- Frontend : **React + Vite (une seule app)**
- Style simple (CSS/Tailwind au choix).
- Scripts npm dev/prod.

## Modèle de données
Table `patients_queue` :
- `ticket_id INTEGER PRIMARY KEY AUTOINCREMENT`
- `nom TEXT NOT NULL`
- `prenom TEXT NOT NULL`
- `motif TEXT NULL`
- `arrival_time DATETIME NOT NULL`
- `status TEXT NOT NULL`  // waiting | called | skipped | done
- `called_room INTEGER NULL`
- `called_time DATETIME NULL`
- `last_called BOOLEAN DEFAULT 0`

## API REST
- `POST /api/checkin`  
  Body: `{ nom, prenom, motif? }`  
  -> ajoute patient en file, retourne Ticket.
- `GET /api/queue`  
  -> liste patients waiting.
- `POST /api/next?room=2`  
  -> pop le 1er waiting, le marque called pour room=2, retourne patient.
- `POST /api/recall?room=2`  
  -> renvoie le dernier patient appelé par room=2.
- `POST /api/skip?room=2`  
  -> marque le patient courant de room=2 comme skipped.
- `POST /api/done?ticketId=4`  
  -> marque done.
- `GET /api/history`  
  -> 3 derniers appels.
- `GET /api/info`  
  -> `{hostname:"queue-hub.local", ip:"192.168.x.x"}`

## Audio / Bluetooth
Créer `audio/announce.js` :
- Fonction `announce(ticketId, roomId)`
- Joue `chime.mp3`
- Génère TTS FR :  
  Texte exact : `Le patient numéro ${ticketId} est appelé à la salle ${roomId}.`
- Joue sur sortie Bluetooth.
- Fallback si BT déconnecté (log uniquement).

## Structure attendue du repo
clinic-queue/
  server/
    index.js
    db.js
    routes.js
    socket.js
    audio/
      announce.js
    assets/
      chime.mp3
client/
  src/
    pages/
      HomeSelectMode.jsx
      Reception.jsx
      Display.jsx
      Room.jsx
    components/
      App.jsx (routes)
      main.jsx
package.json (root, scripts dev et prod)
README.md
systemd/
  clinic-queue.service

## Fonctionnement temps réel
- Quand `next()` est appelé :
  - update DB
  - emit socket.io `call` avec `{ticketId, nom, prenom, roomId}`
  - `display` écoute et met à jour UI
  - `announce()` est déclenché côté serveur.

## Livrables
1) Code complet backend + frontend unique.
2) README d’installation Pi + Bluetooth + réseau répéteur mode bridge/AP.
3) Service systemd auto-start.
4) Tout doit marcher en local :
   - Accueil ajoute patient
   - Salle “suivant” appelle FIFO
   - Écran se met à jour live
   - Audio annonce

Génère le projet complet maintenant.