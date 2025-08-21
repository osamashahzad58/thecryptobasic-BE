const mongoose = require("mongoose");
require("dotenv").config();
const { Command } = require("commander");

async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log(`Database connected...`);
  } catch (ex) {
    console.log(ex);
    process.exit(-1);
  }
}

const program = new Command();

program
  .name("theCryptoBasic Database Seeder")
  .description("Seed Database")
  .version("0.1.0");

program
  .command("seed-admin-credentials")
  .description("Seed admin credentials in database")
  .action(async () => {
    try {
      await connectDB();

      const Admin = require("../src/admins/admins.model");

      try {
        let isDatabaseSeeded = false;

        const admin = await Admin.create({
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        });

        isDatabaseSeeded = true;

        if (isDatabaseSeeded) {
          console.log("Database Seeded Successfully...");
        } else {
          console.log("Database already seeded...");
        }
      } catch (ex) {
        console.log("Database seeding failed...");
        process.exit(-1);
      }
    } catch (ex) {
      console.log(ex);
      process.exit(1);
    }
  });

program.parse(process.argv);
