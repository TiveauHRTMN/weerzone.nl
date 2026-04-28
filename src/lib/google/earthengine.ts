// @ts-ignore - Officiële Types voor Earth Engine missen vaak, dit voorkomt tsc errors
import ee from '@google/earthengine';

// Om dit in productie te gebruiken heb je een Service Account (JSON) nodig 
// dat is toegevoegd aan je Google Cloud / Earth Engine project.
export async function initializeEarthEngine(privateKey: string) {
  return new Promise((resolve, reject) => {
    console.log("Authenticating Earth Engine...");
    
    // Auth gebeurt meestal server-side via een Service Account token
    ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        ee.initialize(
          null, 
          null, 
          () => {
            console.log("Google Earth Engine initialized successfully.");
            resolve(true);
          }, 
          (err: any) => {
            console.error("Earth Engine initialization failed:", err);
            reject(err);
          }
        );
      },
      (err: any) => {
        console.error("Earth Engine Auth failed:", err);
        reject(err);
      }
    );
  });
}

/**
 * Voorbeeld: Haal historische P90 neerslag op voor Reed's kalibratie
 * Dit wordt async geëvalueerd in de Google Cloud.
 */
export async function getHistoricalP90Rainfall(lat: number, lon: number) {
  const point = ee.Geometry.Point([lon, lat]);
  // CHIRPS is een beroemde daily precipitation dataset in Earth Engine
  const dataset = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterDate('2010-01-01', '2023-12-31')
    .select('precipitation');

  // We kunnen ingewikkelde percentiel-berekeningen in C++ laten doen door Google
  const p90 = dataset.reduce(ee.Reducer.percentile([90]));
  const value = p90.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: point,
    scale: 5000,
  });

  return new Promise((resolve, reject) => {
    value.evaluate((result: any, err: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
