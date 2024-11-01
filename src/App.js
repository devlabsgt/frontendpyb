import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./componentes/login/Login";
import Dashboard from "./componentes/dashboard/Dashboard";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2"; // Importa SweetAlert2
import Home from "./componentes/home/homes";

// Componente para proteger las rutas privadas
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleTokenExpiration = () => {
      localStorage.removeItem("token");
      Swal.fire({
        title: "Sesión expirada",
        text: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
        icon: "info",
        confirmButtonText: "Aceptar",
      }).then(() => {
        window.location.href = "/"; // Redirige al inicio de sesión
      });
    };

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        console.log("Horra actual>> " + currentTime);
        const timeUntilExpiration = (decodedToken.exp - currentTime) * 1000;

        if (timeUntilExpiration > 0) {
          // Configura el temporizador para que expire en el momento exacto
          const timer = setTimeout(handleTokenExpiration, timeUntilExpiration);
          return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta
        } else {
          handleTokenExpiration(); // Si el token ya ha expirado, cierra sesión de inmediato
        }
      } catch (error) {
        handleTokenExpiration(); // Si hay un error al decodificar, cierra sesión
      }
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/" state={{ from: location }} />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Ruta para iniciar sesión */}
      <Route path="/" element={<Home />} />
      <Route path="/inicio" element={<Login />} />
      {/* Ruta protegida para el dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
//TEST
