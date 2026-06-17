const { PrismaClient } = require('@prisma/client');
try {
  const p = new PrismaClient({ invalidProp: 'test' });
} catch (e) {
  console.log(e.message);
}
