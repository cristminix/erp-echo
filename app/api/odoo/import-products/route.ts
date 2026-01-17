import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/jwt"
import { prisma } from "@/lib/prisma"

// Función para hacer llamada XML-RPC a Odoo
async function odooRpcCall(
  url: string,
  db: string,
  uid: number,
  password: string,
  model: string,
  method: string,
  params: any[] = [],
) {
  const xmlBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${db}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${password}</string></value></param>
    <param><value><string>${model}</string></value></param>
    <param><value><string>${method}</string></value></param>
    <param><value><array><data>${params.map((p) => `<value>${JSON.stringify(p)}</value>`).join("")}</data></array></value></param>
  </params>
</methodCall>`

  const response = await fetch(`${url}/xmlrpc/2/object`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: xmlBody,
  })

  return response.text()
}

// Función para autenticar en Odoo usando JSON-RPC
async function odooAuthenticate(
  url: string,
  port: string,
  db: string,
  username: string,
  password: string,
): Promise<number | null> {
  try {
    const response = await fetch(`${url}:${port}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "common",
          method: "login",
          args: [db, username, password],
        },
      }),
    })

    const data = await response.json()
    console.log("🔐 Respuesta de autenticación:", data)

    if (data.result && typeof data.result === "number") {
      return data.result
    }
    return null
  } catch (error) {
    console.error("Error autenticando en Odoo:", error)
    return null
  }
}

// POST - Importar productos desde Odoo
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request)
    if (!payload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const limit = body.limit || 0

    // Obtener empresa activa con configuración de Odoo
    const company = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: "No hay empresa activa" },
        { status: 404 },
      )
    }

    // Validar configuración completa
    const missingFields = []
    if (!company.odooEnabled) missingFields.push("Odoo no está activado")
    if (!company.odooUrl) missingFields.push("URL")
    if (!company.odooDb) missingFields.push("Base de datos")
    if (!company.odooUsername) missingFields.push("Pengguna")
    if (!company.odooPassword) missingFields.push("Contraseña")

    if (missingFields.length > 0) {
      console.error("❌ Configuración incompleta:", missingFields)
      console.log("Configuración actual:", {
        odooEnabled: company.odooEnabled,
        odooUrl: company.odooUrl ? "✓" : "✗",
        odooDb: company.odooDb ? "✓" : "✗",
        odooUsername: company.odooUsername ? "✓" : "✗",
        odooPassword: company.odooPassword ? "✓" : "✗",
      })
      return NextResponse.json(
        {
          error: "Configuración de Odoo incompleta",
          missing: missingFields,
          details: `Faltan los siguientes campos: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Autenticar en Odoo
    console.log("\n🔐 Iniciando autenticación con Odoo...")
    console.log("URL:", company.odooUrl)
    console.log("Puerto:", company.odooPort || "8069")
    console.log("DB:", company.odooDb)
    console.log("User:", company.odooUsername)

    const uid = await odooAuthenticate(
      company.odooUrl,
      company.odooPort || "8069",
      company.odooDb,
      company.odooUsername,
      company.odooPassword,
    )

    if (!uid) {
      console.error("❌ Autenticación fallida")
      return NextResponse.json(
        { error: "Error al autenticar con Odoo. Verifica las credenciales." },
        { status: 401 },
      )
    }

    console.log("✅ Autenticación exitosa. UID:", uid)

    // Buscar productos usando JSON-RPC
    const odooUrl = `${company.odooUrl}:${company.odooPort || "8069"}`

    console.log("\n🔍 Buscando productos en Odoo...")
    console.log("Límite:", limit > 0 ? limit : "sin límite")

    // Construir args para search_read
    // Formato: [db, uid, password, model, method, domain, fields, limit/offset]
    const searchArgs = [
      company.odooDb,
      uid,
      company.odooPassword,
      "product.product",
      "search_read",
      [], // domain (sin filtros)
      ["name", "default_code", "list_price", "type"], // fields
      0, // offset
      limit > 0 ? limit : false, // limit (false = sin límite)
      false, // order
    ]

    const searchReadResponse = await fetch(`${odooUrl}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute",
          args: searchArgs,
        },
      }),
    })

    const searchReadData = await searchReadResponse.json()
    console.log("📦 Respuesta completa de Odoo:")
    console.log(JSON.stringify(searchReadData, null, 2))

    if (searchReadData.error) {
      console.error("❌ Error de Odoo:", searchReadData.error)
      return NextResponse.json({
        message: `Error de Odoo: ${searchReadData.error.message || searchReadData.error.data?.message || "Error desconocido"}`,
        count: 0,
        error: searchReadData.error,
      })
    }

    if (!searchReadData.result || searchReadData.result.length === 0) {
      console.warn("⚠️ No se encontraron productos en Odoo")
      console.log("Tipo de result:", typeof searchReadData.result)
      console.log("Result:", searchReadData.result)
      return NextResponse.json({
        message: "No se encontraron productos en Odoo",
        count: 0,
      })
    }

    console.log(`📊 Productos encontrados: ${searchReadData.result.length}`)

    // Mapear productos
    const products = searchReadData.result.map((item: any) => ({
      name: item.name || "Sin nombre",
      code:
        item.default_code ||
        `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      price: parseFloat(item.list_price) || 0,
      type: item.type === "service" ? "service" : "storable",
    }))

    console.log(`✅ Total productos parseados: ${products.length}`)
    if (products.length > 0) {
      console.log("📦 Primeros 3 productos:", products.slice(0, 3))
    }

    console.log(`Intentando crear ${products.length} productos...`)
    console.log("Company ID:", company.id)
    console.log("User ID:", payload.userId)

    // Crear productos en la base de datos
    let importedCount = 0
    const errors = []

    for (const product of products) {
      try {
        console.log("Creando producto:", product.name)
        const created = await prisma.product.create({
          data: {
            userId: payload.userId,
            companyId: company.id,
            code: product.code,
            name: product.name,
            price: product.price,
            type: product.type,
            stock: product.type === "service" ? 0 : 0,
            tax: 0,
            active: true,
          },
        })
        console.log("✅ Producto creado:", created.id, created.name)
        importedCount++
      } catch (error: any) {
        console.error("❌ Error creando producto:", product.name, error.message)
        errors.push({ product: product.name, error: error.message })
      }
    }

    console.log(
      `✅ Total productos importados: ${importedCount} de ${products.length}`,
    )
    if (errors.length > 0) {
      console.error("Errores encontrados:", errors)
    }

    const limitMsg = limit > 0 ? ` (límite: ${limit})` : " (todos)"
    return NextResponse.json({
      message: `${importedCount} productos importados${limitMsg}`,
      count: importedCount,
      errors: errors.length > 0 ? errors : undefined,
      debug: {
        productsParsed: products.length,
        productsCreated: importedCount,
        companyId: company.id,
        userId: payload.userId,
      },
    })
  } catch (error: any) {
    console.error("Error al importar productos de Odoo:", error)
    return NextResponse.json(
      { error: error.message || "Error al importar productos" },
      { status: 500 },
    )
  }
}
