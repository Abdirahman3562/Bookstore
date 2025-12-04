import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import bookRoutes from "./routes/books.js";

dotenv.config();

// connect database
connectDB();

const app = express();
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send({ message: "Bookstore API Running" });
});

// routes
app.use("/api/books", bookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
