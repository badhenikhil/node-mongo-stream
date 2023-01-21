const express = require("express");
const mongoose = require("mongoose");
const { Transform } = require("stream");
require("dotenv").config();

const app = express();
app.use(express.json());

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URL);
  app.listen(process.env.PORT, () => {
    console.log(`app listening at http://localhost:${process.env.PORT}`);
  });
}

connectDB();

app.get("/data", async (req, res) => {
  const cursor = mongoose
    .model(process.env.MONGO_COLLECTION, new mongoose.Schema())
    .find({})
    .cursor();

  //transform stream to convert bson object to json string
  const jsonTransform = new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
  });
  jsonTransform.isDirty = false;
  jsonTransform._transform = function (chunk, encoding, callback) {
    if (!this.isDirty) {
      this.isDirty = true;
      callback(null, `[${JSON.stringify(chunk)}]`);
    } else {
      callback(null, `,${JSON.stringify(chunk)}`);
    }
  };
  jsonTransform._flush = function (callback) {
    callback(null, `]`);
  };

  cursor.pipe(jsonTransform).pipe(res);
});
