import { readFileSync }             from "fs";
import createLogger                 from "logging";
import { createSchema, createYoga } from "graphql-yoga";
import { createPubSub }             from "graphql-yoga";

const logger = createLogger( "graphql" );
const pubsub = createPubSub();


// Schema aus separater Datei einlesen
const schemaString = readFileSync( "src/schema.graphql", "utf8" );
logger.info( "GraphQL-Schema geladen." );


// Warengruppen-Daten
const alleWarengruppenArray = [
  {
    id: "1",
    name: "Elektronik",
    beschreibung: "Computer, Laptops und Zubehör"
  },
  {
    id: "2",
    name: "Mobil",
    beschreibung: "Smartphones und Tablets"
  },
  {
    id: "3",
    name: "Zubehör",
    beschreibung: "Kabel, Adapter und Zubehör"
  },
  {
    id: "4",
    name: "Audio",
    beschreibung: "Kopfhörer und Lautsprecher"
  }
];

logger.info( `Es sind ${ alleWarengruppenArray.length } Warengruppen vorhanden.` );


// Artikel-Daten
const alleArtikelArray = [
  {
    id: "1",
    name: "Laptop Dell XPS 13",
    beschreibung: "High-Performance Ultrabook mit Intel Core i7",
    warengruppeId: "1",
    menge: 5,
    preis: 1299.99,
    grosskundenrabatt: true
  },
  {
    id: "2",
    name: "iPhone 15 Pro",
    beschreibung: "Premium Smartphone mit A17 Pro Chip",
    warengruppeId: "2",
    menge: 12,
    preis: 999.99,
    grosskundenrabatt: true
  },
  {
    id: "3",
    name: "USB-C Kabel 2m",
    beschreibung: "Hochwertiges USB-C Kabel für schnelles Laden",
    warengruppeId: "3",
    menge: 50,
    preis: 12.99,
    grosskundenrabatt: false
  },
  {
    id: "4",
    name: "Sony WH-1000XM5",
    beschreibung: "Noise Cancelling Over-Ear Kopfhörer",
    warengruppeId: "4",
    menge: 8,
    preis: 379.99,
    grosskundenrabatt: true
  },
  {
    id: "5",
    name: "iPad Air 11",
    beschreibung: "Tablet mit M2 Chip und großem Display",
    warengruppeId: "2",
    menge: 0,
    preis: 799.99,
    grosskundenrabatt: false
  },
  {
    id: "6",
    name: "Samsung Monitor 27 Zoll",
    beschreibung: "4K Monitor mit 144Hz Refresh Rate",
    warengruppeId: "1",
    menge: 3,
    preis: 499.99,
    grosskundenrabatt: true
  }
];

logger.info( `Es sind ${ alleArtikelArray.length } Artikel im Katalog.` );


const resolversQuery = {

      artikel: () => alleArtikelArray.map( artikel => ({
        ...artikel,
        warengruppe: alleWarengruppenArray.find( wg => wg.id === artikel.warengruppeId )
      })),

      artikel: ( _, {id} ) => {
        const artikel = alleArtikelArray.find( a => a.id === id );
        if ( !artikel ) return null;
        return {
          ...artikel,
          warengruppe: alleWarengruppenArray.find( wg => wg.id === artikel.warengruppeId )
        };
      },

      artikelSuche: ( _, {query} ) => {
        const searchTerm = query.toLowerCase();
        return alleArtikelArray
          .filter( a => 
            a.name.toLowerCase().includes( searchTerm ) || 
            (a.beschreibung && a.beschreibung.toLowerCase().includes( searchTerm ))
          )
          .map( artikel => ({
            ...artikel,
            warengruppe: alleWarengruppenArray.find( wg => wg.id === artikel.warengruppeId )
          }));
      },

      warengruppen: () => alleWarengruppenArray,

      warengruppe: ( _, {id} ) => {
        logger.info( `Abfrage für Warengruppe mit ID=${ id }.` );
        return alleWarengruppenArray.find( wg => wg.id === id );
      }
};

/*
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
*/

/*
const resolversSubscription = {

      buchHinzugefuegt: {
        subscribe: () => pubsub.subscribe( "BUCH_HINZUGEFUEGT" )
      }
};
*/

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: schemaString,
    resolvers: {
      Query       : resolversQuery /*,
      Mutation    : resolversMutation,
      Subscription: resolversSubscription
      */
    }
  })
});