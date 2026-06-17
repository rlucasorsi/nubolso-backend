const { PrismaClient } = require('@prisma/client');
console.log(new PrismaClient({}).constructor.toString());
