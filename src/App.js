import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./componentes/login/Login";
import Dashboard from "./componentes/dashboard/Dashboard";
import Verificacion from "./componentes/verificacion/Verificacion";
import Restablecer from "./componentes/restablecer/Restablecer";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios"; // Importa axios para hacer solicitudes
import Home from "./componentes/home/homes";

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleTokenExpiration = async () => {
      // Intenta decodificar el token para obtener el ID del usuario
      let userId = null;
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          userId = decodedToken.id; // Ajusta esto según tu payload
        } catch (error) {
          console.error("Error al decodificar el token", error);
        }
      }

      // Intenta cambiar el estado de sesión a false en el servidor
      if (userId) {
        try {
          await axios.put(
            `${process.env.REACT_APP_backend}/usuario/${userId}/cerrarsesion`
          );
        } catch (error) {
          console.error(
            "Error al actualizar el estado de sesión en el servidor",
            error
          );
        }
      }

      // Remueve el token del almacenamiento local y muestra el mensaje de expiración
      localStorage.removeItem("token");
      Swal.fire({
        title: "Sesión expirada",
        text: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
        icon: "info",
        confirmButtonText: "Aceptar",
      }).then(() => {
        window.location.href = "/";
      });
    };

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiration = (decodedToken.exp - currentTime) * 1000;

        if (timeUntilExpiration > 0) {
          const timer = setTimeout(handleTokenExpiration, timeUntilExpiration);
          return () => clearTimeout(timer);
        } else {
          handleTokenExpiration();
        }
      } catch (error) {
        handleTokenExpiration();
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
      <Route path="/" element={<Home />} />
      <Route path="/inicio" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/verificar" element={<Verificacion />} />
      <Route path="/restablecer" element={<Restablecer />} />
    </Routes>
  );
}

export default App;
