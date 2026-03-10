// In-memory mock — swap back to Prisma for production
// const { PrismaClient } = require("@prisma/client");
// module.exports = new PrismaClient();

const customers = new Map();
let config = {
  id: 1,
  rewardIcon: "🥛",
  rewardName: "1 Milk Packet — FREE",
  totalClaimed: 0,
};

module.exports = {
  customer: {
    findUnique: async ({ where }) => customers.get(where.phone) || null,
    findMany: async ({ orderBy } = {}) => {
      const list = Array.from(customers.values());
      if (orderBy?.streak === "desc") list.sort((a, b) => b.streak - a.streak);
      return list;
    },
    create: async ({ data }) => {
      const customer = { id: customers.size + 1, ...data, createdAt: new Date(), updatedAt: new Date() };
      customers.set(data.phone, customer);
      return customer;
    },
    update: async ({ where, data }) => {
      const existing = customers.get(where.phone);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, ...data, updatedAt: new Date() };
      customers.set(where.phone, updated);
      return updated;
    },
    count: async ({ where } = {}) => {
      if (!where) return customers.size;
      return Array.from(customers.values()).filter((c) => {
        return Object.entries(where).every(([k, v]) => c[k] === v);
      }).length;
    },
  },
  config: {
    findUnique: async () => config,
    create: async ({ data }) => { config = { id: 1, ...data }; return config; },
    upsert: async ({ update, create }) => {
      if (update.totalClaimed?.increment) {
        config.totalClaimed += update.totalClaimed.increment;
      } else {
        Object.assign(config, update);
      }
      return config;
    },
    update: async ({ data }) => { Object.assign(config, data); return config; },
  },
};
