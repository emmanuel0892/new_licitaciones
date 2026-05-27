import "server-only"

import path from "node:path"

const NEW_DOCUMENT_ROUTE_PREFIX = "/storage/"
const LEGACY_DOCUMENT_ROUTE_PREFIX = "/uploads/licitaciones/"

export const sanitizeFolderName = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export const sanitizeFileName = (value) => {
  const safeName = String(value ?? "archivo")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")

  return safeName || "archivo"
}

export const getNumeroLicitacionActual = (licitacion) => {
  return String(
    licitacion?.codigoMercadoPublico ??
    licitacion?.numeroLicitacion ??
    licitacion?.id ??
    ""
  ).trim()
}

export const buildDocumentoStorageLocation = (folderName, fileName) => {
  const storageRoot = path.join(process.cwd(), "storage")
  const directoryPath = path.join(storageRoot, folderName)
  const absolutePath = path.join(directoryPath, fileName)

  return {
    absolutePath,
    directoryPath,
    rutaArchivo: `${NEW_DOCUMENT_ROUTE_PREFIX}${folderName}/${fileName}`
  }
}

const resolveInsideRoot = (rootPath, relativePath) => {
  const resolvedRoot = path.resolve(rootPath)
  const resolvedPath = path.resolve(resolvedRoot, relativePath)

  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null
  }

  return resolvedPath
}

export const resolveDocumentoAbsolutePath = (rutaArchivo) => {
  const routePath = String(rutaArchivo ?? "").replaceAll("\\", "/")

  if (routePath.startsWith(NEW_DOCUMENT_ROUTE_PREFIX)) {
    return resolveInsideRoot(
      path.join(process.cwd(), "storage"),
      routePath.slice(NEW_DOCUMENT_ROUTE_PREFIX.length)
    )
  }

  if (routePath.startsWith(LEGACY_DOCUMENT_ROUTE_PREFIX)) {
    return resolveInsideRoot(
      path.join(process.cwd(), "public", "uploads", "licitaciones"),
      routePath.slice(LEGACY_DOCUMENT_ROUTE_PREFIX.length)
    )
  }

  return null
}
