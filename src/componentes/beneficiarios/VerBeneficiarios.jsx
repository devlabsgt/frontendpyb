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
  TabPanel,
  Table,
  TableContainer,
  Thead,
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

const VerBeneficiarios = () => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [filteredBeneficiarios, setFilteredBeneficiarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

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

  const obtenerBeneficiarios = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_backend}/beneficiario`, getAuthHeaders());
      // Ordenamos los beneficiarios alfabéticamente por nombre
      const sortedBeneficiarios = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setBeneficiarios(sortedBeneficiarios);
    } catch (error) {
      console.error("Error al obtener los beneficiarios", error);
    }
  };

  useEffect(() => {
    // Aplicamos el filtro de etiquetas a los beneficiarios
    const filtered = beneficiarios.filter((beneficiario) => {
      return tags.every((tag) => {
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
      });
    });
    // Actualizamos los beneficiarios filtrados basados en las etiquetas
    setFilteredBeneficiarios(tags.length > 0 ? filtered : beneficiarios);
  }, [tags, beneficiarios]);

  const handleVerBeneficiario = (beneficiario) => {
    setSelectedBeneficiario(beneficiario);
    setIsEdit(true);
    onOpen();
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
    generarReporteBeneficiariosPDF(filteredBeneficiarios);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim() && !tags.includes(searchTerm.trim())) {
      setTags((prevTags) => [...prevTags, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" p={0}>
      <Flex mb={4} alignItems="center">
        <Button ml={4} colorScheme="blue" onClick={onAddOpen}>
          Añadir Beneficiario
        </Button>
        <Input
          placeholder="Buscar beneficiario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          ml={4}
          w="50%"
        />
        <Button colorScheme="green" ml={4} onClick={generarPDF}>
          Descargar PDF
        </Button>
      </Flex>

      <Box mt={2} ml={4}>
        {tags.map((tag) => (
          <Tag key={tag} mr="2" mb="2" size="lg">
            <TagLabel>{tag}</TagLabel>
            <TagCloseButton onClick={() => setTags((prevTags) => prevTags.filter((t) => t !== tag))} />
          </Tag>
        ))}
      </Box>

      <Tabs>
        <TabList>
          <Tab>Activos ({filteredBeneficiarios.filter(b => b.activo).length})</Tab>
          <Tab>Inactivos ({filteredBeneficiarios.filter(b => !b.activo).length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>No.</Th>
                    <Th width="100px">Nombre</Th>
                    <Th>DPI</Th>
                    <Th>Teléfono</Th>
                    <Th>Fecha de Nacimiento</Th>
                    <Th>Edad</Th>
                    <Th>Género</Th>
                     <Th width="100px">Dirección Completa</Th>
                    <Th>Estado Civil</Th>
                    <Th>Nombre del Padre</Th>
                    <Th>Nombre de la Madre</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredBeneficiarios.filter(b => b.activo).map((beneficiario, index) => (
                    <Tr key={beneficiario._id}>
                      <Td>{index + 1}</Td>
                      <Td>{beneficiario.nombre}</Td>
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
                          colorScheme="red"
                          size="sm"
                          onClick={() => handleInactivarBeneficiario(beneficiario._id)}
                        >
                          Inactivar
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>Nombre</Th>
                    <Th>DPI</Th>
                    <Th>Teléfono</Th>
                    <Th>Fecha de Nacimiento</Th>
                    <Th>Edad</Th>
                    <Th>Género</Th>
                    <Th>Dirección Completa</Th>
                    <Th>Estado Civil</Th>
                    <Th>Nombre del Padre</Th>
                    <Th>Nombre de la Madre</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredBeneficiarios.filter(b => !b.activo).map((beneficiario, index) => (
                    <Tr key={beneficiario._id}>
                      <Td>{index + 1}</Td>
                      <Td>{beneficiario.nombre}</Td>
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
                          colorScheme="green"
                          size="sm"
                          onClick={() => handleActivarBeneficiario(beneficiario._id)}
                        >
                          Activar
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>
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
