import React, { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, Heading, VStack, Image, InputGroup, InputRightElement, IconButton, FormErrorMessage, Link } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import Swal from "sweetalert2";
import logo from '../../img/logo.png';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetField, setShowResetField] = useState(false); 
  const [resetEmail, setResetEmail] = useState(""); 
  const [emailError, setEmailError] = useState(""); 
  const navigate = useNavigate();

  // Validación de formato de correo electrónico
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Función para iniciar sesión
  const onFinish = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log(`${process.env.REACT_APP_backend}/iniciarSesion`);
      const response = await axios.post(`${process.env.REACT_APP_backend}/iniciarSesion`, { email, password });
      const { token, activo, verificado } = response.data;
      console.log()
      if (!activo) {
        Swal.fire({
          title: "Usuario desactivado",
          text: "Tu cuenta ha sido desactivada y ya no tienes acceso.",
          icon: "error",
          confirmButtonText: "Aceptar"
        });
        setLoading(false);
        return;
      }

      if (!verificado) {
        Swal.fire({
          title: "Usuario no verificado",
          text: "Revisa tu correo electrónico para verificar tu cuenta.",
          icon: "warning",
          confirmButtonText: "Aceptar"
        });
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);

      Swal.fire({
        title: "Inicio de sesión exitoso",
        text: "Bienvenido de nuevo!",
        icon: "success",
        confirmButtonText: "Aceptar"
      });

      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.mensaje || "Error de inicio de sesión";
      
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Aceptar"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la recuperación de contraseña
  const handlePasswordReset = async () => {
    if (!isValidEmail(resetEmail)) {
      setEmailError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_backend}/recuperacion`, { email: resetEmail });
      Swal.fire({
        title: "Correo enviado",
        text: response.data.mensaje,
        icon: "success",
        confirmButtonText: "Aceptar"
      });
      setShowResetField(false); // Oculta el campo de recuperación después de enviar el correo
      setEmailError("");
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.mensaje || "El usuario no existe.",
        icon: "error",
        confirmButtonText: "Aceptar"
      });
    }
  };

  const handleCancelReset = () => {
    setShowResetField(false);
    setResetEmail("");
    setEmailError("");
  };

  const handleCancelLogin = () => {
    navigate("/");
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bg="white.100"
    >
      <Box
        w={{ base: "90%", md: "400px" }}
        p="8"
        bg="white.100"
        borderRadius="lg"
      >
        <Box textAlign="center" mb="4">
          <Image src={logo} alt="Logo" maxW="300px" mx="auto" />
        </Box>

        <Heading as="h2" size="lg" textAlign="center" mb="6" color="blue.800">
          Iniciar Sesión
        </Heading>

        {!showResetField ? (
          // Formulario de inicio de sesión
          <form onSubmit={onFinish}>
            <VStack spacing="4">
              <FormControl id="email" isRequired>
                <FormLabel color="blue.800">Correo electrónico</FormLabel>
                <Input
                  type="email"
                  placeholder="Ingrese su correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="white"
                  borderColor="blue.200"
                  _hover={{ borderColor: "blue.400" }}
                />
              </FormControl>

              <FormControl id="password" isRequired>
                <FormLabel color="blue.800">Contraseña</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="white"
                    borderColor="blue.200"
                    _hover={{ borderColor: "blue.400" }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                      tabIndex="-1"
                      color="blue.600"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                colorScheme="blue"
                bg="blue.600"
                color="white"
                _hover={{ bg: "blue.700" }}
                type="submit"
                isLoading={loading}
                loadingText="Iniciando sesión..."
                width="full"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="outline"
                color="blue.600"
                borderColor="blue.600"
                _hover={{ bg: "white.100" }}
                onClick={handleCancelLogin}
                width="full"
              >
                Cancelar
              </Button>
              <Link color="blue.600" onClick={() => setShowResetField(true)}>
                Olvidé mi contraseña
              </Link>
            </VStack>
          </form>
        ) : (
          // Campo de recuperación de contraseña
          <VStack spacing="4">
            <FormControl id="resetEmail" isRequired isInvalid={!!emailError}>
              <FormLabel color="blue.800">Correo electrónico</FormLabel>
              <Input
                type="email"
                placeholder="Ingrese su correo electrónico para recuperación"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                bg="white"
                borderColor="blue.200"
                _hover={{ borderColor: "blue.400" }}
              />
              <FormErrorMessage>{emailError}</FormErrorMessage>
            </FormControl>

            <Button
              colorScheme="blue"
              bg="blue.600"
              color="white"
              _hover={{ bg: "blue.700" }}
              onClick={handlePasswordReset}
              width="full"
            >
              Enviar correo de recuperación
            </Button>
            <Button
              variant="outline"
              color="blue.600"
              borderColor="blue.600"
              _hover={{ bg: "white.100" }}
              onClick={handleCancelReset}
              width="full"
            >
              Cancelar
            </Button>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default Login;
