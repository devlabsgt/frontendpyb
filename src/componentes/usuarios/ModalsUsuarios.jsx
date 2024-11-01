import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Select,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  Box,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormErrorMessage,
  Card,
  CardHeader,
  CardBody,
  CardFooter
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";


export const ModalVerUsuario = ({ isOpen, onClose, usuario,getAuthHeaders }) => {
  const [editableUsuario, setEditableUsuario] = useState(usuario || {});
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setEditableUsuario(usuario || {});
    setSuccessMessage("");
  }, [usuario]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      if (/^\d{0,8}$/.test(value)) {
        setEditableUsuario((prevUsuario) => ({ ...prevUsuario, [name]: value }));
      }
    } else {
      setEditableUsuario((prevUsuario) => ({ ...prevUsuario, [name]: value }));
    }
  };

  const validateFields = () => {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableUsuario.email)) {
      newErrors.email = "Ingrese un correo electrónico válido.";
    }
    if (editableUsuario.telefono.length !== 8) {
      newErrors.telefono = "El teléfono debe tener 8 dígitos numéricos.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    try {
      await axios.put(`${process.env.REACT_APP_backend}/usuario/${editableUsuario._id}`, editableUsuario, getAuthHeaders());
      setSuccessMessage("Cambios guardados correctamente");
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      setErrors({ general: `Error: ${error.message}` });
    }
  };

  const handleCancel = () => {
    setEditableUsuario(usuario);
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody>
          <Card >
            <CardHeader>
              <Text fontWeight="bold" fontSize="lg">{editableUsuario.nombre}</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="flex-start">
                <FormControl isInvalid={errors.nombre}>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    name="nombre"
                    value={editableUsuario.nombre || ""}
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
                    value={editableUsuario.email || ""}
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
                    value={editableUsuario.telefono || ""}
                    onChange={handleInputChange}
                    maxLength={8}
                  />
                  {errors.telefono && (
                    <FormErrorMessage>{errors.telefono}</FormErrorMessage>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    name="rol"
                    value={editableUsuario.rol || ""}
                    onChange={handleInputChange}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Encargado">Encargado</option>
                  </Select>
                </FormControl>
              </VStack>
              {successMessage && (
                <Alert status="success" mt={4}>
                  <AlertIcon />
                  {successMessage}
                </Alert>
              )}
              {errors.general && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  {errors.general}
                </Alert>
              )}
            </CardBody>
   
          </Card>
        </ModalBody>
        <ModalFooter>
             <Button colorScheme="green" onClick={handleSave} mr={2}>
                Guardar
              </Button>
          <Button colorScheme="gray" mr={3} onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};





export const ModalAddUsuario = ({ isOpen, onClose, obtenerUsuarios, getAuthHeaders }) => {
  const ROLES = ["Administrador", "Encargado"];
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", telefono: "", rol: ROLES[1], password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
    match: false,
  });
  const [alertMessage, setAlertMessage] = useState(null); // Estado para el mensaje de alerta
  const [alertStatus, setAlertStatus] = useState("error"); // Estado para el tipo de alerta

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{8}$/;

  const validateFields = () => {
    const newErrors = {};
    if (!nuevoUsuario.nombre) newErrors.nombre = "El nombre es requerido.";
    if (!nuevoUsuario.email) newErrors.email = "El correo electrónico es requerido.";
    else if (!emailRegex.test(nuevoUsuario.email)) newErrors.email = "Ingrese un correo electrónico válido.";
    if (!nuevoUsuario.telefono) newErrors.telefono = "El teléfono es requerido.";
    else if (!phoneRegex.test(nuevoUsuario.telefono.replace(/\s+/g, ""))) newErrors.telefono = "El teléfono debe contener exactamente 8 dígitos numéricos.";
    if (!nuevoUsuario.fechaNacimiento) newErrors.fechaNacimiento = "La fecha de nacimiento es requerida.";
    if (!nuevoUsuario.password) newErrors.password = "La contraseña es requerida.";
    if (!confirmPassword) newErrors.confirmPassword = "La confirmación de la contraseña es requerida.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPasswordRequirements = (password) => {
    const errors = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
      match: password === confirmPassword,
    };
    setPasswordErrors(errors);
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNuevoUsuario({ ...nuevoUsuario, password });
    checkPasswordRequirements(password);
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPasswordValue = e.target.value;
    setConfirmPassword(confirmPasswordValue);
    setPasswordErrors((prevErrors) => ({
      ...prevErrors,
      match: nuevoUsuario.password === confirmPasswordValue,
    }));
  };

  const handleAddUsuario = async () => {
    if (!validateFields()) return;

    if (!Object.values(passwordErrors).every(Boolean)) {
      setErrors({ ...errors, password: "La contraseña debe cumplir con todos los requisitos." });
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_backend}/usuario`, nuevoUsuario,getAuthHeaders());
      obtenerUsuarios();
      onClose();
      setNuevoUsuario({ nombre: "", email: "", telefono: "", rol: ROLES[1], password: "" });
      setConfirmPassword("");

      // Configurar mensaje de éxito
      setAlertMessage("El usuario ha sido añadido correctamente.");
      setAlertStatus("success");
    } catch (error) {
      console.error("Error al añadir el usuario", error);

      const errorMessage = error.response?.data?.mensaje || "Hubo un problema al añadir el usuario. Inténtalo de nuevo.";
      setAlertMessage(errorMessage);
      setAlertStatus("error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Añadir Usuario</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {alertMessage && (
            <Alert status={alertStatus} mb="4">
              <AlertIcon />
              <Box>
                <AlertTitle>{alertStatus === "error" ? "Error" : "Éxito"}</AlertTitle>
                <AlertDescription>{alertMessage}</AlertDescription>
              </Box>
            </Alert>
          )}
          <VStack spacing="4">
            <FormControl isRequired isInvalid={errors.nombre}>
              <FormLabel>Nombre</FormLabel>
              <Input value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} />
              <FormErrorMessage>{errors.nombre}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={errors.email}>
              <FormLabel>Email</FormLabel>
              <Input value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={errors.telefono}>
              <FormLabel>Teléfono</FormLabel>
              <Input
                value={nuevoUsuario.telefono}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value.replace(/\D/g, "") })}
                maxLength={8}
              />
              <FormErrorMessage>{errors.telefono}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={errors.fechaNacimiento}>
              <FormLabel>Fecha de Nacimiento</FormLabel>
              <Input
                type="date"
                value={nuevoUsuario.fechaNacimiento}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, fechaNacimiento: e.target.value })}
              />
              <FormErrorMessage>{errors.fechaNacimiento}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Rol</FormLabel>
              <Select value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired isInvalid={errors.password}>
              <FormLabel>Contraseña</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={nuevoUsuario.password}
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

            <FormControl isRequired isInvalid={errors.confirmPassword}>
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
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>

            {/* Indicadores de requisitos de contraseña con iconos */}
            <Box mt="2" textAlign="left" w="100%">
              <HStack alignItems="flex-start" spacing="1">
                <Icon as={passwordErrors.length ? CheckIcon : CloseIcon} color={passwordErrors.length ? "green.500" : "red.500"} boxSize={3} mr="1" alignSelf="center"/>
                <Text fontSize="sm" color={passwordErrors.length ? "green.500" : "red.500"} mt="1">Al menos 8 caracteres</Text>
              </HStack>
              <HStack alignItems="flex-start" spacing="1">
                <Icon as={passwordErrors.uppercase ? CheckIcon : CloseIcon} color={passwordErrors.uppercase ? "green.500" : "red.500"} boxSize={3} mr="1" alignSelf="center" />
                <Text fontSize="sm" color={passwordErrors.uppercase ? "green.500" : "red.500"} mt="1">Al menos una mayúscula</Text>
              </HStack>
              <HStack alignItems="flex-start" spacing="1">
                <Icon as={passwordErrors.lowercase ? CheckIcon : CloseIcon} color={passwordErrors.lowercase ? "green.500" : "red.500"} boxSize={3} mr="1" alignSelf="center"/>
                <Text fontSize="sm" color={passwordErrors.lowercase ? "green.500" : "red.500"} mt="1">Al menos una minúscula</Text>
              </HStack>
              <HStack alignItems="flex-start" spacing="1">
                <Icon as={passwordErrors.number ? CheckIcon : CloseIcon} color={passwordErrors.number ? "green.500" : "red.500"} boxSize={3} mr="1" alignSelf="center" />
                <Text fontSize="sm" color={passwordErrors.number ? "green.500" : "red.500"} mt="1">Al menos un número</Text>
              </HStack>
              <HStack alignItems="flex-start" spacing="1">
                <Icon as={passwordErrors.symbol ? CheckIcon : CloseIcon} color={passwordErrors.symbol ? "green.500" : "red.500"} boxSize={3} mr="1" alignSelf="center" />
                <Text fontSize="sm" color={passwordErrors.symbol ? "green.500" : "red.500"} mt="1">Al menos un símbolo</Text>
              </HStack>
              <HStack alignItems="flex-start" spacing="1">
                <Icon as={passwordErrors.match ? CheckIcon : CloseIcon} color={passwordErrors.match ? "green.500" : "red.500"} boxSize={3} mr="1" alignSelf="center" />
                <Text fontSize="sm" color={passwordErrors.match ? "green.500" : "red.500"} mt="1">Las contraseñas deben coincidir</Text>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleAddUsuario}>Añadir</Button>
          <Button onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


