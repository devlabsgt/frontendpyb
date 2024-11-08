import React from "react";
import {
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Progress,
  VStack,
  HStack,
  Text,
  Box,
  Textarea,
  Input,
  FormErrorMessage,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

const ActividadAvanceForm = ({
  actividad = {}, // Provide empty object as default value
  onAvanceChange = () => {}, // Default empty function
  onObservacionesChange = () => {}, // Default empty function
  fechasProyecto = {}, // Default empty object
}) => {
  // Early return or default render if required props are missing
  if (!fechasProyecto.fechaInicio || !fechasProyecto.fechaFinal) {
    return (
      <Box p={4}>
        <Text color="red.500">Error: Fechas del proyecto no disponibles</Text>
      </Box>
    );
  }

  // Safely access actividad properties with defaults
  const {
    avance = 0,
    fechaInicio = "",
    fechaFin = "",
    observaciones = "",
  } = actividad;

  // Validación de fechas
  const validateFecha = (fecha, tipo) => {
    if (!fechasProyecto?.fechaInicio || !fechasProyecto?.fechaFinal) {
      return (
        <Box p={4}>
          <Alert status="error">
            <AlertIcon />
            <Text>
              Para agregar actividades, primero debe establecer las fechas de
              inicio y fin del proyecto en la sección de Información Básica.
            </Text>
          </Alert>
        </Box>
      );
    }

    const fechaActividad = new Date(fecha);
    const fechaInicioProyecto = new Date(fechasProyecto.fechaInicio);
    const fechaFinalProyecto = new Date(fechasProyecto.fechaFinal);

    if (tipo === "inicio") {
      if (fechaActividad < fechaInicioProyecto) {
        return "La fecha de inicio no puede ser anterior a la fecha de inicio del proyecto";
      }
      if (fechaActividad > fechaFinalProyecto) {
        return "La fecha de inicio no puede ser posterior a la fecha final del proyecto";
      }
      if (fechaFin && fechaActividad > new Date(fechaFin)) {
        return "La fecha de inicio debe ser anterior a la fecha de finalización";
      }
    }

    if (tipo === "fin") {
      if (fechaActividad > fechaFinalProyecto) {
        return "La fecha de finalización no puede ser posterior a la fecha final del proyecto";
      }
      if (fechaInicio && fechaActividad < new Date(fechaInicio)) {
        return "La fecha de finalización debe ser posterior a la fecha de inicio";
      }
    }

    return null;
  };

  const handleFechaChange = (tipo, value) => {
    const error = validateFecha(value, tipo);
    if (!error) {
      onObservacionesChange(
        tipo === "inicio" ? "fechaInicio" : "fechaFin",
        value
      );
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={4}>
        <FormControl flex="1">
          <FormLabel>Nivel de Avance</FormLabel>
          <HStack spacing={4}>
            <NumberInput
              value={avance}
              onChange={(value) => onAvanceChange(Number(value))}
              min={0}
              max={100}
              step={1}
              w="100px"
            >
              <NumberInputField />
            </NumberInput>
            <Box flex="1">
              <Progress
                value={avance}
                size="sm"
                colorScheme={
                  avance < 30 ? "red" : avance < 70 ? "yellow" : "green"
                }
                borderRadius="full"
                hasStripe
              />
            </Box>
            <Text fontSize="sm" width="60px" textAlign="right">
              {avance}%
            </Text>
          </HStack>
        </FormControl>
      </HStack>

      <FormControl isRequired isInvalid={!fechaInicio}>
        <FormLabel>Fecha de Inicio</FormLabel>
        <Input
          type="date"
          value={fechaInicio}
          onChange={(e) => handleFechaChange("inicio", e.target.value)}
          min={fechasProyecto.fechaInicio}
          max={fechasProyecto.fechaFinal}
        />
        {!fechaInicio && (
          <FormErrorMessage>La fecha de inicio es requerida</FormErrorMessage>
        )}
      </FormControl>

      <FormControl isRequired isInvalid={!fechaFin}>
        <FormLabel>Fecha de Fin</FormLabel>
        <Input
          type="date"
          value={fechaFin}
          onChange={(e) => handleFechaChange("fin", e.target.value)}
          min={fechaInicio || fechasProyecto.fechaInicio}
          max={fechasProyecto.fechaFinal}
        />
        {!fechaFin && (
          <FormErrorMessage>
            La fecha de finalización es requerida
          </FormErrorMessage>
        )}
      </FormControl>

      <FormControl>
        <FormLabel>Observaciones</FormLabel>
        <Textarea
          value={observaciones}
          onChange={(e) =>
            onObservacionesChange("observaciones", e.target.value)
          }
          placeholder="Ingrese observaciones sobre el avance de la actividad"
          size="sm"
          rows={3}
        />
      </FormControl>
    </VStack>
  );
};

export default ActividadAvanceForm;
