import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Mulai seeding data user...")

  // Hash password default
  const defaultPassword = await bcrypt.hash("password123", 10)

  // Buat user admin pertama
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@falconerp.com" },
    update: {},
    create: {
      email: "admin@falconerp.com",
      password: defaultPassword,
      name: "Administrator",
      role: "admin",
      emailVerified: true,
    },
  })

  console.log(`User admin dibuat dengan ID: ${adminUser.id}`)

  // Buat beberapa user tambahan untuk testing
  const user1 = await prisma.user.upsert({
    where: { email: "john.doe@falconerp.com" },
    update: {},
    create: {
      email: "john.doe@falconerp.com",
      password: defaultPassword,
      name: "John Doe",
      role: "user",
      emailVerified: true,
      createdById: adminUser.id, // Dibuat oleh admin
    },
  })

  console.log(`User John Doe dibuat dengan ID: ${user1.id}`)

  const user2 = await prisma.user.upsert({
    where: { email: "jane.smith@falconerp.com" },
    update: {},
    create: {
      email: "jane.smith@falconerp.com",
      password: defaultPassword,
      name: "Jane Smith",
      role: "user",
      emailVerified: true,
      createdById: adminUser.id, // Dibuat oleh admin
    },
  })

  console.log(`User Jane Smith dibuat dengan ID: ${user2.id}`)

  // Buat perusahaan default untuk admin
  const company = await prisma.company.create({
    data: {
      name: "Perusahaan Default",
      userId: adminUser.id,
      email: "info@perusahaan.com",
      currency: "USD",
      primaryColor: "#0d9488",
      secondaryColor: "#14b8a6",
      active: true,
    },
  })

  console.log(`Perusahaan default dibuat dengan ID: ${company.id}`)

  console.log("Seeding selesai!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
