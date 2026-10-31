osm2geojson-ultra
============

[![NPM Version](https://img.shields.io/npm/v/osm2geojson-ultra)](https://www.npmjs.com/package/osm2geojson-ultra)


A fast & complete converter for [OSM](http://openstreetmap.org) & [Overpass](https://overpass-api.de/) data in
[XML](http://wiki.openstreetmap.org/wiki/OSM_XML) or [JSON](https://wiki.openstreetmap.org/wiki/OSM_JSON) formats to
[GeoJSON](http://www.geojson.org/).

History
-----
This project was forked from [osm2geojson-lite](https://github.com/tibetty/osm2geojson-lite) to add support for more overpass geometry output types and to use a different XML parser.

### Differences with osm2geojson-lite

* Uses [txml](https://github.com/TobiasNickel/tXml) to parse XML
* Support geometry outputs from Overpass commands such as [`local`](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#The_statement_local)
    [`convert`](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#The_statement_convert), and
    [`make`](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#The_statement_make)
* Support for Overpass `out center;` output
* Properties have a different structure (`id`, `type`, and other non-tag properties are prefixed with `@`)
* Only distributed as an ES Module
* All options replaced by an `elementId` & `polygonTag` option
* Improved polygon detection for closed ways
* Revamped relation processing
* Detection and reporting of tainted objects (eg: missing way nodes or relation members)

Usage
-----

### As a Node.JS Library

Installation:

    $ npm install osm2geojson-ultra

Usage:

```js
import osm2geojson from 'osm2geojson-ultra';
let geojson = osm2geojson(osm, opts);
```

### In the Browser
```html
<script type="module">
    import osm2geojson from 'https://esm.sh/osm2geojson-ultra';
    let geojson = osm2geojson(osm, opts);
</script>
```

API
---

### `osm2geojson(osm, opts)`

Converts OSM data (XML/JSON) to GeoJSON.

* `osm`: the OSM XML data in String, or OSM/Overpass JSON as object or in String
* `opts?`: optional, the options object, right now supports below properties/fields:
    - `elementId`: the default value is `undefined`. When undefined, all tagged elements are
      returned.  When it is set to an OSM element ID in the form of type/id, eg: `"way/123"` then a
      only that feature is returned.
    - `polygonTag`: an alternate definition of tags to consider as polygons for closed ways. See
      `src/polygonTags.ts` for structure & default.


Performance
---
1. Workloads include the boundary XML and JSON of 4 administrive areas (zhucheng, hebei, tokyodo, usa)
2. Call each conversion for 100 rounds to mitigate the impacts of GC and other factors
3. For each script, run as many as times seperately and then calculate the average cost time (ACT for short)
4. The # listed in the table below are coarse lowest values of dividing the ACT of `osmtogeojson` by the one of this library
```
$ cd test
$ npm run bench
```

### osm2geojson-ultra
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 121ms was taken for 100 rounds
---processing hebei.osm---
-> 1572ms was taken for 100 rounds
---processing tokyodo.osm---
-> 3058ms was taken for 100 rounds
---processing usa.osm---
-> 38552ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 17ms was taken for 100 rounds
---processing hebei.json---
-> 528ms was taken for 100 rounds
---processing tokyodo.json---
-> 1201ms was taken for 100 rounds
---processing usa.json---
-> 20823ms was taken for 100 rounds
```

### osm2geojson-lite
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 127ms was taken for 100 rounds
---processing hebei.osm---
-> 1478ms was taken for 100 rounds
---processing tokyodo.osm---
-> 2775ms was taken for 100 rounds
---processing usa.osm---
-> 36459ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 18ms was taken for 100 rounds
---processing hebei.json---
-> 285ms was taken for 100 rounds
---processing tokyodo.json---
-> 702ms was taken for 100 rounds
---processing usa.json---
-> 19043ms was taken for 100 rounds
```

### overpasstogeojson
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 457ms was taken for 100 rounds
---processing hebei.osm---
-> 8112ms was taken for 100 rounds
---processing tokyodo.osm---
-> 12067ms was taken for 100 rounds
---processing usa.osm---
-> 94198ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 89ms was taken for 100 rounds
---processing hebei.json---
-> 3850ms was taken for 100 rounds
---processing tokyodo.json---
-> 2828ms was taken for 100 rounds
---processing usa.json---
-> 29300ms was taken for 100 rounds
```

Dependencies
---
  - [txml](https://github.com/TobiasNickel/tXml)

License
---
MIT

Collaborators
---
* [dschep](https://github.com/dschep)
#### osm2geojson-lite maintainers
* [tibetty](https://github.com/tibetty/)
* [HarelM](https://github.com/HarelM)

