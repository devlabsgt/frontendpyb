import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Alert,
  AlertIcon,
  FormErrorMessage,
  useToast, // Importa el hook de toast
} from "@chakra-ui/react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Asegúrate de instalar jwt-decode

const MiPerfil = () => {
  const [usuario, setUsuario] = useState({});
  const [errors, setErrors] = useState({});

  const toast = useToast(); // Inicializa el hook de toast

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token); // Decodifica el token para obtener el ID
          const userId = decoded.id; // Suponiendo que el ID está en el campo 'id'
          const response = await axios.get(
            `${process.env.REACT_APP_backend}/usuario/${userId}`
          );
          setUsuario(response.data);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario", error);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Solo permite que el campo teléfono contenga números
    if (name === "telefono") {
      if (/^\d*$/.test(value) && value.length <= 8) {
        setUsuario((prevUsuario) => ({ ...prevUsuario, [name]: value }));
      }
    } else {
      setUsuario((prevUsuario) => ({ ...prevUsuario, [name]: value }));
    }
  };

  const validateFields = () => {
    const newErrors = {};
    // Validar el correo electrónico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
      newErrors.email = "Ingrese un correo electrónico válido.";
    }
    // Validar el teléfono
    if (usuario.telefono && usuario.telefono.length !== 8) {
      newErrors.telefono = "El teléfono debe tener 8 dígitos numéricos.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    try {
      await axios.put(
        `${process.env.REACT_APP_backend}/usuario/${usuario._id}`,
        usuario
      );
      toast({
        title: "Cambios guardados.",
        description: "Tu perfil se ha actualizado correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      setErrors({ general: `Error: ${error.message}` });
    }
  };

  return (
    <Box p={5} maxWidth='500px' margin='0 auto'>
      <VStack spacing={4} align="flex-start">
        <FormControl isInvalid={errors.nombre}>
          <FormLabel>Nombre</FormLabel>
          <Input
            name="nombre"
            value={usuario.nombre || ""}
            onChange={handleInputChange}
          />
          {errors.nombre && (
            <FormErrorMessage>{errors.nombre}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl isInvalid={errors.email}>
          <FormLabel>Email</FormLabel>
          <Input
            name="email"
            value={usuario.email || ""}
            onChange={handleInputChange}
          />
          {errors.email && (
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl isInvalid={errors.telefono}>
          <FormLabel>Teléfono</FormLabel>
          <Input
            name="telefono"
            value={usuario.telefono || ""}
            onChange={handleInputChange}
            maxLength={8}
          />
          {errors.telefono && (
            <FormErrorMessage>{errors.telefono}</FormErrorMessage>
          )}
        </FormControl>
      </VStack>
      <Button colorScheme="green" onClick={handleSave} mt={4}>
        Guardar
      </Button>
    </Box>
  );
};

export default MiPerfil;
