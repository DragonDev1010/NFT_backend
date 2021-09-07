const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const morgan = require("morgan");
const { create } = require("ipfs-http-client");
const generateArt = require("./generateArt");

// const ipfs = create("http://localhost:5001")
// const ipfs = create("http://172.31.12.231:5001")
const ipfs = create("http://3.14.134.235:5001/");
// const ipfs = create({
//   host: "ipfs.infura.io",
//   port: 5001,
//   protocol: "https",
//   timeout: "60s"
// });

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

app.get("/generate-nft/:editionSize", async (req, res) => {
  try {
    let editionSize = parseInt(req.params.editionSize);
    if (!editionSize && isNaN(editionSize)) {
      return res.status(400).json({
        status: false,
        message: "Total amount of NFTs to be generated is not provided"
      });
    }

    if (editionSize < 1) {
      editionSize = 1;
    }

    if (editionSize > 5) {
      editionSize = 5;
    }

    const metadata = await generateArt(parseInt(editionSize));

    for (let i = 0; i < metadata.length; i++) {
      const m = metadata[i];
      const { cid } = await ipfs.add(m.image, { pin: true, timeout: "60s" });
      m.image = cid.toString();
      console.log(m);
    }

    console.log(metadata);
    const { cid } = await ipfs.add(JSON.stringify(metadata, null, 2), {
      pin: true,
      timeout: "60s"
    });
    console.log(cid);
    return res.status(200).json({ status: true, cid: cid.toString() });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: false, message: err.message });
  }
});
