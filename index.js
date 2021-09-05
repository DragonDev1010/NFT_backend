const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const morgan = require("morgan");
const { create } = require("ipfs-http-client");

// const ipfs = create("http://localhost:5001")
// const ipfs = create("http://172.31.12.231:5001")
const ipfs = create("http://3.14.134.235:5001/");

const port = process.env.PORT || 3000;

const app = express();

app.use(fileUpload({ createParentPath: true }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.listen(port, () => {
  console.log(`App is listening on port ${port}.`);
});

app.get("/", async (req, res) => {
  res.status(200).json({ status: true, message: "OK" });
});

app.post("/upload-avatar", async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ status: false, message: "No file upload" });
    }
    let avatar = req.files.avatar;
    const { cid } = await ipfs.add(avatar.data, { pin: true });
    return res.status(200).json({ status: true, cid: cid.toString() });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});