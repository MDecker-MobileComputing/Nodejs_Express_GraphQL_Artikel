import express      from "express";
import createLogger from "logging";

import { yoga } from "./graphql.js";

const logger = createLogger( "main" );

const PORT_NUMMER = 8080;


const app = express()

// Yoga als Handler für /graphql verwenden (inkl. GraphiQL UI)
app.use( "/graphql", yoga );

app.use( express.static( "public" ) );

app.listen( PORT_NUMMER, () => {
  logger.info( `Server läuft auf http://localhost:${ PORT_NUMMER }` );
});
