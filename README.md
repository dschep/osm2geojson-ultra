osm2geojson-ultra
============

[![NPM Version](https://img.shields.io/npm/v/osm2geojson-ultra)](https://www.npmjs.com/package/osm2geojson-ultra)


A faster & more complete convertor for [OSM](http://openstreetmap.org) & [Overpass](https://overpass-api.de/) data in
[XML](http://wiki.openstreetmap.org/wiki/OSM_XML) or [JSON](https://wiki.openstreetmap.org/wiki/OSM_JSON) formats to
[GeoJSON](http://www.geojson.org/) - much faster (the more complex the data source is,
the more performance advantages it posesses) than osmtogeojson in most situations and slightly faster than osm2geojson-lite when parsing XML -
implemented in TypeScript using [txml](https://github.com/TobiasNickel/tXml) to parse XML.

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
* All options replaced by an `elementId` option

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
-> 41ms was taken for 100 rounds
---processing hebei.osm---
-> 372ms was taken for 100 rounds
---processing tokyodo.osm---
-> 882ms was taken for 100 rounds
---processing usa.osm---
-> 10778ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 8ms was taken for 100 rounds
---processing hebei.json---
-> 105ms was taken for 100 rounds
---processing tokyodo.json---
-> 322ms was taken for 100 rounds
---processing usa.json---
-> 5464ms was taken for 100 rounds
```

### osm2geojson-lite
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 55ms was taken for 100 rounds
---processing hebei.osm---
-> 554ms was taken for 100 rounds
---processing tokyodo.osm---
-> 1188ms was taken for 100 rounds
---processing usa.osm---
-> 12770ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 7ms was taken for 100 rounds
---processing hebei.json---
-> 104ms was taken for 100 rounds
---processing tokyodo.json---
-> 320ms was taken for 100 rounds
---processing usa.json---
-> 5554ms was taken for 100 rounds
```

### overpasstogeojson
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 179ms was taken for 100 rounds
---processing hebei.osm---
-> 3488ms was taken for 100 rounds
---processing tokyodo.osm---
-> 4255ms was taken for 100 rounds
---processing usa.osm---
-> 39755ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 34ms was taken for 100 rounds
---processing hebei.json---
-> 2086ms was taken for 100 rounds
---processing tokyodo.json---
-> 1040ms was taken for 100 rounds
---processing usa.json---
-> 11273ms was taken for 100 rounds
```


Correctness
---
You can copy the converted results to [geojsonlint](http://geojsonlint.com) for the correctness validation.  Up until now, `osm2geojson-lite` behaves pretty well with all the samples (also quite representative) in the `data` subfolers under `test` and `bench` directories, which also outperforms `osmtogeojson`. 

The client side example shipped along with this package, `index.html` - due to CORS limitation, the direct post to geojsonlint is blocked, so there's a "copy to clipboard" button for you to ease the validation.

JS version
---
  ES 2019
  
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

