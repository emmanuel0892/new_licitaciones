import prisma from "@/lib/prisma"

export const REQUIRED_SIGNATURES_BY_STEP = {
  2: [
    {
      label: "Jefatura de Unidad",
      roles: ["jefe_compras", "jefe_adquisiciones", "jefe_unidad_legal", "jefe_presupuesto"]
    },
    {
      label: "Jefatura de Dpto",
      roles: ["jefe_adquisiciones", "jefe_compras"]
    }
  ],
  5: [
    {
      label: "Subdirector Administrativo",
      roles: ["subdirector_administrativo"]
    },
    {
      label: "Director",
      roles: ["director"]
    }
  ],
  11: [
    {
      label: "Jefatura de Unidad",
      roles: ["jefe_compras", "jefe_adquisiciones", "jefe_unidad_legal", "jefe_presupuesto"]
    },
    {
      label: "Jefatura de Dpto",
      roles: ["jefe_adquisiciones", "jefe_compras"]
    }
  ],
  18: [
    {
      label: "Jefatura de Unidad",
      roles: ["jefe_compras", "jefe_adquisiciones", "jefe_unidad_legal", "jefe_presupuesto"]
    },
    {
      label: "Jefatura de Dpto",
      roles: ["jefe_adquisiciones", "jefe_compras"]
    }
  ],
  22: [
    {
      label: "Subdirector Administrativo",
      roles: ["subdirector_administrativo"]
    },
    {
      label: "Director",
      roles: ["director"]
    }
  ],
  23: [
    {
      label: "Oficina de Partes",
      roles: ["oficina_partes"]
    }
  ]
}

const hasStoredSignature = (user) => {
  return Boolean(user?.firma && user.firma.trim() !== "")
}

export const getSignatureStatusForStep = async (numeroPaso) => {
  const requiredSignatures = REQUIRED_SIGNATURES_BY_STEP[Number(numeroPaso)] ?? []

  if (requiredSignatures.length === 0) {
    return []
  }

  const statuses = []

  for (const requirement of requiredSignatures) {
    const usersWithRole = await prisma.user.findMany({
      where: {
        active: "active",
        user_roles: {
          some: {
            OR: [
              {
                role_id: {
                  in: requirement.roles
                }
              },
              {
                roles: {
                  is: {
                    name: {
                      in: requirement.roles
                    }
                  }
                }
              }
            ]
          }
        }
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        firma: true,
        user_roles: {
          select: {
            role_id: true,
            roles: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    const completed = usersWithRole.some(hasStoredSignature)

    statuses.push({
      label: requirement.label,
      roles: requirement.roles,
      completed
    })
  }

  return statuses
}

export const getMissingSignaturesForStep = async (numeroPaso) => {
  const statuses = await getSignatureStatusForStep(numeroPaso)
  return statuses
    .filter((status) => !status.completed)
    .map((status) => status.label)
}

export const canAdvanceBySignature = async (numeroPaso) => {
  const statuses = await getSignatureStatusForStep(numeroPaso)
  const missing = statuses
    .filter((status) => !status.completed)
    .map((status) => status.label)

  return {
    canAdvance: missing.length === 0,
    missing,
    required: statuses
  }
}

export const assertCanAdvanceBySignature = async (numeroPaso) => {
  const missingSignatures = await getMissingSignaturesForStep(numeroPaso)

  if (missingSignatures.length === 0) {
    return
  }

  throw new Error(`No se puede avanzar. Faltan firmas obligatorias: ${missingSignatures.join(", ")}.`)
}
