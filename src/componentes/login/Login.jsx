import React, { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, Heading, VStack, Image, InputGroup, InputRightElement, IconButton, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import logo from '../../img/logo.png';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast(); // Hook de Chakra UI para notificaciones

  // Función para iniciar sesión
  const onFinish = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_backend}/iniciarSesion`, { email, password });
      const { token } = response.data;

      localStorage.setItem("token", token);

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Credenciales incorrectas. Por favor, intenta de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
        {/* Logo */}
        <Box textAlign="center" mb="4">
          <Image src={logo} alt="Logo" maxW="300px" mx="auto" />
        </Box>

        {/* Título */}
        <Heading as="h2" size="lg" textAlign="center" mb="6" color="blue.800">
          Iniciar Sesión
        </Heading>

        {/* Formulario */}
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

            {/* Botones */}
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
              onClick={handleCancel}
              width="full"
            >
              Cancelar
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
