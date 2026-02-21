import { readFileSync } from "fs";
import createLogger     from "logging";

import { createSchema, createYoga, createPubSub } from "graphql-yoga";


const logger = createLogger( "graphql" );


// Schema aus separater Datei einlesen
const schemaString = readFileSync( "src/schema.graphql", "utf8" );
logger.info( "GraphQL-Schema geladen." );


// Artikel-Daten
const alleArtikelArray = [
  {
    id: "1",
    name: "Laptop Dell XPS 13",
    beschreibung: "High-Performance Ultrabook mit Intel Core i7",
    menge: 5,
    preis: 1299.99,
    grosskundenrabatt: true
  },
  {
    id: "2",
    name: "iPhone 15 Pro",
    beschreibung: "Premium Smartphone mit A17 Pro Chip",
    menge: 12,
    preis: 999.99,
    grosskundenrabatt: true
  },
  {
    id: "3",
    name: "USB-C Kabel 2m",
    beschreibung: "Hochwertiges USB-C Kabel für schnelles Laden",
    menge: 50,
    preis: 12.99,
    grosskundenrabatt: false
  },
  {
    id: "4",
    name: "Sony WH-1000XM5",
    beschreibung: "Noise Cancelling Over-Ear Kopfhörer",
    menge: 8,
    preis: 379.99,
    grosskundenrabatt: true
  },
  {
    id: "5",
    name: "iPad Air 11",
    beschreibung: "Tablet mit M2 Chip und großem Display",
    menge: 0,
    preis: 799.99,
    grosskundenrabatt: false
  },
  {
    id: "6",
    name: "Samsung Monitor 27 Zoll",
    beschreibung: "4K Monitor mit 144Hz Refresh Rate",
    menge: 3,
    preis: 499.99,
    grosskundenrabatt: true
  },
  {
    id: "7",
    name: "LG UltraFine 32 Zoll",
    beschreibung: "4K HDR Monitor mit USB-C und 95% DCI-P3",
    menge: 4,
    preis: 749.99,
    grosskundenrabatt: true
  }
];

logger.info( `Anzahl Artikel mit Katalog: ${ alleArtikelArray.length }` );


const resolversQuery = {

  artikelAlle: () => alleArtikelArray,

  artikel: ( _, {id} ) => alleArtikelArray.find( a => a.id === id ) || null,

  artikelSuche: ( _, {query} ) => {

        const searchTerm = query.toLowerCase();
        return alleArtikelArray.filter( a =>
          a.name.toLowerCase().includes( searchTerm ) ||
          ( a.beschreibung && a.beschreibung.toLowerCase().includes( searchTerm ) )
        );
      }
};

// Hilfsfunktion: nächste numerische ID finden
const nextArtikelId = () => {

  const maxId = alleArtikelArray.reduce( (max, a) => Math.max( max, Number( a.id ) || 0 ), 0 );
  return String( maxId + 1 );
};

const pubsub = createPubSub(); // um Änderungs-Events an Subscriber zu verschicken


const resolversMutation = {

  artikelHinzufuegen: ( _, { name, beschreibung, menge, preis, grosskundenrabatt = false } ) => {

    const neueId = nextArtikelId();
    const neuesArtikelObj = {
      id: neueId,
      name,
      beschreibung: beschreibung || "",
      menge,
      preis,
      grosskundenrabatt: Boolean( grosskundenrabatt )
    };

    alleArtikelArray.push( neuesArtikelObj );
    logger.info( `Neuer Artikel hinzugefügt: ID=${ neueId }, Name="${ name }".` );

    // Unified Subscription-Event für neuen Artikel senden
    pubsub.publish( "ARTIKEL_GEAENDERT", {
      artikelGeaendert: {
        art    : "HINZUGEFUEGT",
        felder : [ "name", "beschreibung", "menge", "preis", "grosskundenrabatt" ],
        artikel: neuesArtikelObj
      }
    } );

    return neuesArtikelObj;
  },

  artikelLoeschen: ( _, { artikelId } ) => {

    const idx = alleArtikelArray.findIndex( a => a.id === artikelId );
    if ( idx === -1 ) {
      logger.warn( `Artikel mit ID=${ artikelId } nicht gefunden.` );
      return null;
    }

    const [ geloeschterArtikel ] = alleArtikelArray.splice( idx, 1 );
    logger.info( `Artikel gelöscht: ID=${ artikelId }, Name="${ geloeschterArtikel.name }".` );

    // Unified Subscription-Event für gelöschten Artikel senden
    pubsub.publish( "ARTIKEL_GEAENDERT", {
      artikelGeaendert: {
        art    : "GELOESCHT",
        felder : [],
        artikel: geloeschterArtikel
      }
    } );

    return geloeschterArtikel;
  },

  artikelAktualisieren: ( _, { artikelId, input } ) => {

    const artikel = alleArtikelArray.find( a => a.id === artikelId );
    if ( !artikel ) {

      logger.warn( `Artikel mit ID=${ artikelId } nicht gefunden.` );
      return {
        id               : artikelId,
        name             : "Nicht gefunden",
        beschreibung     : `Zu ändernder Artikel mit ID=${ artikelId } nicht gefunden.`,
        menge            : 0,
        preis            : 0,
        grosskundenrabatt: false
      };
    }

    const moeglicheFelder = [ "name", "beschreibung", "menge", "preis", "grosskundenrabatt" ];
    const geaenderteFelder = [];

    for ( const feld of moeglicheFelder ) {
      if ( Object.prototype.hasOwnProperty.call( input, feld ) ) {
        const neuerWert = input[ feld ];
        if ( artikel[ feld ] !== neuerWert ) {
          artikel[ feld ] = neuerWert;
          geaenderteFelder.push( feld );
        }
      }
    }

    if ( geaenderteFelder.length === 0 ) {
      logger.info( `Keine Änderung ausgeführt für Artikel ID=${ artikelId }.` );
      return artikel;
    }

    logger.info( `Artikel aktualisiert: ID=${ artikelId }, Felder=${ geaenderteFelder.join( "," ) }.` );

    // Unified Subscription-Event für Änderungen senden
    pubsub.publish( "ARTIKEL_GEAENDERT", {
      artikelGeaendert: {
        art    : "AKTUALISIERT",
        felder : geaenderteFelder,
        artikel: artikel
      }
    } );

    return artikel;
  }
};


const resolversSubscription = {
  artikelGeaendert: {
    subscribe: () => pubsub.subscribe( "ARTIKEL_GEAENDERT" )
  }
};


export const yoga = createYoga({
  schema: createSchema({
    typeDefs: schemaString,
    resolvers: {
      Query       : resolversQuery,
      Mutation    : resolversMutation,
      Subscription: resolversSubscription
    }
  })
});