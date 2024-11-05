import jsPDF from "jspdf";
import "jspdf-autotable";

export const generarReporteBeneficiariosPDF = (
  beneficiarios,
  consulta = "Beneficiarios",
  nombreArchivo = "Reporte_Beneficiarios"
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "legal",
    margin: 0,
  });

  const logoUrl = `${window.location.origin}/img/logo.png`;
  const pageWidth = doc.internal.pageSize.width;

  // Generar la fecha actual en formato legible
  const fechaActual = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Insertar logo
  doc.addImage(logoUrl, "PNG", 30, 10, 100, 50);

  // Título y subtítulo
  const celesteColor = [0, 153, 203];
  doc.setFontSize(14);
  doc.setTextColor(...celesteColor);
  doc.setFont("helvetica", "bold");
  doc.text(`Reporte de ${consulta} - ${fechaActual}`, pageWidth / 2, 70, {
    align: "center",
  });

  // Encabezados de la tabla, con la columna "No."
  const tableColumns = [
    "No.",
    "Nombre",
    "DPI",
    "Teléfono",
    "Fecha de Nacimiento",
    "Edad",
    "Dirección Completa",
    "Estado Civil",
    "Padre",
    "Madre",
  ];

  // Dividir los beneficiarios en páginas de 10 registros cada una
  const pages = [];
  for (let i = 0; i < beneficiarios.length; i += 10) {
    pages.push(beneficiarios.slice(i, i + 10));
  }

  // Generar todas las páginas primero sin el pie de página
  pages.forEach((pageData, pageIndex) => {
    const tableRows = pageData.map((beneficiario, index) => {
      const fechaNacimiento = new Date(
        beneficiario.fechaNacimiento
      ).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const edad =
        new Date().getFullYear() -
        new Date(beneficiario.fechaNacimiento).getFullYear();
      const direccionCompleta = beneficiario.direccion
        ? `${beneficiario.direccion.direccion}, ${beneficiario.direccion.localidad}, ${beneficiario.direccion.municipio}, ${beneficiario.direccion.departamento}`
        : "";

      return [
        pageIndex * 10 + index + 1, // Número de registro
        beneficiario.nombre,
        beneficiario.dpi,
        beneficiario.telefono,
        fechaNacimiento,
        `${edad} años`,
        direccionCompleta,
        beneficiario.estadoCivil,
        beneficiario.nombrePadre,
        beneficiario.nombreMadre,
      ];
    });
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: pageIndex === 0 ? 100 : 20, // Ajusta la posición de inicio para la primera página
      theme: "grid",
      headStyles: { fillColor: celesteColor, fontSize: 12, halign: "center" }, // Centra los encabezados
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 100 },
        2: { cellWidth: 90 },
        3: { cellWidth: 60 },
        4: { cellWidth: 120 },
        5: { cellWidth: 50 },
        6: { cellWidth: 220 },
        7: { cellWidth: 60 },
        8: { cellWidth: 100 },
        9: { cellWidth: 100 },
      },
      margin: { top: 100 },
      showHead: "everyPage",
    });

    // Agregar una nueva página si no es la última
    if (pageIndex < pages.length - 1) {
      doc.addPage();
    }
  });

  // Obtener el número total de páginas
  const totalPages = doc.internal.getNumberOfPages();

  // Agregar el pie de página con la numeración completa en cada página
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerText = `Página ${i} / ${totalPages}`;
    doc.setFontSize(10);
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.height - 20, {
      align: "center",
    });

    // Información del pie de página
    const footerY = doc.internal.pageSize.height - 30;
    doc.setFontSize(8);
    doc.setTextColor(...celesteColor);
    doc.text("Paz y Bien, Quezaltepeque", 30, footerY);
    doc.text("Citas | 7943 4761", pageWidth - 150, footerY);
  }

  // Crear un Blob y una URL para el PDF
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Abrir el PDF en una nueva pestaña
  const nuevaVentana = window.open(pdfUrl, "_blank");
  if (nuevaVentana) {
    // Cambia el título de la ventana, pero no el nombre de la URL
    nuevaVentana.onload = () => {
      nuevaVentana.document.title = `ReporteBeneficiarios-${fechaActual.replace(
        /\//g,
        "-"
      )}.pdf`;
      URL.revokeObjectURL(pdfUrl); // Liberar la URL cuando se haya cargado
    };
  }
  
  // Usar el nombre de archivo incluyendo la fecha
  //const formattedDate = fechaActual.replace(/\//g, "-");
  //doc.save(`${nombreArchivo}_${formattedDate}.pdf`);
};


