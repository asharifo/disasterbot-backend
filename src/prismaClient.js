import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
})

const connectDb = async () => {
    try {
        await prisma.$connect()
        console.log("Prisma connected to DB")
    } catch (err) {
        console.log("Error connecting to DB")
        process.exit(1)
    }
}

const disconnectDb = async () => {
    try {
        await prisma.$disconnect()
      } catch (e) {
        console.error("Error disconnecting Prisma:", e)
      }
}

export { prisma, connectDb, disconnectDb }
