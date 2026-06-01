"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function guardarFirmaUsuarioWacom(dataUrl) {
  const session = await auth();

  if (!session) {
    throw new Error("No autorizado");
  }

  if (!dataUrl || !String(dataUrl).startsWith("data:image/png;base64,")) {
    throw new Error("Firma inválida");
  }

  await prisma.user.update({
    where: {
      id: session.user.id
    },
    data: {
      firma: dataUrl
    }
  });

  return { ok: true };
}
