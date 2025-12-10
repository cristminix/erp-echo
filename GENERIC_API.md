# API Genérica para Todas las Tablas

Esta API permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en todas las tablas de la base de datos usando un token de autenticación.

## Configuración

1. Añade el token a tu archivo `.env`:
```env
GENERIC_API_TOKEN=tu-token-secreto-super-seguro-aqui
```

2. Reinicia el servidor de desarrollo.

## Autenticación

Todas las peticiones deben incluir el header de autorización:
```
Authorization: Bearer tu-token-secreto-super-seguro-aqui
```

## Modelos Disponibles

- user
- company
- contact
- product
- invoice
- invoiceItem
- attendance

## Endpoints

### 1. Leer Registros (GET)

**Listar todos los registros de un modelo:**
```bash
GET /api/generic/{modelo}
```

**Ejemplo - Listar productos:**
```bash
curl -X GET "http://localhost:3000/api/generic/product" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui"
```

**Ejemplo - Listar con paginación:**
```bash
curl -X GET "http://localhost:3000/api/generic/product?limit=10&skip=0" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui"
```

**Ejemplo - Filtrar por campo:**
```bash
curl -X GET "http://localhost:3000/api/generic/product?type=service" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui"
```

**Obtener un registro específico por ID:**
```bash
curl -X GET "http://localhost:3000/api/generic/product?id=clxxx123456" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui"
```

---

### 2. Crear Registro (POST)

```bash
POST /api/generic/{modelo}
Content-Type: application/json
```

**Ejemplo - Crear un contacto:**
```bash
curl -X POST "http://localhost:3000/api/generic/contact" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "phone": "+34 600 123 456",
    "nif": "12345678A",
    "isCustomer": true,
    "isSupplier": false,
    "active": true,
    "userId": "clxxx-user-id",
    "companyId": "clxxx-company-id"
  }'
```

**Ejemplo - Crear un producto:**
```bash
curl -X POST "http://localhost:3000/api/generic/product" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PROD001",
    "name": "Producto Demo",
    "description": "Descripción del producto",
    "type": "storable",
    "price": 99.99,
    "tax": 21,
    "stock": 100,
    "category": "General",
    "unit": "ud",
    "userId": "clxxx-user-id",
    "companyId": "clxxx-company-id"
  }'
```

---

### 3. Actualizar Registro (PUT)

```bash
PUT /api/generic/{modelo}
Content-Type: application/json
```

**Ejemplo - Actualizar un producto:**
```bash
curl -X PUT "http://localhost:3000/api/generic/product" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clxxx-product-id",
    "price": 149.99,
    "stock": 75
  }'
```

**Ejemplo - Actualizar un contacto:**
```bash
curl -X PUT "http://localhost:3000/api/generic/contact" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clxxx-contact-id",
    "email": "nuevo-email@ejemplo.com",
    "phone": "+34 600 999 888"
  }'
```

---

### 4. Eliminar Registro (DELETE)

```bash
DELETE /api/generic/{modelo}?id={id}
```

**Ejemplo - Eliminar un producto:**
```bash
curl -X DELETE "http://localhost:3000/api/generic/product?id=clxxx-product-id" \
  -H "Authorization: Bearer tu-token-secreto-super-seguro-aqui"
```

---

## Respuestas

### Éxito (200/201)
```json
{
  "id": "clxxx123",
  "name": "Registro",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Lista con paginación (200)
```json
{
  "data": [...],
  "total": 100,
  "limit": 10,
  "skip": 0
}
```

### Error de autenticación (401)
```json
{
  "error": "No autorizado. Token inválido."
}
```

### Error de validación (400)
```json
{
  "error": "Modelo 'xyz' no permitido"
}
```

### Error del servidor (500)
```json
{
  "error": "Error interno del servidor",
  "details": "Mensaje de error detallado"
}
```

---

## Ejemplos con JavaScript/TypeScript

### Leer productos
```javascript
const response = await fetch('http://localhost:3000/api/generic/product', {
  headers: {
    'Authorization': 'Bearer tu-token-secreto-super-seguro-aqui'
  }
});
const { data, total } = await response.json();
console.log(`Total productos: ${total}`, data);
```

### Crear contacto
```javascript
const response = await fetch('http://localhost:3000/api/generic/contact', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tu-token-secreto-super-seguro-aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'María García',
    email: 'maria@ejemplo.com',
    isCustomer: true,
    userId: 'clxxx-user-id',
    companyId: 'clxxx-company-id'
  })
});
const newContact = await response.json();
console.log('Contacto creado:', newContact);
```

### Actualizar producto
```javascript
const response = await fetch('http://localhost:3000/api/generic/product', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer tu-token-secreto-super-seguro-aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'clxxx-product-id',
    price: 199.99,
    stock: 50
  })
});
const updatedProduct = await response.json();
console.log('Producto actualizado:', updatedProduct);
```

### Eliminar registro
```javascript
const response = await fetch('http://localhost:3000/api/generic/product?id=clxxx-product-id', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer tu-token-secreto-super-seguro-aqui'
  }
});
const result = await response.json();
console.log(result.message);
```

---

## Ejemplos con Python

### Leer productos
```python
import requests

headers = {
    'Authorization': 'Bearer tu-token-secreto-super-seguro-aqui'
}

response = requests.get('http://localhost:3000/api/generic/product', headers=headers)
data = response.json()
print(f"Total productos: {data['total']}")
print(data['data'])
```

### Crear contacto
```python
import requests

headers = {
    'Authorization': 'Bearer tu-token-secreto-super-seguro-aqui',
    'Content-Type': 'application/json'
}

data = {
    'name': 'Carlos López',
    'email': 'carlos@ejemplo.com',
    'isCustomer': True,
    'userId': 'clxxx-user-id',
    'companyId': 'clxxx-company-id'
}

response = requests.post('http://localhost:3000/api/generic/contact', 
                        headers=headers, 
                        json=data)
print(response.json())
```

---

## Seguridad

⚠️ **IMPORTANTE:**
- Mantén el token seguro y nunca lo compartas
- Usa HTTPS en producción
- Considera añadir rate limiting
- Registra todas las peticiones para auditoría
- Cambia el token regularmente
- Usa variables de entorno para el token, nunca lo hardcodees

---

## Notas

- Los campos requeridos dependen del modelo (ver schema.prisma)
- Las fechas se manejan en formato ISO 8601
- Los IDs son CUIDs generados automáticamente
- Los campos relacionales requieren IDs válidos
