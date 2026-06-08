import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "sdk",
      "wacomreal.js"
    );

    const content = await fs.readFile(filePath, "utf8");

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Wacom SDK API] Error sirviendo SDK:", error);

    return new Response(
      "console.error('[Wacom SDK API] No se pudo cargar el SDK Wacom');",
      {
        status: 500,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}