import { readFileSync }             from "fs";
import createLogger                 from "logging";
import { createSchema, createYoga } from "graphql-yoga";
import { createPubSub }             from "graphql-yoga";

const logger = createLogger( "graphql" );
const pubsub = createPubSub();


// Schema aus separater Datei einlesen
const schemaString  = readFileSync( "src/schema.graphql", "utf8" );
logger.info( "GraphQL-Schema geladen." );


const alleBuecherArray = [
    {
        id   : "1",
        titel: "Der Herr der Ringe",
        autor: "J.R.R. Tolkien",
        jahr : 1954,
        genre: "Fantasy"
    },{
        id   : "2",
        titel: "James Bond: Casino Royale",
        autor: "Ian Fleming",
        jahr : 1953,
        genre: "Thriller"
    }, {
        id   : "3",
        titel: "1984",
        autor: "George Orwell",
        jahr : 1949,
        genre: "Dystopie"
    }, {
        id   : "4",
        titel: "Der kleine Prinz",
        autor: "Antoine de Saint-Exupéry",
        jahr : 1943,
        genre: "Märchen"
    }, {
        id   : "5",
        titel: "A Game of Thrones",
        autor: "George R. R. Martin",
        jahr : 1996,
        genre: "Fantasy"
    }
];

logger.info( `Es sind ${ alleBuecherArray.length } Bücher im Katalog.` );


const resolversQuery = {

      buecher: () => alleBuecherArray,

      buch: ( _, {id} ) => {

        logger.info( `Abfrage für Buch mit ID=${ id }.` );
        return alleBuecherArray.find( buch => buch.id == id );        
      }
};

const resolversMutation = {

      buchHinzufuegen: ( _, { titel, autor, jahr, genre } ) => {

        const neueId = String( alleBuecherArray.length + 1 );
        const neuesBuch = {
          id: neueId,
          titel,
          autor,
          jahr,
          genre
        };

        alleBuecherArray.push( neuesBuch );
        logger.info( `Neues Buch hinzugefügt: ID=${ neueId }, Titel="${ titel }".` );

        // Event für Subscription publishen
        pubsub.publish( "BUCH_HINZUGEFUEGT", { buchHinzugefuegt: neuesBuch } );

        return neuesBuch;
      }
};

const resolversSubscription = {

      buchHinzugefuegt: {
        subscribe: () => pubsub.subscribe( "BUCH_HINZUGEFUEGT" )
      }
};

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: schemaString,
    resolvers: {
      Query: resolversQuery,
      Mutation: resolversMutation,
      Subscription: resolversSubscription
    }
  })
});