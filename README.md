# 🚀 FalconERP - Sistema ERP Completo

Sistema ERP moderno y completo desarrollado con Next.js 14, diseñado para pequeñas y medianas empresas que necesitan gestionar sus operaciones de forma eficiente y profesional.

[![GitHub](https://img.shields.io/badge/GitHub-falconsoft3d%2Ffalconerp.xyz-blue?logo=github)](https://github.com/falconsoft3d/falconerp.xyz)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

## 📋 Características Principales

### 🏢 Multi-Empresa
- ✅ Gestión de múltiples empresas desde una sola cuenta
- ✅ Temas personalizados por empresa (colores primarios y secundarios)
- ✅ Configuración independiente de numeración de facturas
- ✅ Logo y datos fiscales personalizados

### 📦 Gestión de Productos
- ✅ Catálogo completo con imágenes
- ✅ Control de stock e inventario
- ✅ Categorías y precios con IVA
- ✅ Importación desde Odoo

### 👥 Gestión de Contactos
- ✅ Base de datos de clientes y proveedores
- ✅ Información completa (NIF, dirección, contacto)
- ✅ Historial de facturas
- ✅ Importación desde Odoo

### 📄 Facturación Completa
- ✅ Facturas de venta y compra
- ✅ Cálculo automático de IVA y totales
- ✅ Generación de PDF profesionales
- ✅ Envío por email
- ✅ Adjuntos y comentarios
- ✅ Estados de pago
- ✅ Importación masiva desde Excel

### 💰 Punto de Venta (POS)
- ✅ Interfaz intuitiva con imágenes de productos
- ✅ Filtrado por categorías
- ✅ Búsqueda rápida
- ✅ Generación inmediata de facturas
- ✅ Descuentos y cálculos automáticos

### 🎯 CRM
- ✅ Gestión de oportunidades de venta
- ✅ Pipeline personalizable con drag & drop
- ✅ Etapas configurables
- ✅ Formularios públicos para captación de leads

### 📊 Proyectos y Tareas
- ✅ Gestión de proyectos
- ✅ Control de tareas por proyecto
- ✅ Estados y prioridades
- ✅ Asignación a usuarios

### 👤 Control de Asistencia
- ✅ Registro de entrada/salida
- ✅ Cálculo de horas trabajadas
- ✅ Historial por empleado

### 🔐 Autenticación y Seguridad
- ✅ Sistema de login/registro
- ✅ JWT para autenticación
- ✅ Verificación de email
- ✅ Recuperación de contraseña
- ✅ Roles de usuario

### 🌐 API REST
- ✅ API Key por empresa
- ✅ Tokens de subida de archivos
- ✅ Endpoints documentados

### 📧 Sistema de Email
- ✅ Configuración SMTP personalizada
- ✅ Plantillas de email
- ✅ Envío de facturas automático

### 🔄 Integración con Odoo
- ✅ Importación de productos
- ✅ Importación de contactos
- ✅ Sincronización de datos

## 🛠 Tecnologías Utilizadas

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript 5
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma 6
- **Estilos**: Tailwind CSS 4
- **Autenticación**: JWT (jose)
- **Generación PDF**: jsPDF + Puppeteer
- **Drag & Drop**: @hello-pangea/dnd
- **Gráficos**: Recharts
- **Excel**: XLSX
- **Email**: Nodemailer

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/falconsoft3d/falconerp.xyz.git
cd falconerp.xyz
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/falconerp"

# JWT Secret (genera una clave segura)
JWT_SECRET="tu-clave-secreta-muy-segura-aqui"

# Configuración de la aplicación
NEXT_PUBLIC_ALLOW_REGISTRATION="true"

# Email (opcional - para envío de facturas)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-contraseña-app"
```

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# (Opcional) Cargar datos de ejemplo
npx prisma db seed
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📦 Despliegue en Producción

### Vercel (Recomendado)

1. **Conectar con GitHub**
   - Importa el proyecto desde GitHub en Vercel
   - Configura las variables de entorno

2. **Variables de entorno en Vercel**
   ```
   DATABASE_URL
   JWT_SECRET
   NEXT_PUBLIC_ALLOW_REGISTRATION
   ```

3. **Deploy automático**
   - Vercel desplegará automáticamente en cada push

### Build Manual

```bash
# Generar build de producción
npm run build

# Ejecutar en producción
npm start
```

## 📚 Estructura del Proyecto

```
falconerp.xyz/
├── app/                    # Páginas y rutas de Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Panel de administración
│   ├── login/            # Autenticación
│   └── ...
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y helpers
├── prisma/               # Schema y migraciones de base de datos
├── public/               # Archivos estáticos
└── content/              # Contenido del blog (Markdown)
```

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

**Marlon Falcon Hernandez**
- GitHub: [@falconsoft3d](https://github.com/falconsoft3d)
- Proyecto: [FalconERP](https://github.com/falconsoft3d/falconerp.xyz)

## 🌟 Agradecimientos

- Next.js Team por el increíble framework
- Vercel por el hosting
- Comunidad open source

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un [Issue](https://github.com/falconsoft3d/falconerp.xyz/issues)
- Revisa la [documentación](https://github.com/falconsoft3d/falconerp.xyz/wiki)

---

⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub!
