export function generateInvoicePDFHTML(invoice: any, company: any, contact: any): string {
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      default: return currency;
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.number}</title>
  <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid ${company.primaryColor || '#0f766e'};
        }
        .company-info {
          flex: 1;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: ${company.primaryColor || '#0f766e'};
          margin-bottom: 10px;
        }
        .company-details {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: ${company.primaryColor || '#0f766e'};
          margin-bottom: 10px;
        }
        .invoice-number {
          font-size: 18px;
          color: #333;
          margin-bottom: 5px;
        }
        .invoice-meta {
          font-size: 12px;
          color: #666;
        }
        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .party {
          flex: 1;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }
        .party + .party {
          margin-left: 20px;
        }
        .party-title {
          font-size: 11px;
          color: #666;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .party-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .party-details {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        thead {
          background: ${company.primaryColor || '#0f766e'};
          color: white;
        }
        th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        th.center {
          text-align: center;
        }
        th.right {
          text-align: right;
        }
        tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }
        tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        td {
          padding: 10px 12px;
          font-size: 12px;
        }
        td.center {
          text-align: center;
        }
        td.right {
          text-align: right;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-table {
          width: 350px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-label {
          font-size: 13px;
        }
        .total-value {
          font-size: 13px;
          font-weight: 600;
        }
        .final-total {
          display: flex;
          justify-content: space-between;
          padding: 12px 15px;
          background: ${company.primaryColor || '#0f766e'};
          color: white;
          border-radius: 8px;
          margin-top: 5px;
        }
        .final-total-label {
          font-size: 16px;
          font-weight: bold;
        }
        .final-total-value {
          font-size: 18px;
          font-weight: bold;
        }
        .notes {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid ${company.primaryColor || '#0f766e'};
          margin-bottom: 30px;
        }
        .notes-title {
          font-size: 11px;
          color: #666;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .notes-content {
          font-size: 12px;
          white-space: pre-wrap;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #999;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 3px solid #0f766e; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-width: 120px; height: auto; margin-bottom: 10px;">` : ''}
          <div style="font-size: 24px; font-weight: bold; color: #0f766e; margin-bottom: 5px;">${company.name || 'N/A'}</div>
          ${company.nif ? `<div style="font-size: 12px; color: #666;">NIF: ${company.nif}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 32px; font-weight: bold; color: #0f766e; margin-bottom: 10px;">FACTURA</div>
          <div style="font-size: 18px; color: #333;">#${invoice.number}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="flex: 1;">
          <div style="font-size: 11px; color: #666; margin-bottom: 5px;">DATOS DE LA EMPRESA</div>
          ${company.address ? `<div style="font-size: 12px;">${company.address}</div>` : ''}
          <div style="font-size: 12px;">${company.city || ''} ${company.postalCode || ''}</div>
          ${company.country ? `<div style="font-size: 12px;">${company.country}</div>` : ''}
          ${company.phone ? `<div style="font-size: 12px; margin-top: 5px;">Tel: ${company.phone}</div>` : ''}
          ${company.email ? `<div style="font-size: 12px;">Email: ${company.email}</div>` : ''}
        </div>
        <div style="flex: 1; text-align: right;">
          <div style="font-size: 11px; color: #666; margin-bottom: 5px;">INFORMACIÓN DE FACTURA</div>
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Fecha Emisión:</strong> ${new Date(invoice.date).toLocaleDateString('es-ES')}</div>
          ${invoice.dueDate ? `<div style="font-size: 12px; margin-bottom: 3px;"><strong>Fecha Vencimiento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}</div>` : ''}
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Estado:</strong> ${invoice.status === 'VALIDATED' ? 'Validada' : 'Borrador'}</div>
          <div style="font-size: 12px;"><strong>Pago:</strong> ${invoice.paymentStatus === 'PAID' ? 'Pagada' : 'Pendiente'}</div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
        <div style="font-size: 11px; color: #666; margin-bottom: 8px; font-weight: bold;">CLIENTE</div>
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${contact.name || 'N/A'}</div>
        ${contact.nif ? `<div style="font-size: 12px; color: #666; margin-bottom: 3px;">NIF: ${contact.nif}</div>` : ''}
        ${contact.address ? `<div style="font-size: 12px;">${contact.address}</div>` : ''}
        <div style="font-size: 12px;">${contact.city || ''} ${contact.postalCode || ''}</div>
        ${contact.country ? `<div style="font-size: 12px;">${contact.country}</div>` : ''}
        ${contact.phone ? `<div style="font-size: 12px; margin-top: 5px;">Tel: ${contact.phone}</div>` : ''}
        ${contact.email ? `<div style="font-size: 12px;">Email: ${contact.email}</div>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #0f766e; color: white;">
            <th style="padding: 12px; text-align: left; font-size: 12px; border: 1px solid #0f766e;">DESCRIPCIÓN</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; width: 80px; border: 1px solid #0f766e;">CANT.</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; width: 100px; border: 1px solid #0f766e;">P. UNIT.</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; width: 80px; border: 1px solid #0f766e;">IVA %</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; width: 120px; border: 1px solid #0f766e;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item: any, index: number) => `
            <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-size: 12px;">${item.description}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; font-size: 12px;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px;">${item.price.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px;">${item.tax}%</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">${(item.quantity * item.price * (1 + item.tax / 100)).toFixed(2)} ${getCurrencySymbol(invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 350px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 13px;">Subtotal:</span>
            <span style="font-size: 13px; font-weight: 600;">${invoice.subtotal.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 13px;">IVA:</span>
            <span style="font-size: 13px; font-weight: 600;">${invoice.taxAmount.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 15px; background: #0f766e; color: white; border-radius: 8px; margin-top: 5px;">
            <span style="font-size: 16px; font-weight: bold;">TOTAL:</span>
            <span style="font-size: 18px; font-weight: bold;">${invoice.total.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0f766e;">
          <div style="font-size: 11px; color: #666; margin-bottom: 8px; font-weight: bold;">OBSERVACIONES</div>
          <div style="font-size: 12px; white-space: pre-wrap;">${invoice.notes}</div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}
