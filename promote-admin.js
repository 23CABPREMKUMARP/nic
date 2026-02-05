require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    try {
        if (email) {
            const updatedUser = await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' }
            });
            console.log(`SUCCESS: User ${updatedUser.name} (${updatedUser.email}) is now an ADMIN.`);
        } else {
            const users = await prisma.user.findMany();
            console.log('--- USER REGISTRY ---');
            users.forEach(u => {
                console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
            });
            console.log('---------------------');
            console.log('Usage: node promote-admin.js <email>');
        }
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
