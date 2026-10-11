import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppBackground from './components/AppBackground';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import IrrigationAdvisory from './pages/IrrigationAdvisory';
import Sensors from './pages/Sensors';
import CropInfo from './pages/CropInfo';
import Alerts from './pages/Alerts';
import About from './pages/About';
import { getToken } from './services/api';

function App() {
  const [isAuth, setIsAuth] = React.useState(Boolean(getToken()));

  return (
    <BrowserRouter>
      <AppBackground />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setAuth={setIsAuth} />} />
        <Route path="/register" element={<Register setAuth={setIsAuth} />} />
        <Route path="/app" element={isAuth ? <Layout setAuth={setIsAuth} /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="advisory" element={<IrrigationAdvisory />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="crop" element={<CropInfo />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
