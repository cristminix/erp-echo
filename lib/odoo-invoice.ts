// Librería para crear facturas en Odoo via JSON-RPC

interface OdooConfig {
  odooUrl: string;
  odooDb: string;
  odooUsername: string;
  odooPassword: string;
  odooPort: string;
}

interface InvoiceLine {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  tax: number;
}

interface Invoice {
  contactId: string;
  date: string;
  currency: string;
  items: InvoiceLine[];
}

// Función para hacer llamadas JSON-RPC a Odoo
async function odooCall(config: OdooConfig, endpoint: string, params: any): Promise<any> {
  const url = `${config.odooUrl}:${config.odooPort}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: Math.floor(Math.random() * 1000000),
    }),
  });

  if (!response.ok) {
    throw new Error(`Odoo API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Odoo error: ${JSON.stringify(data.error)}`);
  }

  return data.result;
}

// Autenticar en Odoo y obtener el UID
async function authenticate(config: OdooConfig): Promise<number> {
  const result = await odooCall(config, '/web/session/authenticate', {
    db: config.odooDb,
    login: config.odooUsername,
    password: config.odooPassword,
  });

  if (!result || !result.uid) {
    throw new Error('Authentication failed');
  }

  return result.uid;
}

// Buscar partner por NIF o crear uno nuevo
async function findOrCreatePartner(config: OdooConfig, uid: number, contact: any): Promise<number> {
  // Primero intentar buscar por NIF
  if (contact.nif) {
    const partners = await odooCall(config, '/web/dataset/call_kw', {
      model: 'res.partner',
      method: 'search_read',
      args: [[['vat', '=', contact.nif]]],
      kwargs: {
        fields: ['id', 'name'],
        limit: 1,
      },
    });

    if (partners && partners.length > 0) {
      return partners[0].id;
    }
  }

  // Si no existe, crear nuevo partner
  const partnerId = await odooCall(config, '/web/dataset/call_kw', {
    model: 'res.partner',
    method: 'create',
    args: [{
      name: contact.name,
      vat: contact.nif || false,
      email: contact.email || false,
      phone: contact.phone || false,
      street: contact.address || false,
      city: contact.city || false,
      zip: contact.postalCode || false,
      country_id: contact.country === 'ES' ? 68 : false, // 68 es España en Odoo por defecto
      customer_rank: 1,
    }],
    kwargs: {},
  });

  return partnerId;
}

// Buscar o crear producto en Odoo
async function findOrCreateProduct(config: OdooConfig, uid: number, productCode: string, productName: string): Promise<number> {
  // Buscar producto por código
  if (productCode) {
    const products = await odooCall(config, '/web/dataset/call_kw', {
      model: 'product.product',
      method: 'search_read',
      args: [[['default_code', '=', productCode]]],
      kwargs: {
        fields: ['id', 'name'],
        limit: 1,
      },
    });

    if (products && products.length > 0) {
      return products[0].id;
    }
  }

  // Si no existe, crear producto
  const productId = await odooCall(config, '/web/dataset/call_kw', {
    model: 'product.product',
    method: 'create',
    args: [{
      name: productName,
      default_code: productCode || false,
      type: 'service', // Crear como servicio por defecto
      list_price: 0,
      sale_ok: true,
      purchase_ok: false,
    }],
    kwargs: {},
  });

  return productId;
}

// Crear factura en Odoo (en borrador)
export async function createOdooInvoice(config: OdooConfig, invoice: Invoice, contact: any, products: any[]): Promise<number> {
  try {
    // 1. Autenticar
    const uid = await authenticate(config);

    // 2. Buscar o crear partner
    const partnerId = await findOrCreatePartner(config, uid, contact);

    // 3. Preparar líneas de factura
    const invoiceLines = [];
    for (const item of invoice.items) {
      // Buscar el producto correspondiente
      const product = products.find(p => p.id === item.productId);
      const productCode = product?.code || '';
      const productName = item.description;

      // Buscar o crear producto en Odoo
      const odooProductId = await findOrCreateProduct(config, uid, productCode, productName);

      // Calcular impuesto (buscar o crear tax)
      const taxIds = [];
      if (item.tax > 0) {
        // Buscar tax por porcentaje
        const taxes = await odooCall(config, '/web/dataset/call_kw', {
          model: 'account.tax',
          method: 'search_read',
          args: [[
            ['amount', '=', item.tax],
            ['type_tax_use', '=', 'sale'],
          ]],
          kwargs: {
            fields: ['id', 'name'],
            limit: 1,
          },
        });

        if (taxes && taxes.length > 0) {
          taxIds.push(taxes[0].id);
        }
      }

      invoiceLines.push({
        product_id: odooProductId,
        name: productName,
        quantity: item.quantity,
        price_unit: item.price,
        tax_ids: [[6, 0, taxIds]], // Formato especial de Odoo para relaciones many2many
      });
    }

    // 4. Crear factura en borrador
    const invoiceId = await odooCall(config, '/web/dataset/call_kw', {
      model: 'account.move',
      method: 'create',
      args: [{
        partner_id: partnerId,
        move_type: 'out_invoice', // Factura de cliente
        invoice_date: invoice.date.split('T')[0],
        currency_id: invoice.currency === 'EUR' ? 1 : false, // 1 es EUR por defecto
        state: 'draft', // Crear en borrador
        invoice_line_ids: invoiceLines.map(line => [0, 0, line]), // Formato especial de Odoo para crear líneas
      }],
      kwargs: {},
    });

    console.log('✅ Factura creada en Odoo:', invoiceId);
    return invoiceId;
  } catch (error) {
    console.error('❌ Error creando factura en Odoo:', error);
    throw error;
  }
}
