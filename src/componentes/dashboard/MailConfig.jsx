import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
  useToast,
} from "@chakra-ui/react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const MailConfig = () => {
  const [config, setConfig] = useState({
    emailSender: '',
    emailPassword: '',
    smtpHost: '',
    smtpPort: '',
    telefono: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    const fetchMailConfig = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_backend}/mailConfig`,
          getAuthHeaders()
        );
        setConfig(response.data);
      } catch (error) {
        console.error("Error al obtener la configuración de correo", error);
      }
    };

    fetchMailConfig();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  const validateFields = () => {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.emailSender)) {
      newErrors.emailSender = "Ingrese un correo electrónico válido.";
    }
    if (config.telefono && config.telefono.length !== 8) {
      newErrors.telefono = "El teléfono debe tener 8 dígitos numéricos.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_backend}/mailConfig`,
        config,
        getAuthHeaders()
      );
      toast({
        title: "Configuración actualizada.",
        description: "La configuración de correo se ha actualizado correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setConfig(response.data.config);
    } catch (error) {
      console.error("Error al guardar la configuración de correo:", error);
      setErrors({ general: `Error: ${error.message}` });
    }
  };

  return (
    <Box p={5} maxWidth="500px" margin="0 auto">
      <VStack spacing={4} align="flex-start">
        <FormControl isInvalid={errors.emailSender}>
          <FormLabel>Email Remitente</FormLabel>
          <Input
            name="emailSender"
            value={config.emailSender || ""}
            onChange={handleInputChange}
          />
          {errors.emailSender && (
            <FormErrorMessage>{errors.emailSender}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl>
          <FormLabel>Contraseña de Correo</FormLabel>
          <InputGroup>
            <Input
              name="emailPassword"
              type={showPassword ? "text" : "password"}
              value={config.emailPassword || ""}
              onChange={handleInputChange}
            />
            <InputRightElement>
              <IconButton
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel>SMTP Host</FormLabel>
          <Input
            name="smtpHost"
            value={config.smtpHost || ""}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl>
          <FormLabel>SMTP Puerto</FormLabel>
          <Input
            name="smtpPort"
            type="number"
            value={config.smtpPort || ""}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl isInvalid={errors.telefono}>
          <FormLabel>Teléfono</FormLabel>
          <Input
            name="telefono"
            value={config.telefono || ""}
            onChange={handleInputChange}
            maxLength={8}
          />
          {errors.telefono && (
            <FormErrorMessage>{errors.telefono}</FormErrorMessage>
          )}
        </FormControl>
      </VStack>
      <Button colorScheme="blue" onClick={handleSave} mt={4}>
        Guardar Configuración
      </Button>
    </Box>
  );
};

export default MailConfig;