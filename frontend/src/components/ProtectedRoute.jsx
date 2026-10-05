import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  // Si no hay token de sesión, redirige al Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, permite ver la ruta solicitada
  return <Outlet />;
}