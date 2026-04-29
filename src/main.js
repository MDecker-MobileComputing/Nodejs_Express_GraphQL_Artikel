import express      from "express";
import createLogger from "logging";

import { yoga } from "./graphql.js";

const logger = createLogger( "main" );

const PORT_NUMMER = 8080;


const expressObjekt = express()

// Yoga als Handler für /graphql verwenden (inkl. GraphiQL UI)
expressObjekt.use( "/graphql", yoga );

expressObjekt.use( express.static( "public" ) );

expressObjekt.listen( PORT_NUMMER, () => {
  logger.info( `Server läuft auf http://localhost:${ PORT_NUMMER }` );
});
