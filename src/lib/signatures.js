import prisma from "@/lib/prisma"
import { PERMISSION_CODES } from "@/lib/permissions"

export const REQUIRED_SIGNATURES_BY_STEP = {
  2: [
    {
      key: "jefatura_unidad",
      label: "Jefatura de Unidad",
      permissionCode: PERMISSION_CODES.SIGN_UNIT_HEAD,
      order: 1
    },
    {
      key: "jefatura_dpto",
      label: "Jefatura de Dpto",
      permissionCode: PERMISSION_CODES.SIGN_DEPARTMENT_HEAD,
      order: 2,
      dependsOn: "jefatura_unidad"
    }
  ],
  4: [
    {
      key: "jefatura_unidad_legal",
      label: "Jefatura Unidad Administrativo Legal",
      permissionCode: PERMISSION_CODES.SIGN_LEGAL_UNIT_HEAD,
      order: 1
    }
  ],
  5: [
    {
      key: "subdirector_administrativo",
      label: "Subdirector Administrativo",
      permissionCode: PERMISSION_CODES.SIGN_ADMINISTRATIVE_SUBDIRECTOR,
      order: 1
    },
    {
      key: "director",
      label: "Director",
      permissionCode: PERMISSION_CODES.SIGN_DIRECTOR,
      order: 2,
      dependsOn: "subdirector_administrativo"
    }
  ],
  11: [
    {
      key: "jefatura_unidad",
      label: "Jefatura de Unidad",
      permissionCode: PERMISSION_CODES.SIGN_UNIT_HEAD,
      order: 1
    },
    {
      key: "jefatura_dpto",
      label: "Jefatura de Dpto",
      permissionCode: PERMISSION_CODES.SIGN_DEPARTMENT_HEAD,
      order: 2,
      dependsOn: "jefatura_unidad"
    }
  ],
  13: [
    {
      key: "jefatura_unidad_legal",
      label: "Jefatura Unidad Administrativo Legal",
      permissionCode: PERMISSION_CODES.SIGN_LEGAL_UNIT_HEAD,
      order: 1
    }
  ],
  14: [
    {
      key: "subdirector_administrativo",
      label: "Subdirector Administrativo",
      permissionCode: PERMISSION_CODES.SIGN_ADMINISTRATIVE_SUBDIRECTOR,
      order: 1
    }
  ],
  18: [
    {
      key: "jefatura_unidad",
      label: "Jefatura de Unidad",
      permissionCode: PERMISSION_CODES.SIGN_UNIT_HEAD,
      order: 1
    },
    {
      key: "jefatura_dpto",
      label: "Jefatura de Dpto",
      permissionCode: PERMISSION_CODES.SIGN_DEPARTMENT_HEAD,
      order: 2,
      dependsOn: "jefatura_unidad"
    }
  ],
  20: [
    {
      key: "jefatura_unidad_legal",
      label: "Jefatura Unidad Administrativo Legal",
      permissionCode: PERMISSION_CODES.SIGN_LEGAL_UNIT_HEAD,
      order: 1
    }
  ],
  22: [
    {
      key: "subdirector_administrativo",
      label: "Subdirector Administrativo",
      permissionCode: PERMISSION_CODES.SIGN_ADMINISTRATIVE_SUBDIRECTOR,
      order: 1
    },
    {
      key: "director",
      label: "Director",
      permissionCode: PERMISSION_CODES.SIGN_DIRECTOR,
      order: 2,
      dependsOn: "subdirector_administrativo"
    }
  ],
  23: [
    {
      key: "oficina_partes",
      label: "Oficina de Partes",
      permissionCode: PERMISSION_CODES.SIGN_RECORDS_OFFICE,
      order: 1
    }
  ],
  29: [
    {
      key: "jefatura_unidad",
      label: "Jefatura de Unidad",
      permissionCode: PERMISSION_CODES.SIGN_UNIT_HEAD,
      order: 1
    },
    {
      key: "jefatura_dpto",
      label: "Jefatura de Dpto",
      permissionCode: PERMISSION_CODES.SIGN_DEPARTMENT_HEAD,
      order: 2,
      dependsOn: "jefatura_unidad"
    }
  ],
  31: [
    {
      key: "jefatura_unidad_legal",
      label: "Jefatura Unidad Administrativo Legal",
      permissionCode: PERMISSION_CODES.SIGN_LEGAL_UNIT_HEAD,
      order: 1
    }
  ],
  33: [
    {
      key: "subdirector_administrativo",
      label: "Subdirector Administrativo",
      permissionCode: PERMISSION_CODES.SIGN_ADMINISTRATIVE_SUBDIRECTOR,
      order: 1
    },
    {
      key: "director",
      label: "Director",
      permissionCode: PERMISSION_CODES.SIGN_DIRECTOR,
      order: 2,
      dependsOn: "subdirector_administrativo"
    }
  ],
  34: [
    {
      key: "oficina_partes",
      label: "Oficina de Partes",
      permissionCode: PERMISSION_CODES.SIGN_RECORDS_OFFICE,
      order: 1
    }
  ],
  40: [
    {
      key: "jefatura_unidad",
      label: "Jefatura de Unidad",
      permissionCode: PERMISSION_CODES.SIGN_UNIT_HEAD,
      order: 1
    },
    {
      key: "jefatura_dpto",
      label: "Jefatura de Dpto",
      permissionCode: PERMISSION_CODES.SIGN_DEPARTMENT_HEAD,
      order: 2,
      dependsOn: "jefatura_unidad"
    }
  ],
  42: [
    {
      key: "jefatura_unidad_legal",
      label: "Jefatura Unidad Administrativo Legal",
      permissionCode: PERMISSION_CODES.SIGN_LEGAL_UNIT_HEAD,
      order: 1
    }
  ],
  44: [
    {
      key: "subdirector_administrativo",
      label: "Subdirector Administrador",
      permissionCode: PERMISSION_CODES.SIGN_ADMINISTRATIVE_SUBDIRECTOR,
      order: 1
    },
    {
      key: "director",
      label: "Director",
      permissionCode: PERMISSION_CODES.SIGN_DIRECTOR,
      order: 2,
      dependsOn: "subdirector_administrativo"
    }
  ],
  45: [
    {
      key: "oficina_partes",
      label: "Oficina de Partes",
      permissionCode: PERMISSION_CODES.SIGN_RECORDS_OFFICE,
      order: 1
    }
  ]
}

