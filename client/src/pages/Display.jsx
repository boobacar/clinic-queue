import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL, apiFetch } from '../api';
import logo from '../assets/logo.jpg';

const slides = [
  {
    title: 'Hygiène quotidienne',
    body: 'Brossez 2 minutes, 2 fois par jour, avec une brosse souple et un dentifrice fluoré.',
  },
  {
    title: 'Avant de dormir',
    body: 'Le brossage du soir est le plus important : aucune collation après le brossage.',
  },
  {
    title: 'Prévenir les caries',
    body: 'Limitez les grignotages sucrés entre les repas et buvez de l’eau plutôt que des sodas.',
  },
  {
    title: 'Fil dentaire',
    body: 'Utilisez le fil dentaire ou brossettes interdentaires au moins une fois par jour.',
  },
  {
    title: 'Enfants',
    body: 'Un contrôle dentaire est recommandé tous les 6 à 12 mois dès les premières dents.',
  },
  {
    title: 'Douleur ou saignement',
    body: 'En cas de douleur persistante ou de gencives qui saignent, consultez sans attendre.',
  },
  {
    title: 'Tabac',
    body: 'Le tabac tache les dents, fragilise les gencives et augmente fortement le risque de cancer de la bouche.',
  },
  {
    title: 'Boissons acides',
    body: 'Les sodas, jus d’agrumes et boissons énergétiques ramollissent l’émail : évitez d’en siroter toute la journée.',
  },
  {
    title: 'Grossesse',
    body: 'Pendant la grossesse, un contrôle dentaire est recommandé car les gencives sont plus fragiles.',
  },
  {
    title: 'Brosse à dents',
    body: 'Changez de brosse à dents tous les 3 mois, ou dès que les poils sont évasés.',
  },
  {
    title: 'Appareils dentaires',
    body: 'Avec un appareil, le brossage doit être encore plus soigneux : insister autour des bagues et brackets.',
  },
  {
    title: 'Rendez-vous de contrôle',
    body: 'Même sans douleur, un contrôle régulier permet de détecter tôt les caries et problèmes de gencives.',
  },
];

const mapHistory = (rows) =>
  rows.map((item) => ({
    ticketId: item.ticket_id,
    nom: item.nom,
    prenom: item.prenom,
    roomId: item.called_room,
    calledAt: item.called_time,
  }));

const Display = () => {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [audioEnabled] = useState(true);
  const [chime] = useState(() =>
    typeof Audio !== 'undefined' ? new Audio('/assets/chime.mp3') : null
  );

  const loadHistory = async () => {
    try {
      const data = await apiFetch('/api/history');
      const mapped = mapHistory(data);
      setHistory(mapped.slice(0, 3));
      if (!current && mapped.length > 0) {
        setCurrent(mapped[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => setSlideIndex((prev) => (prev + 1) % slides.length), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('call', (payload) => {
      const call = {
        ticketId: payload.ticketId,
        nom: payload.nom,
        prenom: payload.prenom,
        roomId: payload.roomId,
        calledAt: payload.calledAt,
      };
      setCurrent(call);
      setHistory((prev) => [call, ...prev].slice(0, 3));

      if (chime) {
        try {
          chime.currentTime = 0;
          // On tente de jouer le bip sur le navigateur (TV)
          // après interaction utilisateur, les navigateurs l'autorisent généralement.
          chime.play().catch(() => {});
        } catch (e) {
          console.error('Erreur lecture chime navigateur', e);
        }
      }

      if (audioEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        let roomSpoken;
        switch (call.roomId) {
          case 1:
            roomSpoken = 'une';
            break;
          case 2:
            roomSpoken = 'deux';
            break;
          case 3:
            roomSpoken = 'trois';
            break;
          default:
            roomSpoken = String(call.roomId);
        }
        const text = `Le patient ${call.ticketId} est attendu en salle ${roomSpoken}.`;
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'fr-FR';
          utter.rate = 0.9;
          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.error('Erreur synthèse vocale navigateur', e);
        }
      }
    });
    return () => socket.close();
  }, [audioEnabled]);

  const activeSlide = slides[slideIndex];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#ffe4f1_0,#fecaca_25%,#9f1239_55%,#020617_100%)] text-slate-50 flex items-stretch justify-center px-4 py-6 sm:px-8 sm:py-10">
      <div className="w-full max-w-6xl grid gap-6 lg:grid-cols-[2.2fr,1.1fr]">
        <div className="rounded-3xl border border-slate-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-900/90 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Clinique Dentaire Dabia"
                className="h-14 w-14 rounded-full object-cover shadow-md shadow-pink-300/60"
              />
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-pink-200">
                  Clinique Dentaire
                </div>
                <div className="text-2xl font-extrabold text-pink-300">Dabia</div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-100">
                Salle d’attente — affichage en direct
              </p>
              <p className="text-sm text-pink-200">
                Merci de patienter, vous serez appelé par votre numéro.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-xl font-semibold text-sky-100">En cours</h2>
            <div className="mt-3 flex items-baseline gap-4">
              <div className="text-[4.5rem] leading-none sm:text-[5.5rem] font-extrabold tracking-tight">
                Ticket {current ? current.ticketId : '—'}
              </div>
              {current && (
                <div className="text-pink-300 font-semibold text-[4.5rem] leading-none sm:text-[5.5rem] tracking-tight">
                  → Salle {current.roomId}
                </div>
              )}
            </div>
            {current && (
              <p className="mt-3 text-3xl sm:text-[2.6rem] font-medium">
                {current.prenom} {current.nom}
              </p>
            )}
            {!current && (
              <p className="mt-4 text-2xl text-slate-100">
                En attente du prochain patient...
              </p>
            )}

            <div className="mt-20">
              <h3 className="text-4xl font-semibold text-pink-300">
                Conseil du dentiste
              </h3>
            </div>
            <div className="mt-2 rounded-2xl bg-white/10 px-4 py-3 max-w-full">
              <p className="mt-1 text-base sm:text-3xl font-semibold text-slate-50">
                {activeSlide.title}
              </p>
              <p className="mt-0.5 text-2xl text-slate-100">
                {activeSlide.body}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-4 sm:p-5">
            <h3 className="text-base font-semibold mb-2.5">3 derniers appels</h3>
            <div className="space-y-2.5">
              {history.length === 0 && (
                <div className="text-sm text-slate-300">Aucun appel pour le moment.</div>
              )}
              {history.map((item) => (
                <div
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm sm:text-base"
                  key={`${item.ticketId}-${item.calledAt}`}
                >
                  <div>
                    <strong>Ticket {item.ticketId}</strong> — Salle {item.roomId}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200">
                    {new Date(item.calledAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Display;
