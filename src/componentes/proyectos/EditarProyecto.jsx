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
  HStack,
  Image,
  AspectRatio,
  Divider,
  FormErrorMessage,
  Textarea,
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
  X
} from "lucide-react";
import { motion } from "framer-motion";
import QuickCreateSelect from "./QuickCreateSelect";
import PropTypes from "prop-types";

const MotionBox = motion(Box);

// Definición de PropTypes fuera del componente
EditarProyecto.propTypes = {
  proyectoId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

function EditarProyecto({ proyectoId, onCancel, onSuccess }) {
  // 1. Estados
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: "",
    encargado: "",
    presupuesto: "",
    fechaInicio: "",
    fechaFinal: "",
    objetivosGlobales: [],
    lineasEstrategicas: [],
    donantes: [{ donante: "", porcentaje: 0 }],
    lugaresAPriorizar: [
      { departamento: "", municipio: "", localidad: "", prioridad: 1 },
    ],
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
    "Beneficiarios y Avance",
    "Evidencias",
    "Configuración Final",
  ];

  // 2. Efecto para cargar datos iniciales
  useEffect(() => {
    if (!proyectoId) {
      toast({
        title: "Error",
        description: "ID de proyecto no proporcionado",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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
          donantes: proyecto.donantes?.map((d) => ({
            donante: d.donante._id,
            porcentaje: d.porcentaje,
          })) || [{ donante: "", porcentaje: 0 }],
          beneficiarios:
            proyecto.beneficiarios?.map((b) => {
              // Si el beneficiario viene como referencia completa
              if (typeof b === "object" && b.beneficiario) {
                return b.beneficiario._id;
              }
              // Si el beneficiario viene como ID directo
              if (typeof b === "object" && b._id) {
                return b._id;
              }
              // Si es solo el ID como string
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
  // 3. Manejadores de eventos
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
    newDonantes[index] = {
      ...newDonantes[index],
      [field]: value,
    };
    handleInputChange("donantes", newDonantes);

    // Validar suma de porcentajes
    const sumaPorcentajes = newDonantes.reduce(
      (sum, d) => sum + Number(d.porcentaje || 0),
      0
    );
    if (sumaPorcentajes !== 100) {
      setValidationStatus((prev) => ({
        ...prev,
        donantes: {
          isValid: false,
          message: `La suma de porcentajes debe ser 100%. Actual: ${sumaPorcentajes}%`,
        },
      }));
    } else {
      setValidationStatus((prev) => ({
        ...prev,
        donantes: { isValid: true, message: null },
      }));
    }
  };

  // Manejador de lugares
  const handleLugarChange = (index, field, value) => {
    const newLugares = [...formData.lugaresAPriorizar];
    newLugares[index] = {
      ...newLugares[index],
      [field]: field === "prioridad" ? Number(value) || 1 : value,
    };
    handleInputChange("lugaresAPriorizar", newLugares);
  };

  // 4. Manejadores de archivos
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

  // 5. Funciones auxiliares para donantes y lugares
  const agregarDonante = () => {
    setFormData((prev) => ({
      ...prev,
      donantes: [...prev.donantes, { donante: "", porcentaje: 0 }],
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
          <FormLabel>Presupuesto</FormLabel>
          <NumberInput
            value={formData.presupuesto}
            onChange={(value) => handleInputChange("presupuesto", value)}
            min={0}
          >
            <NumberInputField placeholder="0.00" />
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

  const renderDonantes = () => (
    <Stack spacing={4}>
      {formData.donantes.map((donante, index) => (
        <Flex key={index} gap={4} align="flex-end">
          <Box flex={1}>
            <QuickCreateSelect
              options={datos.donantes}
              value={donante.donante}
              onChange={(value) => handleDonanteChange(index, "donante", value)}
              placeholder="Seleccione un donante"
              type="donante"
              error={validationStatus[`donante_${index}`]?.message}
            />
          </Box>
          <FormControl w="32">
            <FormLabel>Porcentaje</FormLabel>
            <NumberInput
              value={donante.porcentaje}
              onChange={(value) =>
                handleDonanteChange(index, "porcentaje", Number(value))
              }
              min={0}
              max={100}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
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
    </Stack>
  );

  const renderUbicaciones = () => (
    <Stack spacing={6}>
      {formData.lugaresAPriorizar.map((lugar, index) => (
        <Grid
          key={index}
          templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
          gap={4}
        >
          <GridItem>
            <FormControl>
              <FormLabel>Departamento</FormLabel>
              <Input
                value={lugar.departamento}
                onChange={(e) =>
                  handleLugarChange(index, "departamento", e.target.value)
                }
                placeholder="Departamento"
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel>Municipio</FormLabel>
              <Input
                value={lugar.municipio}
                onChange={(e) =>
                  handleLugarChange(index, "municipio", e.target.value)
                }
                placeholder="Municipio"
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel>Localidad</FormLabel>
              <Input
                value={lugar.localidad}
                onChange={(e) =>
                  handleLugarChange(index, "localidad", e.target.value)
                }
                placeholder="Localidad"
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <Flex gap={2} alignItems="flex-end" h="full">
              <FormControl flex={1}>
                <FormLabel>Prioridad</FormLabel>
                <NumberInput
                  value={lugar.prioridad}
                  onChange={(valueString, valueNumber) =>
                    handleLugarChange(index, "prioridad", valueNumber)
                  }
                  min={1}
                  max={5}
                  defaultValue={1}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              {index > 0 && (
                <IconButton
                  icon={<Trash2 />}
                  onClick={() => removerLugar(index)}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                  aria-label="Eliminar ubicación"
                />
              )}
            </Flex>
          </GridItem>
        </Grid>
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
  );

  const renderBeneficiariosAvance = () => (
    <Stack spacing={6}>
      <FormControl isInvalid={validationStatus.nivelAvance?.isValid === false}>
        <FormLabel>Nivel de Avance</FormLabel>
        <HStack spacing={4} align="center">
          <NumberInput
            value={formData.nivelAvance}
            onChange={(value) =>
              handleInputChange("nivelAvance", Number(value))
            }
            min={0}
            max={100}
            w="100px"
          >
            <NumberInputField />
          </NumberInput>
          <Progress
            value={formData.nivelAvance}
            w="full"
            colorScheme="green"
            hasStripe
          />
          <Text>{formData.nivelAvance}%</Text>
        </HStack>
      </FormControl>

      <FormControl>
        <FormLabel>Personas Alcanzadas</FormLabel>
        <NumberInput
          value={formData.personasAlcanzadas}
          onChange={(value) =>
            handleInputChange("personasAlcanzadas", Number(value))
          }
          min={0}
        >
          <NumberInputField />
        </NumberInput>
      </FormControl>

      <FormControl>
        <FormLabel>Beneficiarios</FormLabel>
        <QuickCreateSelect
          options={datos.beneficiarios.map((b) => ({
            _id: b._id,
            nombre: b.nombre,
            // Agrega cualquier otro campo que necesites mostrar
          }))}
          value={formData.beneficiarios}
          onChange={(value) => handleInputChange("beneficiarios", value)}
          placeholder="Seleccione beneficiarios"
          type="beneficiario"
          isMulti={true}
          error={validationStatus.beneficiarios?.message}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Observaciones</FormLabel>
        <Textarea
          value={formData.observaciones}
          onChange={(e) => handleInputChange("observaciones", e.target.value)}
          placeholder="Ingrese observaciones"
        />
      </FormControl>
    </Stack>
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
          >
            Subir Archivos
          </Button>

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
              value={formData.seguimiento?.frecuencia}
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
          isChecked={formData.seguimiento?.requiereVisita}
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
                <strong>Presupuesto:</strong> Q
                {Number(formData.presupuesto).toLocaleString()}
              </Text>
              <Text>
                <strong>Nivel de Avance:</strong> {formData.nivelAvance}%
              </Text>
              <Text>
                <strong>Personas Alcanzadas:</strong>{" "}
                {formData.personasAlcanzadas}
              </Text>
              <Text>
                <strong>Donantes:</strong>{" "}
                {
                  formData.donantes.filter((d) => d.donante && d.porcentaje > 0)
                    .length
                }
              </Text>
              <Text>
                <strong>Beneficiarios:</strong> {formData.beneficiarios.length}
              </Text>
              <Text>
                <strong>Evidencias:</strong> {formData.evidencias.length}{" "}
                archivos
              </Text>
              <Text>
                <strong>Ubicaciones:</strong>{" "}
                {
                  formData.lugaresAPriorizar.filter(
                    (l) => l.departamento || l.municipio || l.localidad
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

  // 6. Validación de campos
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
        if (!value) error = "El presupuesto es requerido";
        else if (isNaN(value) || value <= 0)
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
        } else if (!value.some((d) => d.donante && d.porcentaje > 0)) {
          error = "Debe configurar al menos un donante";
        } else {
          const sumaPorcentajes = value.reduce(
            (sum, d) => sum + Number(d.porcentaje || 0),
            0
          );
          if (sumaPorcentajes !== 100) {
            error = `La suma de porcentajes debe ser 100%. Actual: ${sumaPorcentajes}%`;
          }
        }
        break;
      case "lugaresAPriorizar":
        if (!value || !Array.isArray(value) || value.length === 0) {
          error = "Debe agregar al menos una ubicación";
        } else {
          const lugarInvalido = value.some(
            (lugar) =>
              !lugar.departamento || !lugar.municipio || !lugar.localidad
          );
          if (lugarInvalido) {
            error = "Todos los campos de ubicación son requeridos";
          }
        }
        break;
      case "nivelAvance":
        if (value < 0 || value > 100)
          error = "El nivel de avance debe estar entre 0 y 100";
        break;
      case "personasAlcanzadas":
        if (value < 0)
          error = "El número de personas alcanzadas no puede ser negativo";
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

  // 7. Validación de pasos
  const validateStep = () => {
    let stepErrors = {};

    switch (currentStep) {
      case 1: // Información Básica
        if (!formData.nombre?.trim())
          stepErrors.nombre = "El nombre es requerido";
        if (!formData.encargado)
          stepErrors.encargado = "Debe seleccionar un encargado";
        if (!formData.presupuesto)
          stepErrors.presupuesto = "El presupuesto es requerido";
        if (!formData.fechaInicio)
          stepErrors.fechaInicio = "La fecha de inicio es requerida";
        if (!formData.fechaFinal)
          stepErrors.fechaFinal = "La fecha final es requerida";
        if (
          formData.fechaFinal &&
          formData.fechaInicio &&
          new Date(formData.fechaFinal) <= new Date(formData.fechaInicio)
        ) {
          stepErrors.fechaFinal =
            "La fecha final debe ser posterior a la fecha de inicio";
        }
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
        const donantesValidos = formData.donantes.filter(
          (d) => d.donante && d.porcentaje > 0
        );
        if (donantesValidos.length === 0) {
          stepErrors.donantes = "Debe configurar al menos un donante";
        } else {
          const sumaPorcentajes = donantesValidos.reduce(
            (sum, d) => sum + Number(d.porcentaje),
            0
          );
          if (sumaPorcentajes !== 100) {
            stepErrors.donantes = `La suma de porcentajes debe ser 100%. Actual: ${sumaPorcentajes}%`;
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

      case 5: // Beneficiarios y Avance
        if (formData.nivelAvance < 0 || formData.nivelAvance > 100) {
          stepErrors.nivelAvance =
            "El nivel de avance debe estar entre 0 y 100";
        }
        if (formData.personasAlcanzadas < 0) {
          stepErrors.personasAlcanzadas =
            "El número de personas alcanzadas no puede ser negativo";
        }
        break;

      default:
        break;
    }

    setErrores(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // 8. Navegación entre pasos
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // 9. Envío final del formulario
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación");

      // Preparar datos para enviar
      const dataToUpdate = {
        ...formData,
        // Formatear los datos correctamente
        objetivosGlobales: Array.isArray(formData.objetivosGlobales)
          ? formData.objetivosGlobales
          : [],
        lineasEstrategicas: Array.isArray(formData.lineasEstrategicas)
          ? formData.lineasEstrategicas
          : [],
        donantes: formData.donantes
          .filter((d) => d.donante && d.porcentaje > 0)
          .map((d) => ({
            donante: d.donante,
            porcentaje: Number(d.porcentaje),
          })),
        beneficiarios: formData.beneficiarios.map((id) => ({
          beneficiario: id,
          estado: "Activo",
          fechaIngreso: new Date().toISOString(),
        })),
        lugaresAPriorizar: formData.lugaresAPriorizar
          .filter((l) => l.departamento && l.municipio && l.localidad)
          .map((l) => ({
            departamento: l.departamento.trim(),
            municipio: l.municipio.trim(),
            localidad: l.localidad.trim(),
            prioridad: Number(l.prioridad) || 1,
          })),
        // Asegurar que los campos numéricos sean números
        presupuesto: Number(formData.presupuesto),
        nivelAvance: Number(formData.nivelAvance),
        personasAlcanzadas: Number(formData.personasAlcanzadas),
        // Asegurar formato de fechas
        fechaInicio: formData.fechaInicio,
        fechaFinal: formData.fechaFinal,
        // Excluir campos no necesarios
        numero: undefined,
        codigo: undefined,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        __v: undefined,
      };

      console.log("Datos a enviar:", dataToUpdate); // Para debugging

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
      });
    } finally {
      setIsSaving(false);
    }
  };
  // 10. Funciones de renderizado
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

  const renderCurrentStep = () => {
    const commonMotionProps = {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3 },
    };

    switch (currentStep) {
      case 1:
        return (
          <MotionBox {...commonMotionProps}>
            {renderInformacionBasica()}
          </MotionBox>
        );
      case 2:
        return (
          <MotionBox {...commonMotionProps}>
            {renderObjetivosEstrategias()}
          </MotionBox>
        );
      case 3:
        return <MotionBox {...commonMotionProps}>{renderDonantes()}</MotionBox>;
      case 4:
        return (
          <MotionBox {...commonMotionProps}>{renderUbicaciones()}</MotionBox>
        );
      case 5:
        return (
          <MotionBox {...commonMotionProps}>
            {renderBeneficiariosAvance()}
          </MotionBox>
        );
      case 6:
        return (
          <MotionBox {...commonMotionProps}>{renderEvidencias()}</MotionBox>
        );
      case 7:
        return (
          <MotionBox {...commonMotionProps}>
            {renderConfiguracionFinal()}
          </MotionBox>
        );
      default:
        return null;
    }
  };

  const renderErrores = () => {
    if (Object.keys(errores).length === 0) return null;

    return (
      <Alert status="error" mt={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Por favor corrija los siguientes errores:</AlertTitle>
          <VStack align="start" mt={2}>
            {Object.values(errores).map((error, index) => (
              <Text key={index} fontSize="sm">
                {error}
              </Text>
            ))}
          </VStack>
        </Box>
      </Alert>
    );
  };

  // 11. Renderizado del componente
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

          {/* Mensajes de error */}
          {renderErrores()}

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
