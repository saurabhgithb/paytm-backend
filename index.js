const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const mainRouter = require("./routes/index");

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/v1", mainRouter);

app.listen(port, () => {
  console.log(`App is listening on http://localhost:${port}/api/v1`);
});
