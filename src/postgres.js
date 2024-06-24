import postgres from "postgres";
import "dotenv/config";

export const db = postgres({
    host: process.env.PRIVATE_PGHOST,
    database: process.env.PRIVATE_PGDATABASE,
    username: process.env.PRIVATE_PGUSER,
    password: process.env.PRIVATE_PGPASSWORD,
    port: 5432,
    ssl: "require",
    connection: {
      options: `project=${process.env.PRIVATE_ENDPOINT_ID}`,
    }
});