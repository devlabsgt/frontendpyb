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
  Alert,
  AlertIcon,
  FormErrorMessage,
} from "@chakra-ui/react";
import axios from "axios";
import GT from "territory-gt";

// Modal para crear o editar un beneficiario
export const ModalBeneficiario = ({ isOpen, onClose, beneficiario, obtenerBeneficiarios, getAuthHeaders, isEdit }) => {
  const [beneficiarioData, setBeneficiarioData] = useState({
    nombre: "",
    dpi: "",
    fechaNacimiento: "",
    genero: "Masculino",
    estadoCivil: "Soltero/a",
    telefono: "",
    nombrePadre: "",
    nombreMadre: "",
    direccion: {
      departamento: "",
      municipio: "",
      localidad: "",
      direccion: ""
    }
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [localidadesSugeridas, setLocalidadesSugeridas] = useState([]);
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertStatus, setAlertStatus] = useState("error");

  useEffect(() => {
    const deps = GT.departamentos();
    setDepartamentos(deps);

    if (beneficiario) {
      setBeneficiarioData(beneficiario);
      if (beneficiario.direccion?.departamento) {
        const munis = GT.municipios(beneficiario.direccion.departamento);
        setMunicipios(munis || []);
      }
    } else {
      resetForm();
    }
  }, [beneficiario]);

  const resetForm = () => {
    setBeneficiarioData({
      nombre: "",
      dpi: "",
      fechaNacimiento: "",
      genero: "Masculino",
      estadoCivil: "Soltero/a",
      telefono: "",
      nombrePadre: "",
      nombreMadre: "",
      direccion: {
        departamento: "",
        municipio: "",
        localidad: "",
        direccion: ""
      }
    });
    setErrors({});
    setAlertMessage(null);
    setAlertStatus("error");
    setMunicipios([]);
    setLocalidadesSugeridas([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("direccion.")) {
      const field = name.split(".")[1];
      setBeneficiarioData((prev) => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }));
      if (field === "localidad" && beneficiarioData.direccion.departamento && beneficiarioData.direccion.municipio) {
        fetchSugerenciasLocalidades(value);
      }
    } else {
      setBeneficiarioData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDepartamentoChange = (e) => {
    const departamentoSeleccionado = e.target.value;
    setBeneficiarioData((prev) => ({
      ...prev,
      direccion: { ...prev.direccion, departamento: departamentoSeleccionado, municipio: "", localidad: "", direccion: "" }
    }));
    setMunicipios(GT.municipios(departamentoSeleccionado) || []);
    setLocalidadesSugeridas([]);
  };

  const handleMunicipioChange = (e) => {
    const municipioSeleccionado = e.target.value;
    setBeneficiarioData((prev) => ({
      ...prev,
      direccion: { ...prev.direccion, municipio: municipioSeleccionado, localidad: "", direccion: "" }
    }));
    setLocalidadesSugeridas([]);
  };

  const fetchSugerenciasLocalidades = async (localidad) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_backend}/localidades`,
        {
          params: {
            departamento: beneficiarioData.direccion.departamento,
            municipio: beneficiarioData.direccion.municipio,
            localidad,
          },
          ...getAuthHeaders(),
        }
      );
      setLocalidadesSugeridas(response.data);
    } catch (error) {
      console.error("Error al obtener sugerencias de localidades:", error);
    }
  };

  const validateFields = () => {
    const newErrors = {};
    if (!beneficiarioData.nombre) newErrors.nombre = "El nombre es requerido.";
    if (!beneficiarioData.dpi) {
      newErrors.dpi = "El DPI es requerido.";
    } else if (!/^\d{13}$/.test(beneficiarioData.dpi)) {
      newErrors.dpi = "El DPI debe tener 13 dígitos numéricos.";
    }
    if (!beneficiarioData.telefono) {
      newErrors.telefono = "El teléfono es requerido.";
    } else if (!/^\d{8}$/.test(beneficiarioData.telefono)) {
      newErrors.telefono = "El teléfono debe tener 8 dígitos numéricos.";
    }
    if (!beneficiarioData.direccion.departamento) newErrors.departamento = "El departamento es requerido.";
    if (!beneficiarioData.direccion.municipio) newErrors.municipio = "El municipio es requerido.";
    if (!beneficiarioData.direccion.localidad) newErrors.localidad = "La localidad es requerida.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSave = async () => {
  if (!validateFields()) return;

  try {
    if (isEdit) {
      await axios.put(`${process.env.REACT_APP_backend}/beneficiario/${beneficiarioData._id}`, beneficiarioData, getAuthHeaders());
      setAlertMessage("Cambios guardados correctamente.");
    } else {
      await axios.post(`${process.env.REACT_APP_backend}/beneficiario`, beneficiarioData, getAuthHeaders());
      setAlertMessage("Beneficiario añadido correctamente.");
    }
    setAlertStatus("success");
    obtenerBeneficiarios();
    resetForm();
    onClose();
  } catch (error) {
    console.error("Error al guardar los cambios", error);
    setAlertMessage("Error al guardar los cambios.");
    setAlertStatus("error");
  }
};


  return (
    <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{beneficiario ? "Editar Beneficiario" : "Añadir Beneficiario"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {alertMessage && (
            <Alert status={alertStatus} mb="4">
              <AlertIcon />
              {alertMessage}
            </Alert>
          )}
          <VStack spacing="4">
            <FormControl isInvalid={errors.nombre}>
              <FormLabel>Nombre</FormLabel>
              <Input name="nombre" value={beneficiarioData.nombre} onChange={handleInputChange} />
              <FormErrorMessage>{errors.nombre}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.dpi}>
              <FormLabel>DPI</FormLabel>
              <Input name="dpi" value={beneficiarioData.dpi} onChange={handleInputChange} />
              <FormErrorMessage>{errors.dpi}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.telefono}>
              <FormLabel>Teléfono</FormLabel>
              <Input name="telefono" value={beneficiarioData.telefono} onChange={handleInputChange} />
              <FormErrorMessage>{errors.telefono}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Fecha de Nacimiento</FormLabel>
              <Input type="date" name="fechaNacimiento" value={beneficiarioData.fechaNacimiento ? beneficiarioData.fechaNacimiento.slice(0, 10) : ""} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Género</FormLabel>
              <Select name="genero" value={beneficiarioData.genero} onChange={handleInputChange}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Estado Civil</FormLabel>
              <Select name="estadoCivil" value={beneficiarioData.estadoCivil} onChange={handleInputChange}>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
              </Select>
            </FormControl>
            <FormControl isInvalid={errors.departamento}>
              <FormLabel>Departamento</FormLabel>
              <Select name="direccion.departamento" value={beneficiarioData.direccion.departamento} onChange={handleDepartamentoChange}>
                <option value="">Seleccione un departamento</option>
                {departamentos.map((dep, index) => (
                  <option key={index} value={dep}>{dep}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.departamento}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.municipio}>
              <FormLabel>Municipio</FormLabel>
              <Select name="direccion.municipio" value={beneficiarioData.direccion.municipio} onChange={handleMunicipioChange}>
                <option value="">Seleccione un municipio</option>
                {municipios.map((muni, index) => (
                  <option key={index} value={muni}>{muni}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.municipio}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={errors.localidad}>
              <FormLabel>Localidad</FormLabel>
              <Input name="direccion.localidad" value={beneficiarioData.direccion.localidad} onChange={handleInputChange} list="sugerenciasLocalidades" />
              <datalist id="sugerenciasLocalidades">
                {localidadesSugeridas.map((localidad, index) => (
                  <option key={index} value={localidad} />
                ))}
              </datalist>
              <FormErrorMessage>{errors.localidad}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Dirección</FormLabel>
              <Input name="direccion.direccion" value={beneficiarioData.direccion.direccion} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Nombre del Padre</FormLabel>
              <Input name="nombrePadre" value={beneficiarioData.nombrePadre} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Nombre de la Madre</FormLabel>
              <Input name="nombreMadre" value={beneficiarioData.nombreMadre} onChange={handleInputChange} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
<Button colorScheme="blue" mr={3} onClick={handleSave}>
  {isEdit ? "Guardar Cambios" : "Añadir Beneficiario"}
</Button>
          <Button onClick={() => { resetForm(); onClose(); }}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
