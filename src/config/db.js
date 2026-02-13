const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",

    // aman untuk development
    logging: false,

    dialectOptions: {
      ssl: process.env.DB_SSL === "true"
        ? { require: true, rejectUnauthorized: false }
        : false,
    },

    timezone: "+07:00", // WIB
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected");

    // PENTING: jangan sync alter di production
    // await sequelize.sync({ alter: true });

  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
