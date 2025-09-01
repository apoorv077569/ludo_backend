import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Database Connected");

    // Source: test DB
    const testDB = mongoose.connection.useDb("test");
    const testUsers = testDB.collection("users");

    // Destination: ludo DB
    const ludoDB = mongoose.connection.useDb("ludo");
    const ludoUsers = ludoDB.collection("users");

    const users = await testUsers.find().toArray();
    console.log(`🔍 Found ${users.length} users to migrate`);

    for (let u of users) {
      await ludoUsers.insertOne({
        _id: u._id,
        username: u.username, // ensure same field name as Ludo schema
        email: u.email,
        balance: u.balance,
      });
      console.log(`✅ Migrated: ${u.username}`);
    }

    console.log("🎉 All users migrated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

start();
