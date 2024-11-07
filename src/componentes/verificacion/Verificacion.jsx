import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const Verificacion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const verifyAccount = async () => {
      const query = new URLSearchParams(location.search);
      const token = query.get("token");

      if (token) {
        try {
          const response = await axios.put(`${process.env.REACT_APP_backend}/verificar`, { token });
          Swal.fire({
            title: "Cuenta verificada",
            text: response.data.mensaje,
            icon: "success",
            confirmButtonText: "Aceptar",
          }).then(() => navigate("/inicio"));
        } catch (error) {
          Swal.fire({
            title: "Error de verificación",
            text: error.response?.data?.mensaje || "Ocurrió un error en la verificación",
            icon: "error",
            confirmButtonText: "Aceptar",
          }).then(() => navigate("/"));
        }
      } else {
        Swal.fire({
          title: "Token no válido",
          text: "No se encontró un token de verificación válido",
          icon: "error",
          confirmButtonText: "Aceptar",
        }).then(() => navigate("/"));
      }
    };

    verifyAccount();
  }, [location, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Verificando tu cuenta...</h2>
    </div>
  );
};

export default Verificacion;
