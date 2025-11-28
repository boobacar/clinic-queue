import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL, apiFetch } from '../api';

const slides = [
  {
    title: 'Hygiène bucco-dentaire',
    body: 'Brossez 2 minutes, 2 fois par jour. Remplacez votre brosse tous les 3 mois.',
  },
  {
    title: 'Prévention caries',
    body: 'Une alimentation pauvre en sucres entre les repas aide à protéger l’émail.',
  },
  {
    title: 'Suivi',
    body: 'Un contrôle régulier tous les 6 mois permet de détecter tôt les problèmes.',
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
    const id = setInterval(() => setSlideIndex((prev) => (prev + 1) % slides.length), 6000);
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
    });
    return () => socket.close();
  }, []);

  const activeSlide = slides[slideIndex];

  return (
    <div className="display-screen">
      <div className="display-card">
        <p className="subtle" style={{ color: '#cbd5e1' }}>
          Salle d’attente — affichage en direct
        </p>
        <h1 className="ticker">
          {current ? (
            <>
              Ticket {current.ticketId} <span style={{ color: '#93c5fd' }}>→ Salle {current.roomId}</span>
            </>
          ) : (
            'En attente du prochain patient'
          )}
        </h1>
        {current && (
          <p style={{ fontSize: 24, marginTop: 8 }}>
            {current.nom} {current.prenom}
          </p>
        )}

        <div className="history">
          <h3 style={{ marginBottom: 4 }}>3 derniers appels</h3>
          {history.length === 0 && <div>Aucun appel pour le moment.</div>}
          {history.map((item) => (
            <div className="history-item" key={`${item.ticketId}-${item.calledAt}`}>
              <div>
                <strong>Ticket {item.ticketId}</strong> — Salle {item.roomId}
              </div>
              <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                {new Date(item.calledAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {!current && (
          <div className="carousel">
            <h3>{activeSlide.title}</h3>
            <p style={{ fontSize: 18, margin: 0 }}>{activeSlide.body}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Display;
