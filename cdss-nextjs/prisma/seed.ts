import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Akun operator (bisa login)
  await prisma.user.upsert({
    where: { email: 'admin@cdss.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@cdss.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'dokter@cdss.com' },
    update: {},
    create: {
      name: 'Dr. Budi Santoso',
      email: 'dokter@cdss.com',
      password: hashedPassword,
      role: 'DOCTOR',
    },
  })

  await prisma.user.upsert({
    where: { email: 'perawat@cdss.com' },
    update: {},
    create: {
      name: 'Perawat IGD',
      email: 'perawat@cdss.com',
      password: hashedPassword,
      role: 'NURSE',
    },
  })

  // Contoh pasien (tidak bisa login)
  await prisma.user.upsert({
    where: { email: 'siti.rahayu@pasien.com' },
    update: {},
    create: {
      name: 'Siti Rahayu',
      email: 'siti.rahayu@pasien.com',
      password: await bcrypt.hash('dummy', 10),
      role: 'PATIENT',
    },
  })

  await prisma.user.upsert({
    where: { email: 'ahmad.fauzi@pasien.com' },
    update: {},
    create: {
      name: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@pasien.com',
      password: await bcrypt.hash('dummy', 10),
      role: 'PATIENT',
    },
  })

  console.log('Seed berhasil — akun dibuat:')
  console.log('  [ADMIN]  admin@cdss.com     / admin123')
  console.log('  [DOCTOR] dokter@cdss.com    / admin123')
  console.log('  [NURSE]  perawat@cdss.com   / admin123')
  console.log('  [PATIENT] Siti Rahayu, Ahmad Fauzi (tidak bisa login)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())