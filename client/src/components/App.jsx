import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomeSelectMode from '../pages/HomeSelectMode';
import Reception from '../pages/Reception';
import Display from '../pages/Display';
import Room from '../pages/Room';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeSelectMode />} />
      <Route path="/reception" element={<Reception />} />
      <Route path="/display" element={<Display />} />
      <Route path="/room/:id" element={<Room />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
