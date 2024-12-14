const express = require("express");
const expressSanitizer = require("express-sanitizer");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitizer());

app.use("/", express.static("public"));

app.use("/categories", require("./routes/categoryRoutes"));
app.use("/musical_instruments", require("./routes/musicalInstrumentRoutes"));

module.exports = app;
