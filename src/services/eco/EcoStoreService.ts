
import { prisma } from '@/lib/prisma';

export interface CheckoutRequest {
    userId: string;
    items: {
        productId: string;
        quantity: number;
    }[];
}

export class EcoStoreService {
    /**
     * Get all products categorized
     */
    static async getProducts() {
        const p = prisma as any;
        const products = await p.ecoStoreProduct.findMany({
            where: { stock: { gt: 0 } },
            orderBy: { category: 'asc' }
        });
        return products;
    }

    /**
     * Handle point + cash checkout
     */
    static async checkout(data: CheckoutRequest) {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Fetch products and calculate totals
            let totalPoints = 0;
            let totalCash = 0;
            const orderItemsData = [];

            for (const item of data.items) {
                const product = await tx.ecoStoreProduct.findUnique({
                    where: { id: item.productId }
                });

                if (!product || product.stock < item.quantity) {
                    throw new Error(`Product ${product?.name || item.productId} is out of stock.`);
                }

                totalPoints += product.pricePoints * item.quantity;
                totalCash += product.priceCash * item.quantity;

                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    points: product.pricePoints,
                    cash: product.priceCash
                });

                // Update stock
                await tx.ecoStoreProduct.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }

            // 2. Check user points
            const user = await tx.user.findUnique({
                where: { id: data.userId }
            });

            if (!user || (user as any).ecoPoints < totalPoints) {
                throw new Error("Insufficient Eco Points for this purchase.");
            }

            // 3. Deduct points and create order
            await tx.user.update({
                where: { id: data.userId },
                data: { ecoPoints: { decrement: totalPoints } } as any
            });

            const order = await tx.ecoStoreOrder.create({
                data: {
                    userId: data.userId,
                    totalPoints,
                    totalCash,
                    status: 'PENDING',
                    items: {
                        create: orderItemsData
                    }
                },
                include: { items: true }
            });

            return order;
        });
    }

    /**
     * Initial Seed for Eco Store
     */
    static async seedProducts() {
        const products = [
            {
                name: "Premium Ooty Homemade Chocolates (250g)",
                description: "Famous assorted dark and milk chocolates from the Nilgiris.",
                pricePoints: 50,
                priceCash: 250,
                category: "Chocolates",
                stock: 100,
                imageUrls: ["/images/products/choc.jpg"]
            },
            {
                name: "Nilgiri Green Tea (Organic)",
                description: "Hand-picked green tea leaves from the high altitude estates.",
                pricePoints: 30,
                priceCash: 180,
                category: "Tea",
                stock: 50,
                imageUrls: ["/images/products/tea.jpg"]
            },
            {
                name: "Eucalyptus Oil (Pure)",
                description: "Authentic Nilgiri oil extracted from fresh eucalyptus leaves.",
                pricePoints: 20,
                priceCash: 120,
                category: "Oil",
                stock: 200,
                imageUrls: ["/images/products/oil.jpg"]
            },
            {
                name: "Ooty Varkey (Traditional)",
                description: "The legendary crispy, crusty biscuit unique to Ooty.",
                pricePoints: 15,
                priceCash: 90,
                category: "Local Snacks",
                stock: 150,
                imageUrls: ["/images/products/varkey.jpg"]
            },
            {
                name: "Nilgiri Wild Forest Honey",
                description: "Pure, unprocessed honey collected from the wild hill bees.",
                pricePoints: 40,
                priceCash: 350,
                category: "Health",
                stock: 80,
                imageUrls: ["/images/products/honey.jpg"]
            },
            {
                name: "Toda Handcrafted Shawl",
                description: "Traditional vibrant embroidery work by the Toda tribe.",
                pricePoints: 200,
                priceCash: 1500,
                category: "Handicrafts",
                stock: 20,
                imageUrls: ["/images/products/toda.jpg"]
            },
            {
                name: "Assorted Nilgiri Spices",
                description: "Freshly harvested Cardamom, Cloves, and Cinnamon.",
                pricePoints: 60,
                priceCash: 450,
                category: "Spices",
                stock: 120,
                imageUrls: ["/images/products/spices.jpg"]
            },
            {
                name: "Ooty Strawberry Jam",
                description: "Made from fresh field-picked Nilgiri strawberries.",
                pricePoints: 25,
                priceCash: 220,
                category: "Preserves",
                stock: 90,
                imageUrls: ["/images/products/jam.jpg"]
            }
        ];

        // Cleanup legacy short IDs to avoid duplication
        const legacyIds = ['seed-Premi', 'seed-Eucal', 'seed-Nilgi'];
        await (prisma as any).ecoStoreProduct.deleteMany({
            where: { id: { in: legacyIds } }
        });

        for (const p of products) {
            const slug = p.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
            await (prisma as any).ecoStoreProduct.upsert({
                where: { id: `seed-${slug}` },
                update: p,
                create: { ...p, id: `seed-${slug}` }
            });
        }
    }
}
