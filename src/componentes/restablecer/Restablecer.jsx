import React, { useState } from "react";
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
  Alert,
  AlertIcon,
  Text,
  HStack,
  Icon
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const Restablecer = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
    match: false,
  });

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
      match: password === confirmPassword,
    };
    setPasswordErrors(requirements);
    setErrors({});
    return Object.values(requirements).every((val) => val === true);
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPasswordValue = e.target.value;
    setConfirmPassword(confirmPasswordValue);
    setPasswordErrors((prevErrors) => ({
      ...prevErrors,
      match: newPassword === confirmPasswordValue,
    }));
  };

  const handleResetPassword = async () => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (!validatePassword(newPassword)) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_backend}/restablecer`,
        { token, newPassword }
      );

      Swal.fire({
        title: "Contraseña actualizada",
        text: response.data.mensaje,
        icon: "success",
        confirmButtonText: "Aceptar",
      }).then(() => navigate("/inicio"));
    } catch (error) {
      const errorMessage = error.response?.data?.mensaje || "Error al restablecer la contraseña";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  return (
    <Box w="100vw" h="100vh" display="flex" justifyContent="center" alignItems="center" bg="gray.100">
      <Box p="8" bg="white" borderRadius="lg" w={{ base: "90%", md: "400px" }}>
        <VStack spacing="4" align="stretch">
          <FormControl isInvalid={errors.password}>
            <FormLabel>Nueva Contraseña</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={handlePasswordChange}
              />
              <InputRightElement>
                <IconButton
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  aria-label="Toggle Password Visibility"
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={errors.confirmPassword}>
            <FormLabel>Confirmar Contraseña</FormLabel>
            <InputGroup>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              <InputRightElement>
                <IconButton
                  icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  variant="ghost"
                  aria-label="Toggle Confirm Password Visibility"
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          {/* Indicadores de requisitos de contraseña */}
          <Box mt="2" textAlign="left" w="100%">
            <HStack alignItems="flex-start" spacing="1">
              <Icon as={passwordErrors.length ? CheckIcon : CloseIcon} color={passwordErrors.length ? "green.500" : "red.500"} boxSize={3} />
              <Text fontSize="sm" color={passwordErrors.length ? "green.500" : "red.500"}>Al menos 8 caracteres</Text>
            </HStack>
            <HStack alignItems="flex-start" spacing="1">
              <Icon as={passwordErrors.uppercase ? CheckIcon : CloseIcon} color={passwordErrors.uppercase ? "green.500" : "red.500"} boxSize={3} />
              <Text fontSize="sm" color={passwordErrors.uppercase ? "green.500" : "red.500"}>Al menos una mayúscula</Text>
            </HStack>
            <HStack alignItems="flex-start" spacing="1">
              <Icon as={passwordErrors.lowercase ? CheckIcon : CloseIcon} color={passwordErrors.lowercase ? "green.500" : "red.500"} boxSize={3} />
              <Text fontSize="sm" color={passwordErrors.lowercase ? "green.500" : "red.500"}>Al menos una minúscula</Text>
            </HStack>
            <HStack alignItems="flex-start" spacing="1">
              <Icon as={passwordErrors.number ? CheckIcon : CloseIcon} color={passwordErrors.number ? "green.500" : "red.500"} boxSize={3} />
              <Text fontSize="sm" color={passwordErrors.number ? "green.500" : "red.500"}>Al menos un número</Text>
            </HStack>
            <HStack alignItems="flex-start" spacing="1">
              <Icon as={passwordErrors.symbol ? CheckIcon : CloseIcon} color={passwordErrors.symbol ? "green.500" : "red.500"} boxSize={3} />
              <Text fontSize="sm" color={passwordErrors.symbol ? "green.500" : "red.500"}>Al menos un símbolo</Text>
            </HStack>
            <HStack alignItems="flex-start" spacing="1">
              <Icon as={passwordErrors.match ? CheckIcon : CloseIcon} color={passwordErrors.match ? "green.500" : "red.500"} boxSize={3} />
              <Text fontSize="sm" color={passwordErrors.match ? "green.500" : "red.500"}>Las contraseñas deben coincidir</Text>
            </HStack>
          </Box>

          <Button colorScheme="blue" mt="4" onClick={handleResetPassword}>
            Restablecer Contraseña
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Restablecer;
