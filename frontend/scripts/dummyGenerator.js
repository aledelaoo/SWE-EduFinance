import fs from "fs";
import { faker } from "@faker-js/faker";

// How many fake users to make, minimum and maximum number of transactions
const NUM_USERS = 50;
const MIN_TX = 8;
const MAX_TX = 30;

const categories = ["Books", "Food", "Transport", "Income", "Other", "Housing", "Utilities"];

// Generate fake users
function genUsers(n) {
  return Array.from({ length: n }, (_, i) => {
    const name = faker.person.fullName();
    const email = faker.internet
      .email({
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(-1)[0],
      })
      .toLowerCase();
    const password = faker.internet.password({ length: 8, memorable: true });
    return { id: i + 1, name, email, password };
  });
}

// Generate realistic budgets for each user
function genBudgets(users) {
  return users.map((u) => {
    const monthlyBudget = faker.number.int({ min: 800, max: 2200 });
    const spent = faker.number.int({ min: 0, max: monthlyBudget + 200 });
    return {
      userId: u.id,
      month: "October 2025",
      totalBudget: monthlyBudget * 4,
      monthlyBudget,
      spent,
      remaining: Math.max(0, monthlyBudget - spent),
    };
  });
}

// Generate random transactions for each user
function genTransactions(users) {
  const tx = [];
  for (const u of users) {
    const count = faker.number.int({ min: MIN_TX, max: MAX_TX });
    for (let i = 0; i < count; i++) {
      const cat = faker.helpers.arrayElement(categories);
      const amount =
        cat === "Income"
          ? faker.number.float({ min: 200, max: 2000, precision: 0.01 })
          : -faker.number.float({ min: 1, max: 300, precision: 0.01 });
      const date = faker.date
        .between({ from: "2025-01-01", to: "2025-10-22" })
        .toISOString()
        .slice(0, 10);
      tx.push({
        id: tx.length + 1,
        userId: u.id,
        name: faker.finance.transactionDescription(),
        date,
        amount: Number(amount.toFixed(2)),
        category: cat,
      });
    }
  }
  return tx.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const users = genUsers(NUM_USERS);
const budgets = genBudgets(users);
const transactions = genTransactions(users);

const out = { users, budgets, transactions };

// Ensure output folder exists
fs.mkdirSync("src/data", { recursive: true });

// Write JSON output
fs.writeFileSync(
  "src/data/generatedDummy.json",
  JSON.stringify(out, null, 2),
  "utf8"
);

// export credentials for testing
const csv =
  ["email,password"].concat(users.map((u) => `${u.email},${u.password}`)).join("\n");
fs.writeFileSync("src/data/credentials.csv", csv, "utf8");

console.log("Dummy data generated");
console.log(`Users: ${users.length}`);
console.log(`Transactions: ${transactions.length}`);
console.log(`Saved to src/data/generatedDummy.json and src/data/credentials.csv`);
