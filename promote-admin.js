const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Found users:', users.length);
        if (users.length === 0) {
            console.log('No users found. Please sign in to the app first!');
            return;
        }

        const updated = await prisma.user.updateMany({
            data: { role: 'ADMIN' }
        });
        console.log(`Promoted ${updated.count} users to ADMIN.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
