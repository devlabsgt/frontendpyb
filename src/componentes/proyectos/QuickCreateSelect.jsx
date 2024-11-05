import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useDisclosure,
  useToast,
  FormErrorMessage,
  Textarea,
  Select,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Box,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";

const QuickCreateSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  type,
  isMulti = false,
  error,
  onNewOption,
  isRequired = false,
  isDisabled = false,
}) => {
  // Estados
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    contacto: "",
    email: "",
    telefono: "",
    direccion: "",
    dpi: "",
    fechaNacimiento: "",
    genero: "",
    estadoCivil: "",
    departamento: "",
    municipio: "",
    localidad: "",
    nombrePadre: "",
    nombreMadre: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const toast = useToast();

  // Funciones auxiliares
  const getOptionName = (optionId) => {
    const option = options.find((opt) => opt._id === optionId);
    return option ? option.nombre : "";
  };

  const getEndpoint = () => {
    switch (type) {
      case "objetivo":
        return "objetivo-global";
      case "linea":
        return "linea-estrategica";
      case "donante":
        return "donante";
      case "beneficiario":
        return "beneficiario";
      default:
        return "";
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case "objetivo":
        return "Crear Nuevo Objetivo Global";
      case "linea":
        return "Crear Nueva Línea Estratégica";
      case "donante":
        return "Crear Nuevo Donante";
      case "beneficiario":
        return "Crear Nuevo Beneficiario";
      default:
        return "Crear Nuevo Elemento";
    }
  };

  // Manejadores
  const handleInputChange = (e) => {
    const { name, value: inputValue } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));
    setFormError(null);
  };

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;

    if (isMulti) {
      let currentValues = Array.isArray(value) ? value : [];

      if (currentValues.includes(selectedValue)) {
        currentValues = currentValues.filter((v) => v !== selectedValue);
      } else {
        currentValues = [...currentValues, selectedValue];
      }

      onChange(currentValues);
    } else {
      onChange(selectedValue);
    }
  };

  const handleRemoveValue = (valueToRemove) => {
    if (isMulti && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== valueToRemove);
      onChange(newValues);
    }
  };

  const validateForm = () => {
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setFormError("El nombre es requerido");
      return false;
    }

    // Validaciones específicas por tipo
    if (type === "beneficiario") {
      if (!formData.dpi) {
        setFormError("El DPI es requerido");
        return false;
      }
      if (!formData.fechaNacimiento) {
        setFormError("La fecha de nacimiento es requerida");
        return false;
      }
      if (
        !formData.departamento ||
        !formData.municipio ||
        !formData.localidad
      ) {
        setFormError("La ubicación completa es requerida");
        return false;
      }
    }

    if (type === "donante") {
      if (!formData.email && !formData.telefono) {
        setFormError(
          "Debe proporcionar al menos un medio de contacto (email o teléfono)"
        );
        return false;
      }
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        setFormError("El formato del email no es válido");
        return false;
      }
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_backend}/${getEndpoint()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al crear el registro");
      }

      const newItem = await response.json();

      if (onNewOption) {
        onNewOption(newItem);
      }

      if (isMulti) {
        const currentValues = Array.isArray(value) ? value : [];
        onChange([...currentValues, newItem._id]);
      } else {
        onChange(newItem._id);
      }

      toast({
        title: "Éxito",
        description: `${
          type === "objetivo"
            ? "Objetivo global"
            : type === "linea"
            ? "Línea estratégica"
            : type === "beneficiario"
            ? "Beneficiario"
            : "Donante"
        } creado correctamente`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setFormData({
        nombre: "",
        descripcion: "",
        contacto: "",
        email: "",
        telefono: "",
        direccion: "",
        dpi: "",
        fechaNacimiento: "",
        genero: "",
        estadoCivil: "",
        departamento: "",
        municipio: "",
        localidad: "",
        nombrePadre: "",
        nombreMadre: "",
      });
    } catch (error) {
      console.error("Error al crear:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (type) {
      case "beneficiario":
        return (
          <>
            <FormControl isRequired isInvalid={!!formError}>
              <FormLabel>Nombre Completo</FormLabel>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre completo"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>DPI</FormLabel>
              <Input
                name="dpi"
                value={formData.dpi}
                onChange={handleInputChange}
                placeholder="Ingrese el número de DPI"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Fecha de Nacimiento</FormLabel>
              <Input
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Género</FormLabel>
              <Select
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                placeholder="Seleccione el género"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Estado Civil</FormLabel>
              <Select
                name="estadoCivil"
                value={formData.estadoCivil}
                onChange={handleInputChange}
                placeholder="Seleccione el estado civil"
              >
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Departamento</FormLabel>
              <Input
                name="departamento"
                value={formData.departamento}
                onChange={handleInputChange}
                placeholder="Ingrese el departamento"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Municipio</FormLabel>
              <Input
                name="municipio"
                value={formData.municipio}
                onChange={handleInputChange}
                placeholder="Ingrese el municipio"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Localidad</FormLabel>
              <Input
                name="localidad"
                value={formData.localidad}
                onChange={handleInputChange}
                placeholder="Ingrese la localidad"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Nombre del Padre</FormLabel>
              <Input
                name="nombrePadre"
                value={formData.nombrePadre}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre del padre"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Nombre de la Madre</FormLabel>
              <Input
                name="nombreMadre"
                value={formData.nombreMadre}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre de la madre"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Teléfono</FormLabel>
              <Input
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ingrese el número de teléfono"
              />
            </FormControl>
          </>
        );

      case "donante":
        return (
          <>
            <FormControl isRequired isInvalid={!!formError}>
              <FormLabel>Nombre</FormLabel>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Nombre del donante"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Contacto Principal</FormLabel>
              <Input
                name="contacto"
                value={formData.contacto}
                onChange={handleInputChange}
                placeholder="Nombre del contacto principal"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Correo electrónico"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Teléfono</FormLabel>
              <Input
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Número de teléfono"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Dirección</FormLabel>
              <Input
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Dirección física"
              />
            </FormControl>
          </>
        );

      default:
        return (
          <>
            <FormControl isRequired isInvalid={!!formError}>
              <FormLabel>Nombre</FormLabel>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder={`Ingrese el nombre ${
                  type === "objetivo" ? "del objetivo" : "de la línea"
                }`}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Descripción</FormLabel>
              <Textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder={`Ingrese la descripción ${
                  type === "objetivo" ? "del objetivo" : "de la línea"
                }`}
              />
            </FormControl>
          </>
        );
    }
  };

  return (
    <FormControl
      isInvalid={!!error}
      isRequired={isRequired}
      isDisabled={isDisabled}
    >
      {isMulti ? (
        <VStack align="stretch" spacing={2}>
          <HStack spacing={2}>
            <Select
              value=""
              onChange={handleSelectChange}
              placeholder={placeholder}
              flex="1"
            >
              {options
                .filter((option) => !value?.includes(option._id))
                .map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.nombre}
                  </option>
                ))}
            </Select>
            <Button
              leftIcon={<Plus />}
              onClick={onOpen}
              colorScheme="green"
              variant="outline"
              isDisabled={isDisabled}
            >
              Nuevo
            </Button>
          </HStack>

          {Array.isArray(value) && value.length > 0 && (
            <Wrap spacing={2}>
              {value.map((valueId) => (
                <WrapItem key={valueId}>
                  <Tag
                    size="md"
                    borderRadius="full"
                    variant="solid"
                    colorScheme="blue"
                  >
                    <TagLabel>{getOptionName(valueId)}</TagLabel>
                    <TagCloseButton
                      onClick={() => handleRemoveValue(valueId)}
                      isDisabled={isDisabled}
                    />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </VStack>
      ) : (
        <HStack spacing={2}>
          <Select
            value={value || ""}
            onChange={handleSelectChange}
            placeholder={placeholder}
            flex="1"
          >
            {options.map((option) => (
              <option key={option._id} value={option._id}>
                {option.nombre}
              </option>
            ))}
          </Select>
          <Button
            leftIcon={<Plus />}
            onClick={onOpen}
            colorScheme="green"
            variant="outline"
            isDisabled={isDisabled}
          >
            Nuevo
          </Button>
        </HStack>
      )}

      {error && <FormErrorMessage>{error}</FormErrorMessage>}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={type === "beneficiario" ? "xl" : "md"}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>{getModalTitle()}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {formError && (
                <Alert status="error">
                  <AlertIcon />
                  <Box flex="1">{formError}</Box>
                </Alert>
              )}
              {renderFormFields()}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={handleCreate}
              isLoading={isLoading}
              loadingText="Creando..."
            >
              Crear
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormControl>
  );
};

// PropTypes
QuickCreateSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.oneOf(["objetivo", "linea", "donante", "beneficiario"])
    .isRequired,
  isMulti: PropTypes.bool,
  error: PropTypes.string,
  onNewOption: PropTypes.func,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool,
};

// Valores por defecto
QuickCreateSelect.defaultProps = {
  options: [],
  placeholder: "Seleccione una opción",
  isMulti: false,
  isRequired: false,
  isDisabled: false,
};

export default QuickCreateSelect;
