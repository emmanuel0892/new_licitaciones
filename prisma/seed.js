const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

const formatosLiquidacion = [
  { id: 1, titulo: "Adquisición", cantidadPasos: 11 },
  { id: 2, titulo: "Contraloría", cantidadPasos: 13 },
  { id: 3, titulo: "Contrato", cantidadPasos: 8 },
  { id: 4, titulo: "Suministro", cantidadPasos: 11 },
  { id: 5, titulo: "Otros Trámites", cantidadPasos: 4 }
]

const procesosAdquisicion = [
  { numeroPaso: 1, tituloProceso: "Confección de Bases", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 2, tituloProceso: "Requerimiento referente técnico", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 3, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 4, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 5, tituloProceso: "Publicación", turno: "Licitador", diasSugeridos: 2 },
  { numeroPaso: 6, tituloProceso: "Evaluación Técnica", turno: "Licitador", diasSugeridos: 10 },
  { numeroPaso: 7, tituloProceso: "Preadjudicación y Comisión", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 8, tituloProceso: "Presupuesto", turno: "Presupuesto", diasSugeridos: 5 },
  { numeroPaso: 9, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 10, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 11, tituloProceso: "Publicada", turno: "Licitador", diasSugeridos: 2 }
]

const procesosContraloria = [
  { numeroPaso: 1, tituloProceso: "Confección de Bases", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 2, tituloProceso: "Requerimiento referente técnico", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 3, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 4, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 5, tituloProceso: "Contraloría", turno: "Licitador", diasSugeridos: 15 },
  { numeroPaso: 6, tituloProceso: "Publicación", turno: "Licitador", diasSugeridos: 2 },
  { numeroPaso: 7, tituloProceso: "Comisión Apertura", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 8, tituloProceso: "Evaluación Técnica", turno: "Licitador", diasSugeridos: 10 },
  { numeroPaso: 9, tituloProceso: "Preadjudicación y Comisión", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 10, tituloProceso: "Presupuesto", turno: "Presupuesto", diasSugeridos: 5 },
  { numeroPaso: 11, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 12, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 13, tituloProceso: "Publicada", turno: "Licitador", diasSugeridos: 2 }
]

const procesosContrato = [
  { numeroPaso: 1, tituloProceso: "Confección de contrato", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 2, tituloProceso: "Revisión jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 3, tituloProceso: "Envío a proveedor", turno: "Licitador", diasSugeridos: 3 },
  { numeroPaso: 4, tituloProceso: "Recepción de proveedor", turno: "Licitador", diasSugeridos: 10 },
  { numeroPaso: 5, tituloProceso: "Resolución de contrato", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 6, tituloProceso: "Revisión Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 7, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 8, tituloProceso: "Publicada", turno: "Licitador", diasSugeridos: 2 }
]

const procesosSuministro = [
  { numeroPaso: 1, tituloProceso: "Confección de Bases", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 2, tituloProceso: "Requerimiento referente técnico", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 3, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 4, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 5, tituloProceso: "Publicación", turno: "Licitador", diasSugeridos: 2 },
  { numeroPaso: 6, tituloProceso: "Evaluación Técnica", turno: "Licitador", diasSugeridos: 10 },
  { numeroPaso: 7, tituloProceso: "Preadjudicación y Comisión", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 8, tituloProceso: "Presupuesto", turno: "Presupuesto", diasSugeridos: 5 },
  { numeroPaso: 9, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 10, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 11, tituloProceso: "Publicada", turno: "Licitador", diasSugeridos: 2 }
]

const procesosOtrosTramites = [
  { numeroPaso: 1, tituloProceso: "Confección Documento", turno: "Licitador", diasSugeridos: 5 },
  { numeroPaso: 2, tituloProceso: "Jurídico", turno: "Secretario Juridico", diasSugeridos: 5 },
  { numeroPaso: 3, tituloProceso: "Firmas Directivos y Partes", turno: "Subdireccion Administrativa", diasSugeridos: 3 },
  { numeroPaso: 4, tituloProceso: "Publicada", turno: "Licitador", diasSugeridos: 2 }
]

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...")

  for (const formato of formatosLiquidacion) {
    await prisma.formatoLiquidacion.upsert({
      where: { id: formato.id },
      update: {},
      create: formato
    })
  }
  console.log("✅ Formatos de liquidación creados")

  // Limpiar procesos existentes antes de crear nuevos
  await prisma.procesoLicitacion.deleteMany({})
  console.log("🧹 Procesos anteriores eliminados")

  const procesosMap = {
    1: procesosAdquisicion,
    2: procesosContraloria,
    3: procesosContrato,
    4: procesosSuministro,
    5: procesosOtrosTramites
  }

  for (const [formatoId, procesos] of Object.entries(procesosMap)) {
    for (const proceso of procesos) {
      await prisma.procesoLicitacion.create({
        data: {
          formatoLiquidacionId: parseInt(formatoId),
          ...proceso
        }
      })
    }
  }
  console.log("✅ Procesos de licitación creados")

  const hashedPassword = await bcrypt.hash("123456", 10)
  
  await prisma.user.upsert({
    where: { email: "emmanuel.rubio@hospitalrancagua.cl" },
    update: {},
    create: {
      name: "Emmanuel",
      lastname: "Rubio Gaete",
      rut: "18041764-8",
      email: "emmanuel.rubio@hospitalrancagua.cl",
      password: hashedPassword,
      typeAccount: "Super Admin",
      departamento: "Abastecimiento",
      active: "active"
    }
  })
  console.log("✅ Usuario Super Admin creado")
  console.log("   Email: emmanuel.rubio@hospitalrancagua.cl")
  console.log("   Contraseña: 123456")

  const requirentes = [
    "Unidad de Abastecimiento",
    "Subdirección Administrativa",
    "Subdirección Médica",
    "Recursos Humanos",
    "Farmacia",
    "Laboratorio",
    "Imagenología",
    "Urgencias",
    "Pabellón",
    "UCI"
  ]

  for (const nombre of requirentes) {
    await prisma.requirente.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    })
  }
  console.log("✅ Requirentes iniciales creados")

  console.log("\n🎉 Seed completado exitosamente!")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
