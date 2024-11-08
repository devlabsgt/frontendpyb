import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Checkbox,
  Alert,
  AlertIcon,
  AlertTitle,
  useToast,
  Card,
  CardBody,
  Progress,
  VStack,
  Image,
  AspectRatio,
  Divider,
  FormErrorMessage,
  Heading,
} from "@chakra-ui/react";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  Upload,
  Files,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import QuickCreateSelect from "./QuickCreateSelect";
import PropTypes from "prop-types";
import ActividadesForm from "./ActividadesForm";
import UbicacionForm from "./UbicacionForm";

const MotionBox = motion(Box);

// Definición de PropTypes
EditarProyecto.propTypes = {
  proyectoId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

function EditarProyecto({ proyectoId, onCancel, onSuccess }) {
  // Estados
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: "",
    encargado: "",
    presupuesto: {
      total: 0,
      ejecutado: 0,
    },
    fechaInicio: "",
    fechaFinal: "",
    objetivosGlobales: [],
    lineasEstrategicas: [],
    donantes: [{ donante: "", montoAportado: 0, porcentaje: 0 }],
    lugaresAPriorizar: [
      { departamento: "", municipio: "", localidad: "", prioridad: 1 },
    ],
    actividades: [],
    implicacionMunicipalidades: "Media",
    seguimiento: { frecuencia: "mensual", requiereVisita: false },
    nivelAvance: 0,
    personasAlcanzadas: 0,
    beneficiarios: [],
    evidencias: [],
    observaciones: "",
  });

  const [datos, setDatos] = useState({
    encargados: [],
    objetivos: [],
    lineas: [],
    donantes: [],
    beneficiarios: [],
  });

  const [errores, setErrores] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const steps = [
    "Información Básica",
    "Objetivos y Estrategias",
    "Donantes",
    "Ubicaciones",
    "Actividades",
    "Evidencias",
    "Configuración Final",
  ];
  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!proyectoId) {
      console.error("No se proporcionó ID de proyecto");
      if (onCancel) onCancel();
      return;
    }

    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No hay token de autenticación");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Cargar proyecto y datos relacionados en paralelo
        const [
          proyecto,
          encargados,
          objetivos,
          lineas,
          donantes,
          beneficiarios,
        ] = await Promise.all([
          fetch(`${process.env.REACT_APP_backend}/proyecto/${proyectoId}`, {
            headers,
          }).then((r) => {
            if (!r.ok) throw new Error("No se pudo cargar el proyecto");
            return r.json();
          }),
          fetch(`${process.env.REACT_APP_backend}/usuario?rol=Encargado`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${process.env.REACT_APP_backend}/objetivo-global`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${process.env.REACT_APP_backend}/linea-estrategica`, {
            headers,
          }).then((r) => r.json()),
          fetch(`${process.env.REACT_APP_backend}/donante`, { headers }).then(
            (r) => r.json()
          ),
          fetch(`${process.env.REACT_APP_backend}/beneficiario`, {
            headers,
          }).then((r) => r.json()),
        ]);

        // Verificar que el proyecto existe
        if (!proyecto) {
          throw new Error("Proyecto no encontrado");
        }

        // Formatear los datos del proyecto para el formulario
        const proyectoFormateado = {
          ...proyecto,
          encargado: proyecto.encargado?._id || "",
          objetivosGlobales:
            proyecto.objetivosGlobales?.map((obj) => obj._id) || [],
          lineasEstrategicas:
            proyecto.lineasEstrategicas?.map((linea) => linea._id) || [],
          // Manejar el presupuesto correctamente
          presupuesto: {
            total: Number(proyecto.presupuesto?.total || 0),
            ejecutado: Number(proyecto.presupuesto?.ejecutado || 0),
          },
          // Formatear los donantes
          donantes: proyecto.donantes?.map((d) => ({
            donante: d.donante._id,
            montoAportado:
              (d.porcentaje / 100) * (proyecto.presupuesto?.total || 0),
            porcentaje: d.porcentaje,
          })) || [{ donante: "", montoAportado: 0, porcentaje: 0 }],
          // Formatear las actividades
          actividades:
            proyecto.actividades?.map((actividad) => ({
              ...actividad,
              fechaInicio: actividad.fechaInicio?.split("T")[0] || "",
              fechaFin: actividad.fechaFin?.split("T")[0] || "",
              beneficiariosAsociados: actividad.beneficiariosAsociados?.map(
                (b) => ({
                  ...b,
                  beneficiario:
                    typeof b.beneficiario === "string"
                      ? b.beneficiario
                      : b.beneficiario._id,
                })
              ),
            })) || [],
          beneficiarios:
            proyecto.beneficiarios?.map((b) => {
              if (typeof b === "object" && b.beneficiario) {
                return b.beneficiario._id;
              }
              return b;
            }) || [],
          fechaInicio: proyecto.fechaInicio?.split("T")[0] || "",
          fechaFinal: proyecto.fechaFinal?.split("T")[0] || "",
        };

        setDatos({ encargados, objetivos, lineas, donantes, beneficiarios });
        setFormData(proyectoFormateado);

        // Cargar evidencias existentes
        if (proyecto.evidencias?.length > 0) {
          setPreviewImages(
            proyecto.evidencias.map((evidencia) => ({
              url: evidencia.archivo,
              type: evidencia.tipo.startsWith("image/") ? "image" : "pdf",
              name: evidencia.descripcion || "Archivo",
              id: evidencia._id,
            }))
          );
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "Error al cargar el proyecto",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        if (onCancel) onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [proyectoId, toast, onCancel]);
  // Manejadores de eventos base
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  // Manejador de donantes
  const handleDonanteChange = (index, field, value) => {
    const newDonantes = [...formData.donantes];

    if (field === "montoAportado") {
      const nuevoMonto = Number(value);
      const otrosAportes = newDonantes.reduce(
        (sum, d, i) => (i !== index ? sum + Number(d.montoAportado || 0) : sum),
        0
      );

      if (otrosAportes + nuevoMonto > formData.presupuesto.total) {
        toast({
          title: "Error",
          description:
            "El total de aportes no puede exceder el presupuesto total",
          status: "error",
          duration: 3000,
        });
        return;
      }

      newDonantes[index] = {
        ...newDonantes[index],
        montoAportado: nuevoMonto,
        porcentaje: (nuevoMonto / formData.presupuesto.total) * 100,
      };
    } else {
      newDonantes[index] = {
        ...newDonantes[index],
        [field]: value,
      };
    }

    handleInputChange("donantes", newDonantes);

    // Validar el total de aportes
    const totalAportes = newDonantes.reduce(
      (sum, d) => sum + Number(d.montoAportado || 0),
      0
    );

    const porcentajeTotal = (totalAportes / formData.presupuesto.total) * 100;

    if (totalAportes !== formData.presupuesto.total) {
      setValidationStatus((prev) => ({
        ...prev,
        donantes: {
          isValid: false,
          message: `El total de aportes debe ser igual al presupuesto total. 
                 Actual: ${porcentajeTotal.toFixed(2)}%`,
        },
      }));
    } else {
      setValidationStatus((prev) => ({
        ...prev,
        donantes: { isValid: true, message: null },
      }));
    }
  };

  // Manejadores de archivos
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: `${file.name} excede el tamaño máximo de 5MB`,
          status: "error",
          duration: 3000,
        });
        return false;
      }

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: `${file.name} no es un tipo de archivo válido`,
          status: "error",
          duration: 3000,
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Error",
        description: "No hay token de autenticación",
        status: "error",
        duration: 5000,
      });
      return;
    }

    try {
      const formDataFiles = new FormData();
      validFiles.forEach((file) => {
        formDataFiles.append("evidencias", file);
      });

      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto/${proyectoId}/evidencias`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataFiles,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir archivos");
      }

      const data = await response.json();

      if (!data.evidencias || !Array.isArray(data.evidencias)) {
        throw new Error("Formato de respuesta inválido");
      }

      // Actualizar el estado del formulario
      setFormData((prev) => ({
        ...prev,
        evidencias: [...prev.evidencias, ...data.evidencias],
      }));

      // Actualizar las previsualizaciones
      data.evidencias.forEach((evidencia) => {
        setPreviewImages((prev) => [
          ...prev,
          {
            url: evidencia.archivo,
            type: evidencia.tipo === "imagen" ? "image" : "pdf",
            name: evidencia.descripcion || "Archivo",
            id: evidencia._id || evidencia.id,
          },
        ]);
      });

      toast({
        title: "Éxito",
        description: "Archivos subidos correctamente",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error al subir archivos:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron subir los archivos",
        status: "error",
        duration: 5000,
      });
    }

    // Limpiar input
    e.target.value = "";
  };
  // Manejadores específicos para donantes y lugares
  const handleLugarChange = (index, nuevoLugar) => {
    const newLugares = [...formData.lugaresAPriorizar];
    newLugares[index] = nuevoLugar;
    setFormData((prev) => ({
      ...prev,
      lugaresAPriorizar: newLugares,
    }));
  };

  const agregarDonante = () => {
    setFormData((prev) => ({
      ...prev,
      donantes: [
        ...prev.donantes,
        { donante: "", montoAportado: 0, porcentaje: 0 },
      ],
    }));
  };

  const removerDonante = (index) => {
    const newDonantes = formData.donantes.filter((_, i) => i !== index);
    handleInputChange("donantes", newDonantes);
  };

  const agregarLugar = () => {
    const ultimaPrioridad =
      formData.lugaresAPriorizar.length > 0
        ? Math.max(...formData.lugaresAPriorizar.map((l) => l.prioridad || 1))
        : 0;

    setFormData((prev) => ({
      ...prev,
      lugaresAPriorizar: [
        ...prev.lugaresAPriorizar,
        {
          departamento: "",
          municipio: "",
          localidad: "",
          prioridad: Math.min(ultimaPrioridad + 1, 5),
        },
      ],
    }));
  };

  const removerLugar = (index) => {
    const newLugares = formData.lugaresAPriorizar.filter((_, i) => i !== index);
    handleInputChange("lugaresAPriorizar", newLugares);
  };

  const handleRemoveFile = async (index, evidenciaId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto/${proyectoId}/evidencias/${evidenciaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Error al eliminar el archivo");

      setPreviewImages((prev) => prev.filter((_, i) => i !== index));
      setFormData((prev) => ({
        ...prev,
        evidencias: prev.evidencias.filter((e) => e._id !== evidenciaId),
      }));

      toast({
        title: "Éxito",
        description: "Archivo eliminado correctamente",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Funciones de renderizado
  const renderInformacionBasica = () => (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <FormControl
          isRequired
          isInvalid={validationStatus.nombre?.isValid === false}
        >
          <FormLabel>Nombre del Proyecto</FormLabel>
          <Input
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Ingrese el nombre del proyecto"
          />
          {validationStatus.nombre?.message && (
            <FormErrorMessage>
              {validationStatus.nombre.message}
            </FormErrorMessage>
          )}
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl
          isRequired
          isInvalid={validationStatus.encargado?.isValid === false}
        >
          <FormLabel>Encargado</FormLabel>
          <Select
            value={formData.encargado}
            onChange={(e) => handleInputChange("encargado", e.target.value)}
            placeholder="Seleccione un encargado"
          >
            {datos.encargados.map((encargado) => (
              <option key={encargado._id} value={encargado._id}>
                {encargado.nombre}
              </option>
            ))}
          </Select>
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl
          isRequired
          isInvalid={validationStatus.presupuesto?.isValid === false}
        >
          <FormLabel>Presupuesto Total</FormLabel>
          <NumberInput
            value={formData.presupuesto.total}
            onChange={(value) =>
              handleInputChange("presupuesto", {
                ...formData.presupuesto,
                total: Number(value),
              })
            }
            min={0}
          >
            <NumberInputField placeholder="0.00" />
          </NumberInput>
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl>
          <FormLabel>Presupuesto Ejecutado</FormLabel>
          <NumberInput
            value={formData.presupuesto.ejecutado}
            isReadOnly
            isDisabled
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl
          isRequired
          isInvalid={validationStatus.fechaInicio?.isValid === false}
        >
          <FormLabel>Fecha de Inicio</FormLabel>
          <Input
            type="date"
            value={formData.fechaInicio}
            onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
          />
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl
          isRequired
          isInvalid={validationStatus.fechaFinal?.isValid === false}
        >
          <FormLabel>Fecha Final</FormLabel>
          <Input
            type="date"
            value={formData.fechaFinal}
            onChange={(e) => handleInputChange("fechaFinal", e.target.value)}
          />
        </FormControl>
      </GridItem>
    </Grid>
  );
  const renderObjetivosEstrategias = () => (
    <Stack spacing={6}>
      <FormControl
        isRequired
        isInvalid={validationStatus.objetivosGlobales?.isValid === false}
      >
        <FormLabel>Objetivos Globales</FormLabel>
        <QuickCreateSelect
          options={datos.objetivos}
          value={formData.objetivosGlobales}
          onChange={(value) => handleInputChange("objetivosGlobales", value)}
          placeholder="Seleccione objetivos globales"
          type="objetivo"
          isMulti
          error={validationStatus.objetivosGlobales?.message}
        />
      </FormControl>

      <FormControl
        isRequired
        isInvalid={validationStatus.lineasEstrategicas?.isValid === false}
      >
        <FormLabel>Líneas Estratégicas</FormLabel>
        <QuickCreateSelect
          options={datos.lineas}
          value={formData.lineasEstrategicas}
          onChange={(value) => handleInputChange("lineasEstrategicas", value)}
          placeholder="Seleccione líneas estratégicas"
          type="linea"
          isMulti
          error={validationStatus.lineasEstrategicas?.message}
        />
      </FormControl>
    </Stack>
  );

  const renderDonantes = () => {
    // Calcular totales
    const totalAportes = formData.donantes.reduce(
      (sum, d) => sum + Number(d.montoAportado || 0),
      0
    );

    return (
      <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <Stack spacing={4}>
          <Text fontWeight="bold">
            Presupuesto Total: Q{formData.presupuesto.total.toLocaleString()}
          </Text>
          {formData.donantes.map((donante, index) => (
            <Flex key={index} gap={4} align="flex-end">
              <Box flex={1}>
                <QuickCreateSelect
                  options={datos.donantes}
                  value={donante.donante}
                  onChange={(value) =>
                    handleDonanteChange(index, "donante", value)
                  }
                  placeholder="Seleccione un donante"
                  type="donante"
                  error={validationStatus[`donante_${index}`]?.message}
                />
              </Box>
              <FormControl w="32">
                <FormLabel>Monto</FormLabel>
                <NumberInput
                  value={donante.montoAportado}
                  onChange={(value) =>
                    handleDonanteChange(index, "montoAportado", Number(value))
                  }
                  min={0}
                  max={
                    formData.presupuesto.total -
                    formData.donantes.reduce(
                      (sum, d, i) =>
                        i !== index ? sum + Number(d.montoAportado || 0) : sum,
                      0
                    )
                  }
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <Text w="32" textAlign="right">
                {(
                  (donante.montoAportado / formData.presupuesto.total) *
                  100
                ).toFixed(2)}
                %
              </Text>
              {index > 0 && (
                <IconButton
                  icon={<Trash2 />}
                  onClick={() => removerDonante(index)}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                  aria-label="Eliminar donante"
                />
              )}
            </Flex>
          ))}

          <Button
            leftIcon={<Plus />}
            onClick={agregarDonante}
            variant="ghost"
            colorScheme="blue"
            size="sm"
            w="fit-content"
          >
            Agregar Donante
          </Button>

          <Alert
            status={
              totalAportes === formData.presupuesto.total
                ? "success"
                : "warning"
            }
          >
            <AlertIcon />
            <Box>
              <Text>
                Total Asignado: Q{totalAportes.toLocaleString()} (
                {((totalAportes / formData.presupuesto.total) * 100).toFixed(2)}
                %)
              </Text>
              <Text>
                Restante por Asignar: Q
                {(formData.presupuesto.total - totalAportes).toLocaleString()}
              </Text>
            </Box>
          </Alert>
        </Stack>
      </MotionBox>
    );
  };

  const renderUbicaciones = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Stack spacing={6}>
        {formData.lugaresAPriorizar.map((lugar, index) => (
          <UbicacionForm
            key={index}
            lugar={lugar}
            index={index}
            onUpdate={handleLugarChange}
            onRemove={removerLugar}
            error={errores[`lugar_${index}`]}
          />
        ))}

        <Button
          leftIcon={<Plus />}
          onClick={agregarLugar}
          variant="ghost"
          colorScheme="blue"
          size="sm"
          w="fit-content"
        >
          Agregar Ubicación
        </Button>
      </Stack>
    </MotionBox>
  );

  const renderActividades = () => (
    <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <ActividadesForm
        presupuestoTotal={Number(formData.presupuesto.total)}
        actividades={formData.actividades}
        onActividadesChange={(actividades) => {
          setFormData((prev) => ({
            ...prev,
            actividades,
          }));
        }}
        beneficiariosDisponibles={datos.beneficiarios}
        fechasProyecto={{
          fechaInicio: formData.fechaInicio || "",
          fechaFinal: formData.fechaFinal || "",
        }}
        onAvanceChange={(nuevoAvance) => {
          setFormData((prev) => ({
            ...prev,
            nivelAvance: nuevoAvance,
          }));
        }}
      />
    </MotionBox>
  );

  const renderEvidencias = () => (
    <Stack spacing={6}>
      <FormControl>
        <FormLabel>Evidencias del Proyecto</FormLabel>
        <VStack spacing={4} align="stretch">
          <Input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            display="none"
            id="file-upload"
          />
          <Button
            as="label"
            htmlFor="file-upload"
            leftIcon={<Upload />}
            colorScheme="blue"
            cursor="pointer"
          >
            Subir Archivos
          </Button>
          <Text fontSize="sm" color="gray.500">
            Formatos permitidos: Imágenes y PDF (Máx. 5MB por archivo)
          </Text>

          <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
            {previewImages.map((preview, index) => (
              <Card key={index}>
                <CardBody p={2}>
                  <AspectRatio ratio={4 / 3}>
                    <Box position="relative">
                      {preview.type === "image" ? (
                        <Image
                          src={preview.url}
                          alt={`Evidencia ${index + 1}`}
                          objectFit="cover"
                          w="full"
                          h="full"
                          borderRadius="md"
                        />
                      ) : (
                        <Flex
                          bg="gray.100"
                          align="center"
                          justify="center"
                          w="full"
                          h="full"
                          borderRadius="md"
                        >
                          <Files size={40} />
                          <Text ml={2}>PDF</Text>
                        </Flex>
                      )}
                      <IconButton
                        icon={<Trash2 />}
                        size="sm"
                        colorScheme="red"
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={() => handleRemoveFile(index, preview.id)}
                        aria-label="Eliminar archivo"
                      />
                    </Box>
                  </AspectRatio>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </VStack>
      </FormControl>
    </Stack>
  );

  const renderConfiguracionFinal = () => (
    <Stack spacing={6}>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        <GridItem>
          <FormControl>
            <FormLabel>Implicación de Municipalidades</FormLabel>
            <Select
              value={formData.implicacionMunicipalidades}
              onChange={(e) =>
                handleInputChange("implicacionMunicipalidades", e.target.value)
              }
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
              <option value="Nula">Nula</option>
            </Select>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel>Frecuencia de Seguimiento</FormLabel>
            <Select
              value={formData.seguimiento.frecuencia}
              onChange={(e) =>
                handleInputChange("seguimiento", {
                  ...formData.seguimiento,
                  frecuencia: e.target.value,
                })
              }
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
            </Select>
          </FormControl>
        </GridItem>
      </Grid>

      <FormControl>
        <Checkbox
          isChecked={formData.seguimiento.requiereVisita}
          onChange={(e) =>
            handleInputChange("seguimiento", {
              ...formData.seguimiento,
              requiereVisita: e.target.checked,
            })
          }
        >
          Requiere Visita Presencial
        </Checkbox>
      </FormControl>

      <Divider />

      <Card>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Text fontWeight="medium" fontSize="lg">
              Resumen del Proyecto
            </Text>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={4}
            >
              <Text>
                <strong>Nombre:</strong> {formData.nombre}
              </Text>
              <Text>
                <strong>Presupuesto Total:</strong> Q
                {formData.presupuesto.total.toLocaleString()}
              </Text>
              <Text>
                <strong>Presupuesto Ejecutado:</strong> Q
                {formData.presupuesto.ejecutado.toLocaleString()}
              </Text>
              <Text>
                <strong>Nivel de Avance:</strong> {formData.nivelAvance}%
              </Text>
              <Text>
                <strong>Donantes:</strong>{" "}
                {
                  formData.donantes.filter(
                    (d) => d.donante && d.montoAportado > 0
                  ).length
                }
              </Text>
              <Text>
                <strong>Actividades:</strong> {formData.actividades.length}
              </Text>
              <Text>
                <strong>Evidencias:</strong> {previewImages.length} archivos
              </Text>
              <Text>
                <strong>Ubicaciones:</strong>{" "}
                {
                  formData.lugaresAPriorizar.filter(
                    (l) => l.departamento && l.municipio && l.localidad
                  ).length
                }
              </Text>
            </Grid>

            {Object.keys(errores).length > 0 && (
              <Alert status="error" mt={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>
                    Por favor corrija los siguientes errores:
                  </AlertTitle>
                  <VStack align="start" mt={2}>
                    {Object.values(errores).map((error, index) => (
                      <Text key={index} fontSize="sm">
                        {error}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Stack>
  );
  // Lógica de validación
  const validateField = (name, value) => {
    let error = null;

    switch (name) {
      case "nombre":
        if (!value?.trim()) error = "El nombre es requerido";
        else if (value.length < 3)
          error = "El nombre debe tener al menos 3 caracteres";
        break;
      case "encargado":
        if (!value) error = "Debe seleccionar un encargado";
        break;
      case "presupuesto":
        if (!value.total) error = "El presupuesto es requerido";
        else if (isNaN(value.total) || value.total <= 0)
          error = "Ingrese un valor válido mayor a 0";
        break;
      case "fechaInicio":
        if (!value) error = "La fecha de inicio es requerida";
        break;
      case "fechaFinal":
        if (!value) error = "La fecha final es requerida";
        if (
          value &&
          formData.fechaInicio &&
          new Date(value) <= new Date(formData.fechaInicio)
        ) {
          error = "La fecha final debe ser posterior a la fecha de inicio";
        }
        break;
      case "objetivosGlobales":
        if (!value || value.length === 0)
          error = "Debe seleccionar al menos un objetivo";
        break;
      case "lineasEstrategicas":
        if (!value || value.length === 0)
          error = "Debe seleccionar al menos una línea estratégica";
        break;
      case "donantes":
        if (!value || !Array.isArray(value) || value.length === 0) {
          error = "Debe agregar al menos un donante";
        } else {
          const totalAportes = value.reduce(
            (sum, d) => sum + Number(d.montoAportado || 0),
            0
          );
          if (totalAportes !== formData.presupuesto.total) {
            error = `El total de aportes debe ser igual al presupuesto total`;
          }
        }
        break;
      default:
        break;
    }

    setValidationStatus((prev) => ({
      ...prev,
      [name]: { isValid: !error, message: error },
    }));

    return error;
  };

  // Validación del paso actual
  const validateStep = () => {
    let stepErrors = {};

    switch (currentStep) {
      case 1: // Información Básica
        if (!formData.nombre?.trim())
          stepErrors.nombre = "El nombre es requerido";
        if (!formData.encargado)
          stepErrors.encargado = "Debe seleccionar un encargado";
        if (!formData.presupuesto.total)
          stepErrors.presupuesto = "El presupuesto es requerido";
        if (!formData.fechaInicio)
          stepErrors.fechaInicio = "La fecha de inicio es requerida";
        if (!formData.fechaFinal)
          stepErrors.fechaFinal = "La fecha final es requerida";
        break;

      case 2: // Objetivos y Estrategias
        if (!formData.objetivosGlobales?.length) {
          stepErrors.objetivosGlobales =
            "Debe seleccionar al menos un objetivo";
        }
        if (!formData.lineasEstrategicas?.length) {
          stepErrors.lineasEstrategicas =
            "Debe seleccionar al menos una línea estratégica";
        }
        break;

      case 3: // Donantes
        if (!formData.donantes.some((d) => d.donante && d.montoAportado > 0)) {
          stepErrors.donantes = "Debe configurar al menos un donante";
        } else {
          const totalAportes = formData.donantes.reduce(
            (sum, d) => sum + Number(d.montoAportado || 0),
            0
          );
          if (totalAportes !== formData.presupuesto.total) {
            stepErrors.donantes = `Los aportes deben sumar el presupuesto total (Q${formData.presupuesto.total})`;
          }
        }
        break;

      case 4: // Ubicaciones
        if (!formData.lugaresAPriorizar?.length) {
          stepErrors.lugaresAPriorizar = "Debe agregar al menos una ubicación";
        } else {
          formData.lugaresAPriorizar.forEach((lugar, index) => {
            if (!lugar.departamento || !lugar.municipio || !lugar.localidad) {
              stepErrors[`lugar_${index}`] =
                "Todos los campos de ubicación son requeridos";
            }
          });
        }
        break;

      default:
        break;
    }

    setErrores(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Navegación entre pasos
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Renderizado del paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderInformacionBasica();
      case 2:
        return renderObjetivosEstrategias();
      case 3:
        return renderDonantes();
      case 4:
        return renderUbicaciones();
      case 5:
        return renderActividades();
      case 6:
        return renderEvidencias();
      case 7:
        return renderConfiguracionFinal();
      default:
        return null;
    }
  };

  // Renderizado del indicador de pasos
  const renderStepIndicator = () => (
    <Flex justify="space-between" mb={8}>
      {steps.map((step, index) => (
        <Flex key={index} direction="column" align="center" position="relative">
          <Flex
            w="8"
            h="8"
            rounded="full"
            align="center"
            justify="center"
            bg={
              index + 1 === currentStep
                ? "blue.100"
                : index + 1 < currentStep
                ? "green.100"
                : "gray.100"
            }
            border={index + 1 === currentStep ? "2px solid" : "none"}
            borderColor="blue.600"
          >
            {index + 1 < currentStep ? (
              <CheckCircle size={20} color="green" />
            ) : (
              <Text>{index + 1}</Text>
            )}
          </Flex>
          <Text
            fontSize="xs"
            mt={2}
            w="24"
            textAlign="center"
            color={
              index + 1 === currentStep
                ? "blue.600"
                : index + 1 < currentStep
                ? "green.500"
                : "gray.400"
            }
          >
            {step}
          </Text>
          {index < steps.length - 1 && (
            <Box
              position="absolute"
              top="4"
              left="8"
              w="calc(200% - 2rem)"
              h="0.5"
              bg={index + 1 < currentStep ? "green.500" : "gray.200"}
            />
          )}
        </Flex>
      ))}
    </Flex>
  );
  // Función de envío del formulario
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación");

      // Preparar actividades con toda su información
      const actividadesCompletas = formData.actividades.map((actividad) => ({
        nombre: actividad.nombre,
        descripcion: actividad.descripcion || "",
        presupuestoAsignado: Number(actividad.presupuestoAsignado),
        porcentajePresupuesto:
          (Number(actividad.presupuestoAsignado) / formData.presupuesto.total) *
          100,
        avance: Number(actividad.avance) || 0,
        fechaInicio: actividad.fechaInicio,
        fechaFin: actividad.fechaFin,
        estado: actividad.estado || "Pendiente",
        observaciones: actividad.observaciones || "",
        beneficiariosAsociados:
          actividad.beneficiariosAsociados?.map((b) => ({
            beneficiario:
              typeof b.beneficiario === "string"
                ? b.beneficiario
                : b.beneficiario._id,
            estado: "Activo",
            fechaAsignacion: new Date().toISOString(),
          })) || [],
      }));

      // Preparar los datos para enviar
      const dataToUpdate = {
        ...formData,
        presupuesto: {
          total: Number(formData.presupuesto.total),
          ejecutado: Number(formData.presupuesto.ejecutado),
        },
        objetivosGlobales: formData.objetivosGlobales,
        lineasEstrategicas: formData.lineasEstrategicas,
        actividades: actividadesCompletas,
        donantes: formData.donantes
          .filter((d) => d.donante && d.montoAportado > 0)
          .map((d) => ({
            donante: d.donante,
            montoAportado: Number(d.montoAportado),
            porcentaje:
              (Number(d.montoAportado) / formData.presupuesto.total) * 100,
          })),
        lugaresAPriorizar: formData.lugaresAPriorizar
          .filter((l) => l.departamento && l.municipio && l.localidad)
          .map((l) => ({
            departamento: l.departamento.trim(),
            municipio: l.municipio.trim(),
            localidad: l.localidad.trim(),
            prioridad: Number(l.prioridad) || 1,
          })),
        nivelAvance: Number(formData.nivelAvance),
        personasAlcanzadas: Number(formData.personasAlcanzadas),
        seguimiento: {
          ...formData.seguimiento,
          proximoSeguimiento: new Date(formData.fechaInicio).toISOString(),
        },
      };

      // Eliminar campos que no deben actualizarse
      delete dataToUpdate._id;
      delete dataToUpdate.createdAt;
      delete dataToUpdate.updatedAt;
      delete dataToUpdate.__v;
      delete dataToUpdate.numero;
      delete dataToUpdate.codigo;

      const response = await fetch(
        `${process.env.REACT_APP_backend}/proyecto/${proyectoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToUpdate),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el proyecto");
      }

      const proyectoActualizado = await response.json();

      toast({
        title: "Éxito",
        description: "Proyecto actualizado correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess(proyectoActualizado);
      }
    } catch (error) {
      console.error("Error al actualizar proyecto:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Renderizado principal del componente
  if (isLoading) {
    return (
      <Box p={5}>
        <Progress size="xs" isIndeterminate />
        <Text mt={2} textAlign="center">
          Cargando proyecto...
        </Text>
      </Box>
    );
  }

  return (
    <Box maxW="6xl" mx="auto" px={6} py={4}>
      <Card>
        <CardBody>
          {/* Header con título y botón de cerrar */}
          <Flex mb={6} justify="space-between" align="center">
            <Heading size="md">Editar Proyecto: {formData.nombre}</Heading>
            <IconButton
              icon={<X size={20} />}
              aria-label="Cerrar"
              variant="ghost"
              onClick={onCancel}
            />
          </Flex>

          {/* Indicador de pasos */}
          {renderStepIndicator()}

          {/* Contenido del paso actual */}
          <Box mb={8} position="relative">
            {renderCurrentStep()}
          </Box>

          {/* Botones de navegación */}
          <Flex justify="space-between" mt={8}>
            <Button
              leftIcon={<ArrowLeft />}
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              variant="ghost"
            >
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </Button>

            {currentStep < steps.length ? (
              <Button
                rightIcon={<ArrowRight />}
                onClick={handleNext}
                colorScheme="blue"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                rightIcon={<Save />}
                onClick={handleSubmit}
                isLoading={isSaving}
                colorScheme="green"
                loadingText="Guardando..."
              >
                Guardar Cambios
              </Button>
            )}
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
}

export default EditarProyecto;