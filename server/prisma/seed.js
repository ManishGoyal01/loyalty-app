const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: {
      rewardIcon: "🥛",
      rewardName: "1 Milk Packet — FREE",
      totalClaimed: 0,
    },
  });
  console.log("Seed complete: default config created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
