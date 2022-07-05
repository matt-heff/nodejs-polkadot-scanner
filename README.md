This is a simple NodeJS application that will run on port 8087 and requires a password to be able to use the polkadot scanner.

There is no validation checking or smarts put on the fields or the results returned. This was done due to time constrains visit https://polkadot-scanner-matt-heff.netlify.app/ if you want to see some validation and sorting/pagination of results.

How to run
npm install -g ts-node
npm install "express-session"
npm install "@polkadot/api"
npm install "express"
npm install "body-parser"
npm install "dotenv"

Add a .env file with the following
PASSWORD=PICKONE
RPC_ADDRESS=wss://rpc.polkadot.io

//To run the service
ts-node server.ts
