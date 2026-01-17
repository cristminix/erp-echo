# Panduan Menambahkan User ke Database - FalconERP

## Deskripsi Umum

Proyek FalconERP menggunakan sistem manajemen pengguna berbasis database PostgreSQL dengan Prisma ORM. Sistem ini mendukung hierarki pengguna dimana satu pengguna utama dapat membuat pengguna-pengguna tambahan.

## Skema Model User

Berikut adalah definisi dari model User dalam skema Prisma:

```prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  name      String
  role      String     @default("user") // "admin" o "user"
  active    Boolean    @default(true)
  avatar    String?    // URL o base64 de la foto de perfil
  emailVerified Boolean  @default(false) // Si el email ha sido verificado
  verificationCode String? // Código de verificación de 6 dígitos
  verificationCodeExpiry DateTime? // Expiración del código

  // Token para registro de asistencia desde móvil
  attendanceToken String? @unique // Token único para acceder desde móvil

  // Coste por hora para cálculo de asistencia
  hourlyRate Decimal? @db.Decimal(10, 2) // Coste por hora del empleado

  // Usuario que lo creó (null si es el usuario principal registrado)
  createdById String?
  createdBy   User?    @relation("UserCreator", fields: [createdById], references: [id], onDelete: Cascade)

  // Usuarios que este usuario ha creado
  createdUsers User[] @relation("UserCreator")

  // Empresa asignada por defecto
  defaultCompanyId String?
  defaultCompany   Company? @relation("DefaultCompany", fields: [defaultCompanyId], references: [id], onDelete: SetNull)

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  companies Company[]
  contacts  Contact[]
  products  Product[]
  invoices  Invoice[]
  quotes    Quote[]
  attendances Attendance[]
  projects  Project[]
  tasks     Task[] @relation("TaskCreator")
  assignedTasks Task[] @relation("TaskAssignee")
  trackings Tracking[]
  projectStaff ProjectStaff[]
  equipment Equipment[]
  workOrders WorkOrder[]
  responsibleWorkOrders WorkOrder[] @relation("WorkOrderResponsible")
  properties Property[]
  journals  Journal[]
  accounts  Account[]
  taxes     Tax[]
  journalEntries JournalEntry[]
  budgetItems BudgetItem[]
  accountingTransactions AccountingTransaction[]

  // Comunicación (Slack clone)
  createdWorkspaces Workspace[] @relation("WorkspaceCreator")
  workspaceMemberships WorkspaceMember[] @relation("WorkspaceMembership")
  createdChannels Channel[] @relation("ChannelCreator")
  channelMemberships ChannelMember[] @relation("ChannelMembership")
  sentMessages Message[] @relation("MessageSender")
  messageReactions MessageReaction[] @relation("MessageReactionUser")
  directMessageParticipations DirectMessageParticipant[] @relation("DMParticipant")
  messageMentions MessageMention[] @relation("MessageMentionUser")
  pinnedMessages PinnedMessage[] @relation("MessagePinner")
}
```

## Cara Menambahkan User Baru

### 1. Melalui API Register (Registrasi Pengguna Baru)

Untuk registrasi pengguna baru, gunakan endpoint `/api/auth/register`:

```typescript
// File: app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  // ...
}
```

Contoh permintaan:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nama User"
}
```

Proses registrasi akan:

- Memvalidasi data masukan menggunakan Zod
- Memeriksa apakah email sudah digunakan
- Mengenkripsi password menggunakan bcrypt
- Membuat pengguna baru di database
- Membuat perusahaan default untuk pengguna tersebut
- Mengirim email verifikasi jika fitur verifikasi diaktifkan
- Menghasilkan token otentikasi jika tidak memerlukan verifikasi

### 2. Melalui API Admin (Menambahkan Pengguna oleh Admin)

Admin dapat menambahkan pengguna baru untuk organisasinya melalui endpoint khusus. Namun, dalam sistem saat ini, belum ada endpoint khusus untuk admin menambahkan pengguna secara langsung.

Namun, sistem mendukung hierarki pengguna dimana pengguna utama dapat mengelola pengguna-pengguna yang dibuatnya sendiri.

### 3. Langkah-langkah Manual Menggunakan Prisma Client

Jika Anda ingin menambahkan user secara manual melalui kode, berikut adalah contoh implementasinya:

```typescript
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

async function createUser(userData: {
  email: string
  password: string
  name: string
  role?: string
  createdById?: string // Jika dibuat oleh pengguna lain
}) {
  // Hash password terlebih dahulu
  const hashedPassword = await hashPassword(userData.password)

  // Buat pengguna baru
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role || "user",
      createdById: userData.createdById || null, // Untuk hierarki pengguna
      emailVerified: true, // Atur sesuai kebutuhan
    },
  })

  return user
}
```

## Fitur Penting Sistem Pengguna

### Hierarki Pengguna

- Pengguna dapat memiliki `createdById` yang merujuk ke pengguna yang membuatnya
- Data antar pengguna dalam hierarki yang sama dapat dibagi
- Fungsi `getEffectiveUserId()` dan `getSharedUserIds()` di `lib/user-helpers.ts` digunakan untuk mengatur pembagian data

### Keamanan

- Password di-hash menggunakan bcrypt
- Otentikasi menggunakan JWT token
- Dukungan verifikasi email opsional
- Dukungan token kehadiran mobile

### Hak Akses

- Peran pengguna: `admin` atau `user`
- Status aktif/non-aktif
- Pembatasan akses berdasarkan hierarki pengguna

## Endpoint Terkait

- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/login` - Login pengguna
- `GET /api/users/[id]` - Mendapatkan data pengguna
- `PUT /api/users/[id]` - Memperbarui data pengguna
- `DELETE /api/users/[id]` - Menghapus pengguna

## Catatan Konfigurasi

Pastikan variabel lingkungan berikut disetel dalam file `.env`:

```
ALLOW_REGISTRATION=true        # Mengizinkan registrasi pengguna baru
REQUIRE_EMAIL_VERIFICATION=true # Memerlukan verifikasi email
```

## Contoh Implementasi Lengkap

Berikut adalah contoh fungsi komplit untuk menambahkan pengguna baru:

```typescript
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

interface CreateUserInput {
  email: string
  password: string
  name: string
  role?: string
  createdById?: string
}

export async function addUser(userData: CreateUserInput) {
  try {
    // Validasi apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      throw new Error("Email sudah terdaftar")
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password)

    // Buat pengguna baru
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || "user",
        createdById: userData.createdById || null,
        emailVerified:
          process.env.REQUIRE_EMAIL_VERIFICATION === "true" ? false : true,
      },
    })

    // Jika ini adalah pengguna pertama yang dibuat oleh pengguna tertentu,
    // Anda mungkin ingin melakukan tindakan tambahan seperti membuat perusahaan default
    if (userData.createdById) {
      // Logika tambahan jika diperlukan
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    }
  } catch (error) {
    console.error("Error menambahkan pengguna:", error)
    throw error
  }
}
```

Dengan sistem ini, FalconERP mendukung manajemen pengguna yang fleksibel dengan kemampuan hierarki dan pembagian data antar pengguna dalam organisasi yang sama.
