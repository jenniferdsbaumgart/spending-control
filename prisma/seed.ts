import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

// Setup Prisma with pg adapter
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Create test user
    const passwordHash = await bcrypt.hash("password123", 12);
    const user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: {
            email: "demo@example.com",
            name: "Demo User",
            passwordHash,
            locale: "pt-BR",
            currency: "BRL",
        },
    });
    console.log("✅ Created user:", user.email);

    // Create workspace
    const workspace = await prisma.workspace.upsert({
        where: { id: "demo-workspace" },
        update: {},
        create: {
            id: "demo-workspace",
            name: "Minha Casa",
            defaultCurrency: "BRL",
            members: {
                create: {
                    userId: user.id,
                    role: "ADMIN",
                },
            },
        },
    });
    console.log("✅ Created workspace:", workspace.name);

    // Create budget groups
    const essentials = await prisma.budgetGroup.upsert({
        where: { id: "group-essentials" },
        update: {},
        create: {
            id: "group-essentials",
            workspaceId: workspace.id,
            name: "Essenciais",
            defaultPercent: 50,
            color: "#8b5cf6",
            sortOrder: 1,
        },
    });

    const lifestyle = await prisma.budgetGroup.upsert({
        where: { id: "group-lifestyle" },
        update: {},
        create: {
            id: "group-lifestyle",
            workspaceId: workspace.id,
            name: "Estilo de Vida",
            defaultPercent: 30,
            color: "#ec4899",
            sortOrder: 2,
        },
    });

    const investments = await prisma.budgetGroup.upsert({
        where: { id: "group-investments" },
        update: {},
        create: {
            id: "group-investments",
            workspaceId: workspace.id,
            name: "Investimentos",
            defaultPercent: 20,
            color: "#10b981",
            sortOrder: 3,
        },
    });
    console.log("✅ Created budget groups");

    // Create categories
    const categories = [
        { id: "cat-housing", name: "Moradia", groupId: essentials.id },
        { id: "cat-food", name: "Alimentação", groupId: essentials.id },
        { id: "cat-transport", name: "Transporte", groupId: essentials.id },
        { id: "cat-health", name: "Saúde", groupId: essentials.id },
        { id: "cat-entertainment", name: "Lazer", groupId: lifestyle.id },
        { id: "cat-shopping", name: "Compras", groupId: lifestyle.id },
        { id: "cat-education", name: "Educação", groupId: lifestyle.id },
        { id: "cat-savings", name: "Poupança", groupId: investments.id },
        { id: "cat-retirement", name: "Aposentadoria", groupId: investments.id },
    ];

    for (const cat of categories) {
        await prisma.budgetCategory.upsert({
            where: { id: cat.id },
            update: {},
            create: {
                id: cat.id,
                workspaceId: workspace.id,
                groupId: cat.groupId,
                name: cat.name,
            },
        });
    }
    console.log("✅ Created categories");

    // Create accounts
    const bank = await prisma.financialAccount.upsert({
        where: { id: "account-bank" },
        update: {},
        create: {
            id: "account-bank",
            workspaceId: workspace.id,
            name: "Nubank",
            type: "BANK",
            isDefault: true,
        },
    });

    const credit = await prisma.financialAccount.upsert({
        where: { id: "account-credit" },
        update: {},
        create: {
            id: "account-credit",
            workspaceId: workspace.id,
            name: "Cartão Nubank",
            type: "CREDIT",
        },
    });

    const cash = await prisma.financialAccount.upsert({
        where: { id: "account-cash" },
        update: {},
        create: {
            id: "account-cash",
            workspaceId: workspace.id,
            name: "Dinheiro",
            type: "CASH",
        },
    });
    console.log("✅ Created accounts");

    // Create transactions for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Income
    await prisma.transaction.create({
        data: {
            workspaceId: workspace.id,
            date: new Date(startOfMonth.getTime() + 5 * 24 * 60 * 60 * 1000),
            amount: 8500,
            type: "INCOME",
            description: "Salário",
            status: "POSTED",
            accountId: bank.id,
        },
    });

    // Expenses
    const expenses = [
        { desc: "Aluguel", amount: 1800, catId: "cat-housing", day: 5 },
        { desc: "Supermercado", amount: 650, catId: "cat-food", day: 7 },
        { desc: "Combustível", amount: 250, catId: "cat-transport", day: 10 },
        { desc: "Restaurante", amount: 180, catId: "cat-entertainment", day: 12 },
        { desc: "Farmácia", amount: 120, catId: "cat-health", day: 15 },
        { desc: "Streaming", amount: 55, catId: "cat-entertainment", day: 8 },
    ];

    for (const exp of expenses) {
        await prisma.transaction.create({
            data: {
                workspaceId: workspace.id,
                date: new Date(startOfMonth.getTime() + exp.day * 24 * 60 * 60 * 1000),
                amount: exp.amount,
                type: "EXPENSE",
                description: exp.desc,
                status: "POSTED",
                accountId: bank.id,
                categoryId: exp.catId,
            },
        });
    }
    console.log("✅ Created transactions");

    // Create a goal
    const goal = await prisma.goal.upsert({
        where: { id: "goal-emergency" },
        update: {},
        create: {
            id: "goal-emergency",
            workspaceId: workspace.id,
            name: "Fundo de Emergência",
            targetAmount: 15000,
            initialAmount: 2000,
            color: "#10b981",
        },
    });

    await prisma.goalContribution.create({
        data: {
            goalId: goal.id,
            amount: 500,
            date: new Date(startOfMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
            note: "Aporte mensal",
        },
    });
    console.log("✅ Created goal with contribution");

    // Create an installment plan
    const installmentPlan = await prisma.installmentPlan.upsert({
        where: { id: "installment-tv" },
        update: {},
        create: {
            id: "installment-tv",
            workspaceId: workspace.id,
            description: "TV Samsung 55\"",
            merchant: "Magazine Luiza",
            totalAmount: 2999,
            installmentsCount: 10,
            firstDueDate: startOfMonth,
            accountId: credit.id,
            categoryId: "cat-shopping",
        },
    });

    // Create installment transactions
    const installmentAmount = Math.floor(2999 / 10 * 100) / 100;
    const lastAmount = 2999 - installmentAmount * 9;

    for (let i = 0; i < 10; i++) {
        const date = new Date(startOfMonth);
        date.setMonth(date.getMonth() + i);

        await prisma.transaction.create({
            data: {
                workspaceId: workspace.id,
                date,
                amount: i === 9 ? lastAmount : installmentAmount,
                type: "EXPENSE",
                description: `TV Samsung (${i + 1}/10)`,
                status: i < 2 ? "POSTED" : "PLANNED",
                accountId: credit.id,
                categoryId: "cat-shopping",
                installmentPlanId: installmentPlan.id,
                installmentNumber: i + 1,
            },
        });
    }
    console.log("✅ Created installment plan with transactions");

    console.log("\n🎉 Seeding complete!\n");
    console.log("📧 Login credentials:");
    console.log("   Email: demo@example.com");
    console.log("   Password: password123\n");
}

main()
    .then(async () => {
        await prisma.$disconnect();
        await pool.end();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        await pool.end();
        process.exit(1);
    });
