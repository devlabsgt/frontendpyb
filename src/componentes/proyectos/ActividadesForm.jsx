import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  VStack,
  HStack,
  IconButton,
  Text,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Progress,
  Collapse,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import QuickCreateSelect from "./QuickCreateSelect";
import ActividadAvanceForm from "./ActividadAvanceForm";
import PropTypes from "prop-types";

const ActividadesForm = ({
  presupuestoTotal = 0,
  actividades = [],
  onActividadesChange = () => {},
  beneficiariosDisponibles = [],
  fechasProyecto = {},
  onAvanceChange = () => {},
}) => {
  const [actividadesLocales, setActividadesLocales] = useState(actividades);
  const [error, setError] = useState(null);
  const [expandedActividad, setExpandedActividad] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setActividadesLocales(actividades);
  }, [actividades]);

  const calcularAvanceTotal = (actividades) => {
    if (!actividades || actividades.length === 0) return 0;

    const totalPresupuesto = actividades.reduce(
      (sum, act) => sum + Number(act.presupuestoAsignado || 0),
      0
    );

    if (totalPresupuesto === 0) return 0;

    return actividades.reduce((total, actividad) => {
      const peso =
        Number(actividad.presupuestoAsignado || 0) / totalPresupuesto;
      const avance = Number(actividad.avance || 0);
      return total + avance * peso;
    }, 0);
  };

  useEffect(() => {
    const nuevoAvanceTotal = calcularAvanceTotal(actividadesLocales);
    onAvanceChange(Math.round(nuevoAvanceTotal * 100) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividadesLocales]);

  const calcularPorcentajePresupuesto = (presupuestoActividad) => {
    if (!presupuestoTotal || presupuestoTotal <= 0) return 0;
    return (Number(presupuestoActividad) / Number(presupuestoTotal)) * 100;
  };

  const calcularPresupuestoDisponible = () => {
    const presupuestoUsado = actividadesLocales.reduce(
      (sum, act) => sum + Number(act.presupuestoAsignado || 0),
      0
    );
    return Number(presupuestoTotal) - presupuestoUsado;
  };

  const handleAvanceChange = (index, nuevoAvance) => {
    const nuevasActividades = [...actividadesLocales];
    nuevasActividades[index] = {
      ...nuevasActividades[index],
      avance: nuevoAvance,
    };
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const handleObservacionesChange = (index, campo, valor) => {
    const nuevasActividades = [...actividadesLocales];
    nuevasActividades[index] = {
      ...nuevasActividades[index],
      [campo]: valor,
    };
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const actualizarBeneficiarios = (index, beneficiarios) => {
    const nuevasActividades = [...actividadesLocales];
    nuevasActividades[index].beneficiariosAsociados = beneficiarios.map(
      (id) => ({
        beneficiario: id,
        estado: "Activo",
        fechaAsignacion: new Date().toISOString(),
      })
    );

    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const agregarActividad = () => {
    const nuevaActividad = {
      nombre: "",
      descripcion: "",
      presupuestoAsignado: 0,
      porcentajePresupuesto: 0,
      fechaInicio: "",
      fechaFin: "",
      estado: "Pendiente",
      avance: 0,
      beneficiariosAsociados: [],
      observaciones: "",
      resultadosEsperados: [],
      metasAlcanzadas: [],
    };

    const nuevasActividades = [...actividadesLocales, nuevaActividad];
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const actualizarActividad = (index, campo, valor) => {
    const nuevasActividades = [...actividadesLocales];

    if (campo === "presupuestoAsignado") {
      const valorNumerico = Number(valor);
      const otrosPresupuestos = nuevasActividades.reduce(
        (sum, act, i) =>
          i !== index ? sum + Number(act.presupuestoAsignado || 0) : sum,
        0
      );

      if (otrosPresupuestos + valorNumerico > presupuestoTotal) {
        toast({
          title: "Error",
          description: `El presupuesto total de las actividades excedería el presupuesto del proyecto (${presupuestoTotal})`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      nuevasActividades[index] = {
        ...nuevasActividades[index],
        [campo]: valorNumerico,
        porcentajePresupuesto: calcularPorcentajePresupuesto(valorNumerico),
      };
    } else {
      nuevasActividades[index] = {
        ...nuevasActividades[index],
        [campo]: valor,
      };
    }

    setError(null);
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const removerActividad = (index) => {
    const nuevasActividades = actividadesLocales.filter((_, i) => i !== index);
    setActividadesLocales(nuevasActividades);
    onActividadesChange(nuevasActividades);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(valor);
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <HStack justify="space-between" mb={4}>
          <Box>
            <Text fontWeight="bold">
              Presupuesto Disponible:{" "}
              {formatearMoneda(calcularPresupuestoDisponible())}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Avance Total del Proyecto:{" "}
              {calcularAvanceTotal(actividadesLocales).toFixed(1)}%
            </Text>
          </Box>
          <Button
            leftIcon={<Plus />}
            onClick={agregarActividad}
            colorScheme="blue"
            isDisabled={calcularPresupuestoDisponible() <= 0}
          >
            Agregar Actividad
          </Button>
        </HStack>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th></Th>
              <Th>Nombre</Th>
              <Th>Presupuesto</Th>
              <Th>% del Total</Th>
              <Th>Avance</Th>
              <Th>Beneficiarios</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {actividadesLocales.map((actividad, index) => (
              <React.Fragment key={index}>
                <Tr>
                  <Td>
                    <IconButton
                      icon={
                        expandedActividad === index ? (
                          <ChevronUp />
                        ) : (
                          <ChevronDown />
                        )
                      }
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedActividad(
                          expandedActividad === index ? null : index
                        )
                      }
                    />
                  </Td>
                  <Td>
                    <Input
                      value={actividad.nombre}
                      onChange={(e) =>
                        actualizarActividad(index, "nombre", e.target.value)
                      }
                      size="sm"
                    />
                  </Td>
                  <Td>
                    <NumberInput
                      value={actividad.presupuestoAsignado}
                      onChange={(value) =>
                        actualizarActividad(
                          index,
                          "presupuestoAsignado",
                          Number(value)
                        )
                      }
                      size="sm"
                      max={
                        calcularPresupuestoDisponible() +
                        Number(actividad.presupuestoAsignado)
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </Td>
                  <Td>
                    {calcularPorcentajePresupuesto(
                      actividad.presupuestoAsignado
                    ).toFixed(2)}
                    %
                  </Td>
                  <Td>
                    <Progress
                      value={actividad.avance}
                      size="sm"
                      colorScheme={
                        actividad.avance < 30
                          ? "red"
                          : actividad.avance < 70
                          ? "yellow"
                          : "green"
                      }
                      w="100px"
                    />
                  </Td>
                  <Td>
                    <QuickCreateSelect
                      options={beneficiariosDisponibles}
                      value={actividad.beneficiariosAsociados?.map(
                        (b) => b.beneficiario
                      )}
                      onChange={(value) =>
                        actualizarBeneficiarios(index, value)
                      }
                      placeholder="Beneficiarios"
                      type="beneficiario"
                      isMulti={true}
                      size="sm"
                    />
                  </Td>
                  <Td>
                    <IconButton
                      icon={<Trash2 />}
                      onClick={() => removerActividad(index)}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                    />
                  </Td>
                </Tr>
                <Tr>
                  <Td colSpan={7} p={0}>
                    <Collapse in={expandedActividad === index}>
                      <Box p={4} bg="gray.50">
                        <ActividadAvanceForm
                          actividad={actividad}
                          onAvanceChange={(avance) =>
                            handleAvanceChange(index, avance)
                          }
                          onObservacionesChange={(campo, valor) =>
                            handleObservacionesChange(index, campo, valor)
                          }
                          fechasProyecto={fechasProyecto}
                        />
                      </Box>
                    </Collapse>
                  </Td>
                </Tr>
              </React.Fragment>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
};

ActividadesForm.propTypes = {
  presupuestoTotal: PropTypes.number,
  actividades: PropTypes.array,
  onActividadesChange: PropTypes.func,
  beneficiariosDisponibles: PropTypes.array,
  fechasProyecto: PropTypes.object,
  onAvanceChange: PropTypes.func,
};

export default ActividadesForm;
