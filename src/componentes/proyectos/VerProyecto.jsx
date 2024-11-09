import React from "react";
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Button,
  Grid,
  GridItem,
  Icon,
  useToast,
} from "@chakra-ui/react";
import {
  Download,
  Users,
  MapPin,
  Calendar,
  Clipboard,
  DollarSign,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const VerProyecto = ({ proyecto }) => {
  const toast = useToast();

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-GT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPresupuesto = (monto) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(monto);
  };

  // Función para generar el PDF
  const generatePDF = () => {
    try {
      // Configuración inicial para tamaño carta
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });
  
      // Configuración de márgenes y dimensiones
      const margin = 40;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;
  
      // Definición de estilos y colores
      const styles = {
        header: {
          fontSize: 16,
          textColor: [255, 255, 255],
          fillColor: [30, 144, 255],
          height: 90
        },
        section: {
          fontSize: 12,
          textColor: [255, 255, 255],
          fillColor: [51, 122, 183],
          height: 25
        },
        table: {
          fontSize: 10,
          lineHeight: 1.2,
          cellPadding: 6
        }
      };
  
      // Función para añadir encabezados de sección
      const addSectionHeader = (title) => {
        doc.setFillColor(...styles.section.fillColor);
        doc.rect(margin, y, contentWidth, styles.section.height, 'F');
        doc.setTextColor(...styles.section.textColor);
        doc.setFontSize(styles.section.fontSize);
        doc.text(title, margin + 10, y + 17);
        return y + styles.section.height + 10;
      };
  
      // Agregar logo y cabecera
      const logoUrl = `${window.location.origin}/img/logo.png`;
      doc.addImage(logoUrl, 'PNG', margin, margin, 50, 50);
  
      doc.setFillColor(...styles.header.fillColor);
      doc.rect(0, 0, pageWidth, styles.header.height, 'F');
      doc.setTextColor(...styles.header.textColor);
      doc.setFontSize(styles.header.fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(`Proyecto: ${proyecto.nombre}`, margin + 60, styles.header.height/2);
  
      y = styles.header.height + 20;
  
      // Información General
      y = addSectionHeader('INFORMACIÓN GENERAL');
  
      // Tabla de información general con 4 columnas bien distribuidas
      const infoTableWidth = [80, 150, 80, 150]; // Anchos de columna
      doc.autoTable({
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: infoTableWidth[0], fontStyle: 'bold' },
          1: { cellWidth: infoTableWidth[1] },
          2: { cellWidth: infoTableWidth[2], fontStyle: 'bold' },
          3: { cellWidth: infoTableWidth[3] }
        },
        body: [
          ['Código:', proyecto.codigo || 'N/A', 'Fecha Inicio:', formatFecha(proyecto.fechaInicio)],
          ['Número:', proyecto.numero || 'N/A', 'Fecha Final:', formatFecha(proyecto.fechaFinal)],
          ['Estado:', proyecto.estado || 'N/A', 'Presupuesto:', formatPresupuesto(proyecto.presupuesto?.total)],
          ['Encargado:', proyecto.encargado?.nombre || 'N/A', 'Nivel Avance:', `${proyecto.nivelAvance || 0}%`]
        ],
        margin: { left: margin, right: margin },
        styles: { fontSize: styles.table.fontSize, cellPadding: styles.table.cellPadding }
      });
  
      y = doc.lastAutoTable.finalY + 20;
  
      // Actividades del Proyecto
      y = addSectionHeader('ACTIVIDADES DEL PROYECTO');
  
      // Iterar sobre cada actividad
      proyecto.actividades?.forEach((actividad, index) => {
        // Verificar espacio disponible
        if (y > pageHeight - 150) {
          doc.addPage();
          y = margin;
        }
  
        // Información de la actividad
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentWidth, 40, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Actividad ${index + 1}: ${actividad.nombre}`, margin + 10, y + 20);
        
        doc.setFontSize(10);
        doc.text(`Avance: ${actividad.avance}%`, margin + 10, y + 35);
        doc.text(`Presupuesto: ${formatPresupuesto(actividad.presupuestoAsignado)}`, margin + contentWidth/2, y + 35);
  
        y += 50;
  
        // Tabla de beneficiarios
        if (actividad.beneficiariosAsociados && actividad.beneficiariosAsociados.length > 0) {
          const beneficiariosData = actividad.beneficiariosAsociados.map(b => {
            const beneficiario = typeof b.beneficiario === 'object' 
              ? b.beneficiario 
              : proyecto.beneficiarios?.find(ben => ben.beneficiario._id === b.beneficiario)?.beneficiario;
  
            return [
              beneficiario?.nombre || 'N/A',
              beneficiario?.dpi || 'N/A',
              beneficiario?.telefono || 'N/A',
              formatFecha(b.fechaAsignacion),
              b.estado || 'N/A'
            ];
          });
  
          doc.autoTable({
            startY: y,
            head: [['Beneficiario', 'DPI', 'Teléfono', 'Fecha Asignación', 'Estado']],
            body: beneficiariosData,
            theme: 'striped',
            headStyles: {
              fillColor: [51, 122, 183],
              textColor: [255, 255, 255],
              fontSize: 10,
              fontStyle: 'bold'
            },
            columnStyles: {
              0: { cellWidth: contentWidth * 0.25 },
              1: { cellWidth: contentWidth * 0.2 },
              2: { cellWidth: contentWidth * 0.15 },
              3: { cellWidth: contentWidth * 0.25 },
              4: { cellWidth: contentWidth * 0.15 }
            },
            margin: { left: margin, right: margin },
            styles: {
              fontSize: 9,
              cellPadding: 5,
              overflow: 'linebreak',
              halign: 'left'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            }
          });
  
          y = doc.lastAutoTable.finalY + 15;
        } else {
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(10);
          doc.text("No hay beneficiarios asociados", margin + 10, y);
          y += 20;
        }
      });
  
      // Donantes
      if (y > pageHeight - 150) {
        doc.addPage();
        y = margin;
      }
  
      y = addSectionHeader('DONANTES');
  
      if (proyecto.donantes && proyecto.donantes.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['Donante', 'Monto Aportado', 'Porcentaje', 'Fecha Compromiso']],
          body: proyecto.donantes.map(d => [
            d.donante?.nombre || 'N/A',
            formatPresupuesto(d.montoAportado),
            `${d.porcentaje}%`,
            formatFecha(d.fechaCompromiso)
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [51, 122, 183],
            textColor: [255, 255, 255]
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.3 },
            1: { cellWidth: contentWidth * 0.25, halign: 'right' },
            2: { cellWidth: contentWidth * 0.2, halign: 'right' },
            3: { cellWidth: contentWidth * 0.25 }
          },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 5 }
        });
  
        y = doc.lastAutoTable.finalY + 15;
      }
  
      // Lugares Priorizados
      if (y > pageHeight - 150) {
        doc.addPage();
        y = margin;
      }
  
      y = addSectionHeader('LUGARES PRIORIZADOS');
  
      if (proyecto.lugaresAPriorizar && proyecto.lugaresAPriorizar.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['Departamento', 'Municipio', 'Localidad', 'Prioridad']],
          body: proyecto.lugaresAPriorizar.map(lugar => [
            lugar.departamento || 'N/A',
            lugar.municipio || 'N/A',
            lugar.localidad || 'N/A',
            lugar.prioridad?.toString() || 'N/A'
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [51, 122, 183],
            textColor: [255, 255, 255]
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.25 },
            1: { cellWidth: contentWidth * 0.25 },
            2: { cellWidth: contentWidth * 0.25 },
            3: { cellWidth: contentWidth * 0.25, halign: 'center' }
          },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 5 }
        });
      }
  
      // Pie de página en todas las páginas
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString()}`,
          pageWidth/2,
          pageHeight - 20,
          { align: 'center' }
        );
      }
  
      // Guardar el PDF
      doc.save(`Proyecto_${proyecto.codigo || 'reporte'}.pdf`);
  
      toast({
        title: "PDF generado con éxito",
        description: "El documento se ha descargado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
  
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: error.message || "No se pudo generar el documento PDF",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box className="p-6 max-w-6xl mx-auto">
      <Card className="bg-white shadow-lg">
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Header con información básica */}
            <HStack justify="space-between" wrap="wrap">
              <VStack align="start" spacing={1}>
                <Heading size="lg">{proyecto.nombre}</Heading>
                <HStack>
                  <Badge colorScheme="purple">{proyecto.numero}</Badge>
                  <Text color="gray.600">Código: {proyecto.codigo}</Text>
                </HStack>
              </VStack>
              <HStack>
                <Badge
                  size="lg"
                  colorScheme={
                    proyecto.estado === "Activo"
                      ? "green"
                      : proyecto.estado === "Finalizado"
                      ? "blue"
                      : "red"
                  }
                  p={2}
                  borderRadius="md"
                >
                  {proyecto.estado}
                </Badge>
                <Button
                  leftIcon={<Icon as={Download} />}
                  colorScheme="blue"
                  onClick={generatePDF}
                >
                  Generar PDF
                </Button>
              </HStack>
            </HStack>

            <Divider />

            {/* Información General */}
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <VStack align="start" spacing={4}>
                  <HStack>
                    <Icon as={Users} className="text-blue-600" />
                    <Text fontWeight="bold">Encargado:</Text>
                    <Text>{proyecto.encargado?.nombre}</Text>
                  </HStack>

                  <HStack>
                    <Icon as={DollarSign} className="text-green-600" />
                    <Text fontWeight="bold">Presupuesto:</Text>
                    <VStack align="start" spacing={0}>
                      <Text>
                        Total: {formatPresupuesto(proyecto.presupuesto.total)}
                      </Text>
                      <Text>
                        Ejecutado:{" "}
                        {formatPresupuesto(proyecto.presupuesto.ejecutado)}
                      </Text>
                    </VStack>
                  </HStack>

                  <Box w="full">
                    <HStack mb={2}>
                      <Icon as={Clipboard} className="text-purple-600" />
                      <Text fontWeight="bold">Nivel de Avance:</Text>
                      <Text>{proyecto.nivelAvance}%</Text>
                    </HStack>
                    <Progress
                      value={proyecto.nivelAvance}
                      colorScheme={
                        proyecto.nivelAvance >= 75
                          ? "green"
                          : proyecto.nivelAvance >= 50
                          ? "blue"
                          : proyecto.nivelAvance >= 25
                          ? "yellow"
                          : "red"
                      }
                      hasStripe
                      className="w-full"
                    />
                  </Box>
                </VStack>
              </GridItem>

              <GridItem>
                <VStack align="start" spacing={4}>
                  <HStack>
                    <Icon as={Calendar} className="text-orange-600" />
                    <Text fontWeight="bold">Fechas:</Text>
                    <VStack align="start" spacing={0}>
                      <Text>Inicio: {formatFecha(proyecto.fechaInicio)}</Text>
                      <Text>Final: {formatFecha(proyecto.fechaFinal)}</Text>
                    </VStack>
                  </HStack>

                  <HStack>
                    <Icon as={MapPin} className="text-red-600" />
                    <Text fontWeight="bold">Implicación Municipal:</Text>
                    <Badge colorScheme="blue">
                      {proyecto.implicacionMunicipalidades}
                    </Badge>
                  </HStack>

                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Seguimiento:
                    </Text>
                    <VStack align="start" spacing={1}>
                      <Text>Frecuencia: {proyecto.seguimiento.frecuencia}</Text>
                      <Text>
                        Próxima Revisión:{" "}
                        {formatFecha(proyecto.seguimiento.proximoSeguimiento)}
                      </Text>
                      <Badge
                        colorScheme={
                          proyecto.seguimiento.requiereVisita ? "green" : "gray"
                        }
                      >
                        {proyecto.seguimiento.requiereVisita
                          ? "Requiere Visita"
                          : "Sin Visita"}
                      </Badge>
                    </VStack>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>

            <Divider />

            {/* Donantes */}
            <Box>
              <Heading size="md" mb={4}>
                Donantes
              </Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Donante</Th>
                    <Th isNumeric>Monto Aportado</Th>
                    <Th isNumeric>Porcentaje</Th>
                    <Th>Fecha Compromiso</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {proyecto.donantes.map((d, index) => (
                    <Tr key={index}>
                      <Td>{d.donante?.nombre}</Td>
                      <Td isNumeric>{formatPresupuesto(d.montoAportado)}</Td>
                      <Td isNumeric>{d.porcentaje}%</Td>
                      <Td>{formatFecha(d.fechaCompromiso)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <Divider />

            {/* Actividades */}
            <Box>
              <Heading size="md" mb={4}>
                Actividades
              </Heading>
              <VStack spacing={4} align="stretch">
                {proyecto.actividades.map((actividad, index) => (
                  <Card key={index} variant="outline">
                    <CardBody>
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <GridItem>
                          <VStack align="start" spacing={2}>
                            <Heading size="sm">{actividad.nombre}</Heading>
                            <Text fontSize="sm">{actividad.descripcion}</Text>
                            <HStack>
                              <Badge
                                colorScheme={
                                  actividad.estado === "Completada"
                                    ? "green"
                                    : actividad.estado === "En Progreso"
                                    ? "blue"
                                    : "yellow"
                                }
                              >
                                {/* {actividad.estado} */}
                              </Badge>
                              <Text>Avance: {actividad.avance}%</Text>
                            </HStack>
                            <Text>
                              Presupuesto:{" "}
                              {formatPresupuesto(actividad.presupuestoAsignado)}
                              ({actividad.porcentajePresupuesto}% del total)
                            </Text>
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="bold">
                              Beneficiarios Asociados:
                            </Text>
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>Nombre</Th>
                                  <Th>Estado</Th>
                                  <Th>Fecha Asignación</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {actividad.beneficiariosAsociados.map(
                                  (b, idx) => {
                                    // Aquí asumimos que el beneficiario está populado
                                    const beneficiario =
                                      typeof b.beneficiario === "object"
                                        ? b.beneficiario // Si ya está populado
                                        : proyecto.beneficiarios?.find(
                                            (
                                              ben // Si necesitamos buscarlo
                                            ) =>
                                              ben.beneficiario._id ===
                                              b.beneficiario
                                          )?.beneficiario;

                                    return (
                                      <Tr key={idx}>
                                        <Td>
                                          <VStack align="start" spacing={0}>
                                            <Text>{beneficiario?.nombre}</Text>
                                            <Text
                                              fontSize="xs"
                                              color="gray.600"
                                            >
                                              DPI: {beneficiario?.dpi}
                                            </Text>
                                          </VStack>
                                        </Td>
                                        <Td>
                                          <Badge
                                            colorScheme={
                                              b.estado === "Activo"
                                                ? "green"
                                                : "red"
                                            }
                                          >
                                            {b.estado}
                                          </Badge>
                                        </Td>
                                        <Td>
                                          {formatFecha(b.fechaAsignacion)}
                                        </Td>
                                      </Tr>
                                    );
                                  }
                                )}
                              </Tbody>
                            </Table>
                          </VStack>
                        </GridItem>
                      </Grid>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* Lugares Priorizados */}
            <Box>
              <Heading size="md" mb={4}>
                Lugares Priorizados
              </Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Departamento</Th>
                    <Th>Municipio</Th>
                    <Th>Localidad</Th>
                    <Th isNumeric>Prioridad</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {proyecto.lugaresAPriorizar.map((lugar, index) => (
                    <Tr key={index}>
                      <Td>{lugar.departamento}</Td>
                      <Td>{lugar.municipio}</Td>
                      <Td>{lugar.localidad}</Td>
                      <Td isNumeric>
                        <Badge
                          colorScheme={
                            lugar.prioridad === 1
                              ? "red"
                              : lugar.prioridad === 2
                              ? "orange"
                              : lugar.prioridad === 3
                              ? "yellow"
                              : lugar.prioridad === 4
                              ? "green"
                              : "blue"
                          }
                        >
                          {lugar.prioridad}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default VerProyecto;
