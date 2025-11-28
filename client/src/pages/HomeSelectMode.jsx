import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const modeRoutes = {
  reception: '/reception',
  display: '/display',
  room1: '/room/1',
  room2: '/room/2',
};

const storage = {
  rememberKey: 'rememberMode',
  modeKey: 'clinicMode',
};

const HomeSelectMode = () => {
  const navigate = useNavigate();
  const [remember, setRemember] = useState(localStorage.getItem(storage.rememberKey) === 'true');
  const [selected, setSelected] = useState(localStorage.getItem(storage.modeKey) || '');

  useEffect(() => {
    if (remember && selected) {
      navigate(modeRoutes[selected] || '/', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (mode) => {
    setSelected(mode);
    if (remember) {
      localStorage.setItem(storage.modeKey, mode);
      localStorage.setItem(storage.rememberKey, 'true');
    } else {
      localStorage.removeItem(storage.modeKey);
      localStorage.setItem(storage.rememberKey, 'false');
    }
    navigate(modeRoutes[mode]);
  };

  const handleRememberToggle = (checked) => {
    setRemember(checked);
    if (!checked) {
      localStorage.setItem(storage.rememberKey, 'false');
      localStorage.removeItem(storage.modeKey);
    } else {
      localStorage.setItem(storage.rememberKey, 'true');
      if (selected) {
        localStorage.setItem(storage.modeKey, selected);
      }
    }
  };

  const clearRemembered = () => {
    setRemember(false);
    setSelected('');
    localStorage.setItem(storage.rememberKey, 'false');
    localStorage.removeItem(storage.modeKey);
  };

  return (
    <div className="layout-center">
      <div className="card" style={{ maxWidth: 720, width: '100%' }}>
        <div className="headline">
          <div>
            <h1>Choisissez le mode</h1>
            <p className="subtle">
              Une seule application pour l'accueil, les salles et l'affichage d'attente.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => handleRememberToggle(e.target.checked)}
            />
            Se souvenir du choix
          </label>
        </div>

        <div className="grid-buttons">
          <button className="btn" onClick={() => handleNavigate('reception')}>
            Accueil / Secrétaire
          </button>
          <button className="btn" onClick={() => handleNavigate('display')}>
            Salle d’attente / Affichage
          </button>
          <button className="btn" onClick={() => handleNavigate('room1')}>
            Salle 1
          </button>
          <button className="btn" onClick={() => handleNavigate('room2')}>
            Salle 2
          </button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={clearRemembered}>
            Oublier le mode mémorisé
          </button>
          {selected && (
            <div className="badge">
              Mémorisé: {selected.replace('room', 'Salle ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeSelectMode;