const getRequiredSignatures = (numeroPaso) => {
  return [...(REQUIRED_SIGNATURES_BY_STEP[Number(numeroPaso)] ?? [])]
    .sort((a, b) => a.order - b.order)
}

export const isSignatureBlocked = (requirement, signatureStatus) => {
  if (!requirement.dependsOn) return false

  const dependency = signatureStatus.find((item) => item.key === requirement.dependsOn)
  return dependency?.status !== "firmada"
}

export const getSignatureStatusForStep = async (licitacionId, numeroPaso) => {
  const required = getRequiredSignatures(numeroPaso)

  if (required.length === 0) {
    return []
  }

  const applied = await prisma.licitacion_firmas.findMany({
    where: {
      licitacion_id: Number(licitacionId),
      numero_paso: Number(numeroPaso)
    },
    orderBy: { created_at: "asc" }
  })

  const usersById = applied.length > 0
    ? await prisma.user.findMany({
      where: {
        id: {
          in: [...new Set(applied.map((signature) => signature.user_id))]
        }
      },
      select: {
        id: true,
        name: true,
        lastname: true
      }
    })
    : []

  const userMap = new Map(usersById.map((user) => [user.id, user]))
  const status = required.map((req) => {
    const signed = applied.find((signature) => signature.firma_key === req.key)
    const signedUser = signed ? userMap.get(signed.user_id) : null
    const signedBy = signedUser
      ? `${signedUser.name ?? ""} ${signedUser.lastname ?? ""}`.trim()
      : signed?.user_id ?? null

    return {
      ...req,
      status: signed ? "firmada" : "pendiente",
      completed: Boolean(signed),
      signedBy,
      signedByUserId: signed?.user_id ?? null,
      signedAt: signed?.created_at ?? null
    }
  })

  return status.map((item) => ({
    ...item,
    status: item.status === "firmada" ? "firmada" : isSignatureBlocked(item, status) ? "bloqueada" : "pendiente"
  }))
}

export const areRequiredSignaturesCompleted = async (licitacionId, numeroPaso) => {
  const required = getRequiredSignatures(numeroPaso)

  if (required.length === 0) {
    return {
      completed: true,
      missing: []
    }
  }

  const applied = await prisma.licitacion_firmas.findMany({
    where: {
      licitacion_id: Number(licitacionId),
      numero_paso: Number(numeroPaso)
    }
  })

  const missing = required.filter((req) =>
    !applied.some((signature) => signature.firma_key === req.key)
  )

  return {
    completed: missing.length === 0,
    missing: missing.map((item) => item.label)
  }
}

export const canAdvanceBySignature = async (licitacionId, numeroPaso) => {
  const statuses = await getSignatureStatusForStep(licitacionId, numeroPaso)
  const validation = await areRequiredSignaturesCompleted(licitacionId, numeroPaso)

  return {
    canAdvance: validation.completed,
    missing: validation.missing,
    required: statuses
  }
}

export const assertCanAdvanceBySignature = async (licitacionId, numeroPaso) => {
  const validation = await areRequiredSignaturesCompleted(licitacionId, numeroPaso)

  if (validation.completed) {
    return
  }

  throw new Error(`No se puede avanzar. Faltan firmas requeridas: ${validation.missing.join(", ")}.`)
}
