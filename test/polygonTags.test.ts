import fs from 'fs';
import osm2geojson from '../src/index';
import { describe, it, expect } from 'vitest';
import { parse } from "txml";

describe('polygonTags', () => {
  it('should return a linestring for a dh piste when overriding polygonTags', () => {
    let osm = JSON.parse(fs.readFileSync(`./test/data/closed-dh-piste.json`, 'utf-8'));
    let geojson = osm2geojson(osm, { polygonTags: {} });
    const outputFile = `./test/expected/closed-dh-piste-line.json.geojson`;
    if (!fs.existsSync(outputFile)) {
      fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2));
    } else {
      let expectedGeojson = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      expect(geojson).toEqual(expectedGeojson);
    }
  });
});
