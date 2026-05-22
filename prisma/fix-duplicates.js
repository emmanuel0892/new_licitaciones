const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function fixDuplicates() {
  console.log("🔍 Buscando procesos duplicados...")
  
  const procesos = await prisma.procesoLicitacion.findMany({
    orderBy: { id: "asc" }
  })
  
  const seen = new Set()
  const duplicates = []
  
  procesos.forEach(p => {
    const key = `${p.formatoLiquidacionId}-${p.numeroPaso}`
    if (seen.has(key)) {
      duplicates.push(p.id)
    } else {
      seen.add(key)
    }
  })
  
  console.log(`📊 Total procesos: ${procesos.length}`)
  console.log(`🔄 Duplicados encontrados: ${duplicates.length}`)
  
  if (duplicates.length > 0) {
    // Verificar si algún duplicado está siendo usado por una licitación
    const licitacionesAfectadas = await prisma.licitacion.findMany({
      where: { procesoActualId: { in: duplicates } }
    })
    
    if (licitacionesAfectadas.length > 0) {
      console.log(`⚠️ ${licitacionesAfectadas.length} licitaciones usan procesos duplicados`)
      
      // Actualizar licitaciones para usar el proceso original (no duplicado)
      for (const lic of licitacionesAfectadas) {
        const procesoActual = procesos.find(p => p.id === lic.procesoActualId)
        const procesoOriginal = procesos.find(p => 
          p.formatoLiquidacionId === procesoActual.formatoLiquidacionId && 
          p.numeroPaso === procesoActual.numeroPaso &&
          !duplicates.includes(p.id)
        )
        
        if (procesoOriginal) {
          await prisma.licitacion.update({
            where: { id: lic.id },
            data: { procesoActualId: procesoOriginal.id }
          })
          console.log(`✅ Licitación ${lic.id} actualizada al proceso ${procesoOriginal.id}`)
        }
      }
    }
    
    await prisma.procesoLicitacion.deleteMany({
      where: { id: { in: duplicates } }
    })
    console.log(`🗑️ ${duplicates.length} duplicados eliminados`)
  } else {
    console.log("✅ No hay duplicados")
  }
  
  await prisma.$disconnect()
}

fixDuplicates()
