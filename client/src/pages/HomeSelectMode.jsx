import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const modeRoutes = {
  reception: '/reception',
  display: '/display',
  room1: '/room/1',
  room2: '/room/2',
  room3: '/room/3',
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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl rounded-3xl bg-white/90 shadow-xl border border-pink-100 px-6 py-6 sm:px-8 sm:py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Clinique Dentaire Dabia"
              className="h-12 w-12 rounded-full object-cover shadow-md shadow-pink-300/60"
            />
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Clinique Dentaire
              </div>
              <div className="text-xl font-extrabold text-clinic-pink-dark">Dabia</div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-clinic-pink focus:ring-clinic-pink"
              checked={remember}
              onChange={(e) => handleRememberToggle(e.target.checked)}
            />
            Se souvenir du choix
          </label>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Choisissez le mode
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Une seule application pour l&apos;accueil, les salles et l&apos;affichage d&apos;attente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="w-full rounded-xl bg-gradient-to-r from-clinic-pink to-clinic-pink-dark text-white font-semibold py-3.5 shadow-lg shadow-pink-300/40 hover:-translate-y-0.5 hover:shadow-pink-400/60 transition"
            onClick={() => handleNavigate('reception')}
          >
            Accueil / Secrétaire
          </button>
          <button
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold py-3.5 shadow-lg shadow-sky-300/40 hover:-translate-y-0.5 hover:shadow-sky-400/60 transition"
            onClick={() => handleNavigate('display')}
          >
            Salle d’attente / Affichage
          </button>
          <button
            className="w-full rounded-xl bg-white text-clinic-pink-dark font-semibold py-3.5 border border-pink-200 shadow-sm hover:bg-pink-50 transition"
            onClick={() => handleNavigate('room1')}
          >
            Salle 1
          </button>
          <button
            className="w-full rounded-xl bg-white text-clinic-pink-dark font-semibold py-3.5 border border-pink-200 shadow-sm hover:bg-pink-50 transition"
            onClick={() => handleNavigate('room2')}
          >
            Salle 2
          </button>
          <button
            className="w-full rounded-xl bg-white text-clinic-pink-dark font-semibold py-3.5 border border-pink-200 shadow-sm hover:bg-pink-50 transition"
            onClick={() => handleNavigate('room3')}
          >
            Salle 3
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            onClick={clearRemembered}
          >
            Oublier le mode mémorisé
          </button>
          {selected && (
            <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
              Mémorisé: {selected.replace('room', 'Salle ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeSelectMode;
