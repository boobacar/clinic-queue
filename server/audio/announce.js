const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const chimePath = path.join(__dirname, '../assets/chime.mp3');

const commandExists = (cmd) => spawnSync('which', [cmd]).status === 0;

const playFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.warn('[audio] Fichier audio manquant:', filePath);
    return;
  }
  let player;
  if (commandExists('mpg123')) {
    player = spawn('mpg123', ['-q', filePath]);
  } else if (commandExists('ffplay')) {
    player = spawn('ffplay', ['-nodisp', '-autoexit', filePath], { stdio: 'ignore' });
  } else if (commandExists('aplay')) {
    player = spawn('aplay', [filePath]);
  } else {
    console.warn('[audio] Aucun lecteur audio CLI disponible (mpg123/ffplay/aplay).');
    return;
  }
  player.on('error', (err) => console.warn('[audio] Lecture audio échouée', err.message));
};

const playWav = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.warn('[audio] Fichier WAV manquant:', filePath);
    return;
  }
  let player;
  if (commandExists('aplay')) {
    player = spawn('aplay', [filePath]);
  } else if (commandExists('ffplay')) {
    player = spawn('ffplay', ['-nodisp', '-autoexit', filePath], { stdio: 'ignore' });
  } else {
    console.warn('[audio] Aucun lecteur WAV (aplay/ffplay) disponible.');
    return;
  }
  player.on('error', (err) => console.warn('[audio] Lecture WAV échouée', err.message));
};

const speakText = (text) => {
  // Voix la plus naturelle: pico2wave (SiVoX Pico) en français
  if (commandExists('pico2wave') && (commandExists('aplay') || commandExists('ffplay'))) {
    const tmp = path.join(os.tmpdir(), `announce-${Date.now()}.wav`);
    const res = spawnSync('pico2wave', ['-l=fr-FR', '-w', tmp, text]);
    if (res.status === 0) {
      playWav(tmp);
      setTimeout(() => fs.existsSync(tmp) && fs.unlinkSync(tmp), 5000);
      return;
    }
  }
  if (commandExists('espeak-ng')) {
    // Profil espeak-ng plus doux: voix féminine fr, vitesse réduite
    const proc = spawn('espeak-ng', ['-v', 'fr+f4', '-s', '115', '-p', '30', text]);
    proc.on('error', (err) => console.warn('[audio] Synthèse vocale échouée', err.message));
    return;
  }
  console.warn('[audio] Aucun moteur TTS (pico2wave/espeak-ng) disponible.');
};

const announce = (ticketId, roomId) => {
  let roomSpoken;
  switch (roomId) {
    case 1:
      roomSpoken = 'une';
      break;
    case 2:
      roomSpoken = 'deux';
      break;
    default:
      roomSpoken = String(roomId);
  }
  const message = `Le patient ${ticketId} est attendu en salle ${roomSpoken}.`;
  // Jouer un carillon puis la synthèse vocale
  playFile(chimePath);
  setTimeout(() => speakText(message), 400);
};

module.exports = { announce };
