import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// Función para autenticar en Odoo usando JSON-RPC
async function odooAuthenticate(url: string, port: string, db: string, username: string, password: string): Promise<number | null> {
  try {
    const response = await fetch(`${url}:${port}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'login',
          args: [db, username, password]
        }
      }),
    });

    const data = await response.json();
    console.log('🔐 Respuesta de autenticación:', data);
    
    if (data.result && typeof data.result === 'number') {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error('Error autenticando en Odoo:', error);
    return null;
  }
}

// POST - Importar contactos desde Odoo
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const limit = body.limit || 0;

    // Obtener empresa activa con configuración de Odoo
    const company = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 404 });
    }

    // Validar configuración completa
    const missingFields = [];
    if (!company.odooEnabled) missingFields.push('Odoo no está activado');
    if (!company.odooUrl) missingFields.push('URL');
    if (!company.odooDb) missingFields.push('Base de datos');
    if (!company.odooUsername) missingFields.push('Usuario');
    if (!company.odooPassword) missingFields.push('Contraseña');
    
    if (missingFields.length > 0) {
      console.error('❌ Configuración incompleta:', missingFields);
      console.log('Configuración actual:', {
        odooEnabled: company.odooEnabled,
        odooUrl: company.odooUrl ? '✓' : '✗',
        odooDb: company.odooDb ? '✓' : '✗',
        odooUsername: company.odooUsername ? '✓' : '✗',
        odooPassword: company.odooPassword ? '✓' : '✗',
      });
      return NextResponse.json(
        { 
          error: 'Configuración de Odoo incompleta', 
          missing: missingFields,
          details: `Faltan los siguientes campos: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Autenticar en Odoo
    console.log('\n🔐 Iniciando autenticación con Odoo...');
    const uid = await odooAuthenticate(
      company.odooUrl,
      company.odooPort || '8069',
      company.odooDb,
      company.odooUsername,
      company.odooPassword
    );

    if (!uid) {
      console.error('❌ Autenticación fallida');
      return NextResponse.json(
        { error: 'Error al autenticar con Odoo. Verifica las credenciales.' },
        { status: 401 }
      );
    }

    console.log('✅ Autenticación exitosa. UID:', uid);

    // Buscar contactos usando JSON-RPC
    const odooUrl = `${company.odooUrl}:${company.odooPort || '8069'}`;
    
    console.log('\n🔍 Buscando contactos en Odoo...');
    console.log('Límite:', limit > 0 ? limit : 'sin límite');
    
    // Construir args para search_read
    // Formato: [db, uid, password, model, method, domain, fields, offset, limit, order]
    const searchArgs = [
      company.odooDb,
      uid,
      company.odooPassword,
      'res.partner',
      'search_read',
      [['|', ['customer_rank', '>', 0], ['supplier_rank', '>', 0]]], // domain
      ['name', 'vat', 'email', 'phone', 'street', 'city', 'zip', 'country_id', 'customer_rank', 'supplier_rank'], // fields
      0, // offset
      limit > 0 ? limit : false, // limit (false = sin límite)
      false // order
    ];
    
    // Usar search_read con JSON-RPC
    const searchReadResponse = await fetch(`${odooUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute',
          args: searchArgs
        }
      }),
    });

    const searchReadData = await searchReadResponse.json();
    console.log('👥 Respuesta completa de Odoo:');
    console.log(JSON.stringify(searchReadData, null, 2));

    if (searchReadData.error) {
      console.error('❌ Error de Odoo:', searchReadData.error);
      return NextResponse.json({
        message: `Error de Odoo: ${searchReadData.error.message || searchReadData.error.data?.message || 'Error desconocido'}`,
        count: 0,
        error: searchReadData.error,
      });
    }

    if (!searchReadData.result || searchReadData.result.length === 0) {
      console.warn('⚠️ No se encontraron contactos en Odoo');
      console.log('Tipo de result:', typeof searchReadData.result);
      console.log('Result:', searchReadData.result);
      return NextResponse.json({
        message: 'No se encontraron contactos en Odoo',
        count: 0,
      });
    }

    console.log(`📊 Contactos encontrados: ${searchReadData.result.length}`);

    // Mapear contactos
    const contacts = searchReadData.result.map((item: any) => ({
      name: item.name || 'Sin nombre',
      nif: item.vat || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.street || '',
      city: item.city || '',
      postalCode: item.zip || '',
      isCustomer: (item.customer_rank && item.customer_rank > 0) || false,
      isSupplier: (item.supplier_rank && item.supplier_rank > 0) || false,
    }));

    console.log(`✅ Total contactos parseados: ${contacts.length}`);
    if (contacts.length > 0) {
      console.log('👤 Primeros 3 contactos:', contacts.slice(0, 3));
    }

    /* OLD XML-RPC CODE - Now using JSON-RPC
    const OLD_searchXml = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${company.odooDb}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${company.odooPassword}</string></value></param>
    <param><value><string>res.partner</string></value></param>
    <param><value><string>search</string></value></param>
    <param><value><array><data>
      <value><array><data>
        <value><array><data>
          <value><string>|</string></value>
        </data></array></value>
        <value><array><data>
          <value><string>customer_rank</string></value>
          <value><string>&gt;</string></value>
          <value><int>0</int></value>
        </data></array></value>
        <value><array><data>
          <value><string>supplier_rank</string></value>
          <value><string>&gt;</string></value>
          <value><int>0</int></value>
        </data></array></value>
      </data></array></value>
    </data></array></value>
    ${limit > 0 ? `<param><value><struct>
      <member><name>limit</name><value><int>${limit}</int></value></member>
    </struct></value></param>` : ''}
  </params>
</methodCall>`;

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: searchXml,
    });

    const searchText = await searchResponse.text();
    console.log('IDs de contactos encontrados:', searchText);

    // Extraer IDs del XML
    const idMatches = searchText.match(/<int>(\d+)<\/int>/g);
    if (!idMatches || idMatches.length === 0) {
      return NextResponse.json({
        message: 'No se encontraron contactos en Odoo',
        count: 0,
      });
    }

    const contactIds = idMatches.map(m => m.match(/<int>(\d+)<\/int>/)?.[1]).filter(Boolean);

    // Leer datos de contactos
    const readXml = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param>
      <value><string>${company.odooDb}</string></value>
    </param>
    <param>
      <value><int>${uid}</int></value>
    </param>
    <param>
      <value><string>${company.odooPassword}</string></value>
    </param>
    <param>
      <value><string>res.partner</string></value>
    </param>
    <param>
      <value><string>read</string></value>
    </param>
    <param>
      <value>
        <array>
          <data>
            <value>
              <array>
                <data>
                  ${contactIds.map(id => `<value><int>${id}</int></value>`).join('\n                  ')}
                </data>
              </array>
            </value>
          </data>
        </array>
      </value>
    </param>
    <param>
      <value>
        <struct>
          <member>
            <name>fields</name>
            <value>
              <array>
                <data>
                  <value><string>name</string></value>
                  <value><string>vat</string></value>
                  <value><string>email</string></value>
                  <value><string>phone</string></value>
                  <value><string>street</string></value>
                  <value><string>city</string></value>
                  <value><string>zip</string></value>
                  <value><string>country_id</string></value>
                  <value><string>customer_rank</string></value>
                  <value><string>supplier_rank</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

    const readResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: readXml,
    });

    const readText = await readResponse.text();
    console.log('👥 Datos de contactos recibidos de Odoo');
    console.log('Longitud respuesta:', readText.length);
    console.log('Primeros 500 caracteres:', readText.substring(0, 500));

    // Parsear contactos de forma simple
    const contacts = [];
    const structs = readText.match(/<struct>[\s\S]*?<\/struct>/g) || [];
    
    console.log(`📊 Encontrados ${structs.length} estructuras en el XML`);
    
    for (const struct of structs) {
      const nameMatch = struct.match(/<member><name>name<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const vatMatch = struct.match(/<member><name>vat<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const emailMatch = struct.match(/<member><name>email<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const phoneMatch = struct.match(/<member><name>phone<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const streetMatch = struct.match(/<member><name>street<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const cityMatch = struct.match(/<member><name>city<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const zipMatch = struct.match(/<member><name>zip<\/name><value><string>(.*?)<\/string><\/value><\/member>/);
      const customerMatch = struct.match(/<member><name>customer_rank<\/name><value><int>(\d+)<\/int><\/value><\/member>/);
      const supplierMatch = struct.match(/<member><name>supplier_rank<\/name><value><int>(\d+)<\/int><\/value><\/member>/);

      if (nameMatch) {
        const contact = {
          name: nameMatch[1],
          nif: vatMatch?.[1] || '',
          email: emailMatch?.[1] || '',
          phone: phoneMatch?.[1] || '',
          address: streetMatch?.[1] || '',
          city: cityMatch?.[1] || '',
          postalCode: zipMatch?.[1] || '',
          isCustomer: customerMatch ? parseInt(customerMatch[1]) > 0 : false,
          isSupplier: supplierMatch ? parseInt(supplierMatch[1]) > 0 : false,
        };
        console.log('👤 Contacto parseado:', contact);
        contacts.push(contact);
      } else {
        console.log('⚠️ Estructura sin nombre encontrada, primeros 200 chars:', struct.substring(0, 200));
      }
    }
    
    */ // END OLD XML-RPC CODE

    console.log(`Intentando crear ${contacts.length} contactos...`);
    console.log('Company ID:', company.id);
    console.log('User ID:', payload.userId);

    // Crear contactos en la base de datos
    let importedCount = 0;
    const errors = [];
    
    for (const contact of contacts) {
      try {
        console.log('Creando contacto:', contact.name);
        const created = await prisma.contact.create({
          data: {
            userId: payload.userId,
            companyId: company.id,
            name: contact.name,
            nif: contact.nif || null,
            email: contact.email || null,
            phone: contact.phone || null,
            address: contact.address || null,
            city: contact.city || null,
            postalCode: contact.postalCode || null,
            country: 'España',
            isCustomer: contact.isCustomer,
            isSupplier: contact.isSupplier,
            active: true,
          },
        });
        console.log('✅ Contacto creado:', created.id, created.name);
        importedCount++;
      } catch (error: any) {
        console.error('❌ Error creando contacto:', contact.name, error.message);
        errors.push({ contact: contact.name, error: error.message });
      }
    }

    console.log(`✅ Total contactos importados: ${importedCount} de ${contacts.length}`);
    if (errors.length > 0) {
      console.error('Errores encontrados:', errors);
    }

    const limitMsg = limit > 0 ? ` (límite: ${limit})` : ' (todos)';
    return NextResponse.json({
      message: `${importedCount} contactos importados${limitMsg}`,
      count: importedCount,
      errors: errors.length > 0 ? errors : undefined,
      debug: {
        contactsParsed: contacts.length,
        contactsCreated: importedCount,
        companyId: company.id,
        userId: payload.userId,
      }
    });

  } catch (error: any) {
    console.error('Error al importar contactos de Odoo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al importar contactos' },
      { status: 500 }
    );
  }
}
