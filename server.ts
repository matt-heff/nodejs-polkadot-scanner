import { ApiPromise, WsProvider } from "@polkadot/api";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
require("dotenv").config();

const app = express();

export interface TypedRequestBody<T> extends express.Request {
  body: T;
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.PASSWORD,
    name: "Cookie_name",
    cookie: { maxAge: 60000 },
  })
);

const port = 8087;
var sessionData;

app.listen(port, () =>
  console.log(`Server is running and listening on port ${port}`)
);

app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/pages/signin.html");
});

app.get("/errorlogin", async (req, res) => {
  res.sendFile(__dirname + "/pages/errorlogin.html");
});

app.get("/signin", async (req: express.Request, res: express.Response) => {
  res.sendFile(__dirname + "/pages/signin.html");
});

app.get("/scanner", async (req: express.Request, res: express.Response) => {
  let isValid = await verifyValidSession(req, res);
  if (isValid) {
    res.sendFile(__dirname + "/pages/scanner.html");
  } else {
    res.sendFile(__dirname + "/pages/errorlogin.html");
  }
});

app.post("/scanner", async (req: express.Request, res: express.Response) => {
  let secretcode = req.body.secretcode;
  if (secretcode !== process.env.PASSWORD) {
    res.statusCode = 404;
    res.sendFile(__dirname + "/pages/errorlogin.html");
  } else {
    sessionData = req.session;
    sessionData.user = {};
    sessionData.user.secretcode = secretcode;
    let isValid = await verifyValidSession(req, res);
    if (isValid) {
      res.sendFile(__dirname + "/pages/scanner.html");
    } else {
      res.sendFile(__dirname + "/pages/errorlogin.html");
    }
  }
});

// Logout
app.get(
  "/logout",
  async function (req: express.Request, res: express.Response) {
    req.session.destroy();
    res.sendFile(__dirname + "/pages/signin.html");
  }
);

app.get(
  "/scan/:startblock/:endblock/:rpcaddress",
  async (req: express.Request, res: express.Response) => {
    const result = await getPolkadotBlockData(
      req.params.startblock,
      req.params.endblock,
      req.params.rpcaddress
    );
    res.send({ result: result });
  }
);

app.get("/latestblock", async (req: express.Request, res: express.Response) => {
  const wsProvider = new WsProvider(process.env.RPC_ADDRESS);
  const api = await ApiPromise.create({ provider: wsProvider });
  const [lastHeader] = await Promise.all([
    // Retrieve the latest header
    api.rpc.chain.getHeader(),
  ]);
  res.send({ block: lastHeader.number.toNumber() });
});

const verifyValidSession = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    if (
      typeof req.session.user === "undefined" ||
      req.session.user.secretcode !== process.env.PASSWORD
    ) {
      //JSAlert.alert("Session issue detected. Redirecting so you can login");
      return false;
    } else {
      return true;
    }
  } catch (e) {
    return false;
  }
};

async function getPolkadotBlockData(startBlock, endBlock, rpcAddress) {
  console.log("polkadotAPI", rpcAddress);
  const wsProvider = new WsProvider(rpcAddress);
  // Create the API and wait until ready

  const api = await ApiPromise.create({ provider: wsProvider });
  const blockResultList = [];
  for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
    console.log(`---------------------------------------------------`);
    console.log(`--------   BLOCK: ${blockNum} --------------`);
    const blockHash = await api.rpc.chain.getBlockHash(blockNum);

    console.log(`************************`);
    console.log(`Block Hash : ${blockHash}, `);

    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    blockResultList.push({
      block: blockNum,
      extrinsics: signedBlock.block.extrinsics.toHuman(),
    });
    console.log(signedBlock.block.extrinsics.toHuman());
  }
  return blockResultList;
}
