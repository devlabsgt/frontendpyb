import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  Text,
  TabPanel,
  Table,
  TableContainer,
  Thead,
  Select,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagCloseButton,
  TagLabel,
  Flex,
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ModalBeneficiario } from "./ModalsBeneficiarios";
import Swal from "sweetalert2";
import { generarReporteBeneficiariosPDF } from "./reporteBeneficiariosPDF";
import { Tooltip } from "@chakra-ui/react";
import { AiFillFilePdf } from "react-icons/ai";

const VerBeneficiarios = () => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [filteredBeneficiarios, setFilteredBeneficiarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isActiveTab, setIsActiveTab] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [departamento, setDepartamento] = useState("Ver todo");
  const [municipio, setMunicipio] = useState("Ver todo");
  const [localidadesSugeridas, setLocalidadesSugeridas] = useState([]);
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  const handleDeleteTag = (tagToDelete) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToDelete));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  useEffect(() => {
    obtenerBeneficiarios();
  }, []);

  useEffect(() => {
    filtrarBeneficiarios();
  }, [tags, beneficiarios, departamento, municipio]);

  // Llama a fetchSugerenciasLocalidades cuando cambien departamento o municipio
  useEffect(() => {
    if (departamento !== "Ver todo" && municipio !== "Ver todo") {
      fetchSugerenciasLocalidades();
    } else {
      setLocalidadesSugeridas([]); // Reinicia si no hay departamento o municipio seleccionado
    }
  }, [departamento, municipio]);

  const obtenerBeneficiarios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_backend}/beneficiario`, getAuthHeaders());
      const sortedBeneficiarios = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setBeneficiarios(sortedBeneficiarios);
    } catch (error) {
      console.error("Error al obtener los beneficiarios", error);
    }
  };

  const filtrarBeneficiarios = () => {
    let filtered = beneficiarios;

    if (departamento !== "Ver todo") {
      filtered = filtered.filter((b) => b.direccion?.departamento === departamento);
    }
    if (municipio !== "Ver todo") {
      filtered = filtered.filter((b) => b.direccion?.municipio === municipio);
    }

    if (tags.length > 0) {
      filtered = filtered.filter((beneficiario) =>
        tags.every((tag) => {
          const edad = calcularEdad(new Date(beneficiario.fechaNacimiento));
          const grupoEdad = definirGrupoEdad(edad);
          const fechaNacimientoFormateada = new Date(beneficiario.fechaNacimiento).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
          const direccionFields = [
            beneficiario.direccion?.departamento,
            beneficiario.direccion?.municipio,
            beneficiario.direccion?.localidad,
            beneficiario.direccion?.direccion,
          ];
          return (
            grupoEdad.toLowerCase() === tag.toLowerCase() ||
            `${edad} año` === tag.toLowerCase() ||
            `${edad} años` === tag.toLowerCase() ||
            fechaNacimientoFormateada.includes(tag) ||
            ["nombre", "dpi", "telefono", "estadoCivil", "genero", "nombrePadre", "nombreMadre"].some((field) =>
              beneficiario[field]?.toString().toLowerCase().includes(tag.toLowerCase())
            ) ||
            direccionFields.some((field) => field?.toLowerCase().includes(tag.toLowerCase()))
          );
        })
      );
    }
    setFilteredBeneficiarios(filtered);
  };

  const handleDepartamentoChange = (e) => {
    setDepartamento(e.target.value);
    setMunicipio("Ver todo");
    setLocalidadesSugeridas([]); // Reinicia las localidades al cambiar el departamento
  };

  const handleMunicipioChange = (e) => {
    setMunicipio(e.target.value);
  };

  const fetchSugerenciasLocalidades = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_backend}/localidades`,
        {
          params: {
            departamento,
            municipio,
          },
          ...getAuthHeaders(),
        }
      );
      setLocalidadesSugeridas(response.data);
    } catch (error) {
      console.error("Error al obtener sugerencias de localidades:", error);
    }
  };

  const departamentosUnicos = [...new Set(beneficiarios.map((b) => b.direccion?.departamento).filter(Boolean))];
  const municipiosUnicos = [...new Set(beneficiarios.map((b) => b.direccion?.municipio).filter(Boolean))];


  const handleVerBeneficiario = (beneficiario) => {
    setSelectedBeneficiario(beneficiario);
    setIsEdit(true);
    onOpen();
  };

  const handleAddBeneficiario = () => {
    setSelectedBeneficiario(null); // Restablece el beneficiario seleccionado
    setIsEdit(false); // Establece que es una creación y no una edición
    onAddOpen(); // Abre el modal para añadir
  };

  const handleInactivarBeneficiario = async (beneficiarioId) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción inactivará al beneficiario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Inactivar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`${process.env.REACT_APP_backend}/beneficiario/${beneficiarioId}`, { activo: false }, getAuthHeaders());
        obtenerBeneficiarios();
        Swal.fire("Inactivado!", "El beneficiario ha sido inactivado.", "success");
      } catch (error) {
        console.error("Error al inactivar el beneficiario", error);
        Swal.fire("Error", "No se pudo inactivar al beneficiario.", "error");
      }
    }
  };

  const handleActivarBeneficiario = async (beneficiarioId) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción activará al beneficiario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`${process.env.REACT_APP_backend}/beneficiario/${beneficiarioId}`, { activo: true }, getAuthHeaders());
        obtenerBeneficiarios();
        Swal.fire("Activado!", "El beneficiario ha sido activado.", "success");
      } catch (error) {
        console.error("Error al activar el beneficiario", error);
        Swal.fire("Error", "No se pudo activar al beneficiario.", "error");
      }
    }
  };

  const generarPDF = () => {
    const fecha = new Date();
    const fechaFormato = fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-'); // Esto convierte la fecha a formato dd-mm-yyyy
  
    const nombreArchivo = `Reporte_beneficiarios_${fechaFormato}.pdf`;
    generarReporteBeneficiariosPDF(filteredBeneficiarios, nombreArchivo);
  };
  

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim() && !tags.includes(searchTerm.trim())) {
      setTags((prevTags) => [...prevTags, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  return (
<Box p={5} bg="gray.50" borderRadius="lg" boxShadow="base">
<Flex mb={4} alignItems="center" justifyContent="space-between">
  <Box>
    <Button colorScheme="blue" onClick={handleAddBeneficiario} mr={4}>
      Añadir Beneficiario
    </Button>
    <Input
      placeholder="Buscar beneficiario..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onKeyDown={handleKeyDown}
      w="700px" // Ajusta el ancho según sea necesario
      mr={4}
    />
    <Tooltip label="Descarga el listado de beneficiarios en formato PDF según tu busqueda." aria-label="Descripción del botón PDF">
      <Button
        bg="#800000"  // Color corinto
        color="white"
        _hover={{ bg: "#660000" }}  // Color corinto oscuro al pasar el ratón
        onClick={generarPDF}
        leftIcon={<AiFillFilePdf />}
      >
        Descargar PDF
      </Button>
    </Tooltip>
  </Box>

  <Box borderWidth="1px" borderRadius="lg" p={2} w="fit-content" bg="white" boxShadow="sm">
      <Text fontSize="sm" fontWeight="bold" mb={2}>Filtros Por Localidad</Text>
      <Flex>
        <Select value={departamento} onChange={handleDepartamentoChange} mr={2} bg="blue.50">
          <option value="Ver todo">Departamento</option>
          {departamentosUnicos.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </Select>
        <Select value={municipio} onChange={handleMunicipioChange} bg="blue.50">
          <option value="Ver todo">Municipio</option>
          {municipiosUnicos
            .filter((mun) => beneficiarios.some(b => b.direccion?.departamento === departamento && b.direccion?.municipio === mun))
            .map((mun) => (
              <option key={mun} value={mun}>{mun}</option>
          ))}
        </Select>
      </Flex>
    </Box>
</Flex>

<Flex ml="15%" mt={1} wrap="wrap" justifyContent="flex-start" alignItems="center">  {/* Reduce el margen superior aquí */}
  {tags.map(tag => (
    <Tag key={tag} size="md" colorScheme="teal" borderRadius="full" mr={2} mt={0}>
      <TagLabel>{tag}</TagLabel>
      <TagCloseButton onClick={() => handleDeleteTag(tag)} />
    </Tag>
  ))}
  {tags.length > 0 && (
    <Button
      size="sm"
      colorScheme="teal"
      borderRadius="full"
      height="25px"
      paddingX={4}
      ml={2}
      mt={0}  // Margen superior ajustado a 0
      onClick={() => setTags([])}
    >
      Borrar Búsquedas
    </Button>
  )}
</Flex>

      <br />

  <Tabs onChange={index => setIsActiveTab(index === 0)}>
    <TabList>
      <Tab _selected={{ color: "white", bg: "blue.700" }}>
        Activos ({filteredBeneficiarios.filter(b => b.activo).length})
      </Tab>
      <Tab _selected={{ color: "white", bg: "red.500" }}>
        Inactivos ({filteredBeneficiarios.filter(b => !b.activo).length})
      </Tab>
    </TabList>

    <TabPanels>
      {[true, false].map((isActive, index) => (
        <TabPanel key={index}>
          <TableContainer borderRadius="md" boxShadow="md" bg="white" p={4}>
            <Table variant="striped" colorScheme="gray" size="md">
              <Thead>
                <Tr bg={isActive ? "blue.300" : "red.900"}>
                  <Th color="white">No.</Th>
                  <Th color="white">Nombre</Th>
                  <Th color="white">DPI</Th>
                  <Th color="white">Teléfono</Th>
                  <Th color="white">Fecha de Nacimiento</Th>
                  <Th color="white">Edad</Th>
                  <Th color="white">Género</Th>
                  <Th color="white">Dirección Completa</Th>
                  <Th color="white">Estado Civil</Th>
                  <Th color="white">Nombre del Padre</Th>
                  <Th color="white">Nombre de la Madre</Th>
                  <Th color="white">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBeneficiarios.filter(b => b.activo === isActive).map((beneficiario, index) => (
                  <Tr key={beneficiario._id} _hover={{ bg: "gray.100" }}>
                    <Td>{index + 1}</Td>
                    <Td fontWeight="bold">{beneficiario.nombre}</Td>
                    <Td>{beneficiario.dpi}</Td>
                    <Td>{beneficiario.telefono}</Td>
                    <Td>{new Date(beneficiario.fechaNacimiento).toLocaleDateString("es-ES")}</Td>
                    <Td>{calcularEdad(new Date(beneficiario.fechaNacimiento))} años</Td>
                    <Td>{beneficiario.genero}</Td>
                    <Td>{beneficiario.direccion?.direccion}</Td>
                    <Td>{beneficiario.estadoCivil}</Td>
                    <Td>{beneficiario.nombrePadre}</Td>
                    <Td>{beneficiario.nombreMadre}</Td>
                    <Td>
                      <Button
                        leftIcon={<ViewIcon />}
                        onClick={() => handleVerBeneficiario(beneficiario)}
                        colorScheme="blue"
                        size="sm"
                        mr={2}
                      >
                        Ver
                      </Button>
                      <Button
                        colorScheme={isActive ? "red" : "green"}
                        size="sm"
                        onClick={() => isActive
                          ? handleInactivarBeneficiario(beneficiario._id)
                          : handleActivarBeneficiario(beneficiario._id)
                        }
                      >
                        {isActive ? "Inactivar" : "Activar"}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </TabPanel>
      ))}
    </TabPanels>
  </Tabs>

  <ModalBeneficiario
    isOpen={isOpen || isAddOpen}
    onClose={() => {
      onClose();
      onAddClose();
      obtenerBeneficiarios();
    }}
    beneficiario={selectedBeneficiario}
    isEdit={isEdit}
    obtenerBeneficiarios={() => obtenerBeneficiarios()}
    getAuthHeaders={getAuthHeaders}
  />
</Box>

  );
};

export default VerBeneficiarios;

// Función auxiliar para calcular la edad
const calcularEdad = (fechaNacimiento) => {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
};

// Función auxiliar para definir el grupo de edad
const definirGrupoEdad = (edad) => {
  if (edad < 12) return "niños";
  if (edad >= 12 && edad <= 17) return "adolescentes";
  if (edad >= 18 && edad <= 64) return "adultos";
  if (edad >= 65) return "adultos mayores";
  return "";
};
