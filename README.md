osm2geojson-ultra
============

[![NPM Version](https://img.shields.io/npm/v/osm2geojson-ultra)](https://www.npmjs.com/package/osm2geojson-ultra)


A faster & more complete convertor for [OSM](http://openstreetmap.org) & [Overpass](https://overpass-api.de/) data in
[XML](http://wiki.openstreetmap.org/wiki/OSM_XML) or [JSON](https://wiki.openstreetmap.org/wiki/OSM_JSON) formats to
[GeoJSON](http://www.geojson.org/) - much faster (the more complex the data source is,
the more performance advantages it posesses) than osmtogeojson in most situations and faster than osm2geojson-lite -
implemented in TypeScript using [txml](https://github.com/TobiasNickel/tXml) to parse XML.

History
-----
This project was forked from [osm2geojson-lite](https://github.com/tibetty/osm2geojson-lite) to add support for more overpass geometry output types and to use a different XML parser.

### Difference with osm2geojson-lite

* Uses [txml](https://github.com/TobiasNickel/tXml) to parse XML
* Support geometry outputs from Overpass commands such as [`local`](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#The_statement_local)
    [`convert`](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#The_statement_convert), and
    [`make`](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#The_statement_make)
* Properties have a different structure (`id` and `type` are prefixed with `@` and other non-tag
  meta data such as `changeset` is within a `@meta` key)
* Only distributed as an ES Module

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
    import osm2geojson from 'https://cdn.skypack.dev/osm2geojson-ultra';
    let geojson = osm2geojson(osm, opts);
</script>
```

API
---

### `osm2geojson(osm, opts)`

Converts OSM data (XML/JSON) to GeoJSON.

* `osm`: the OSM XML data in String, or OSM/Overpass JSON as object or in String
* `opts?`: optional, the options object, right now supports below properties/fields:
    - `completeFeature`:  the default value is `false`. When it's set to `true`, the returned geojson will include all elements that meet the specified conditions in `FeatureCollection` format; otherwise, only the bare geometry of the first `relation` element will be returned.
    - `renderTagged`: the default value is `false`. When it's set to `true`, the returned geojson will include all elements with tags (i.e., tagged) until `excludeWay` changes its behavior a bit; otherwise only the unreferenced ones get returned.
    - `excludeWay`: the default value is `true`. When it's set to `true`, the returned `FeatureCollection` will exclude all referenced `way`s even though they are tagged; otherwise the features of those `way`s will be included in the resulted result as well.


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
-> 42ms was taken for 100 rounds
---processing hebei.osm---
-> 376ms was taken for 100 rounds
---processing tokyodo.osm---
-> 890ms was taken for 100 rounds
---processing usa.osm---
-> 10759ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 7ms was taken for 100 rounds
---processing hebei.json---
-> 102ms was taken for 100 rounds
---processing tokyodo.json---
-> 322ms was taken for 100 rounds
---processing usa.json---
-> 5497ms was taken for 100 rounds
```

### osm2geojson-lite
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 56ms was taken for 100 rounds
---processing hebei.osm---
-> 557ms was taken for 100 rounds
---processing tokyodo.osm---
-> 1201ms was taken for 100 rounds
---processing usa.osm---
-> 12904ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 8ms was taken for 100 rounds
---processing hebei.json---
-> 106ms was taken for 100 rounds
---processing tokyodo.json---
-> 332ms was taken for 100 rounds
---processing usa.json---
-> 5553ms was taken for 100 rounds
```

### overpasstogeojson
```
==========xml processing performance results==========
---processing zhucheng.osm---
-> 174ms was taken for 100 rounds
---processing hebei.osm---
-> 3389ms was taken for 100 rounds
---processing tokyodo.osm---
-> 4108ms was taken for 100 rounds
---processing usa.osm---
-> 39013ms was taken for 100 rounds
==========json processing performance results==========
---processing zhucheng.json---
-> 33ms was taken for 100 rounds
---processing hebei.json---
-> 2093ms was taken for 100 rounds
---processing tokyodo.json---
-> 1128ms was taken for 100 rounds
---processing usa.json---
-> 11339ms was taken for 100 rounds
```


Correctness
---
You can copy the converted results to [geojsonlint](http://geojsonlint.com) for the correctness validation.  Up until now, `osm2geojson-lite` behaves pretty well with all the samples (also quite representative) in the `data` subfolers under `test` and `bench` directories, which also outperforms `osmtogeojson`. 

The client side example shipped along with this package, `test/index.html` - due to CORS limitation, the direct post to geojsonlint is blocked, so there's a "copy to clipboard" button for you to ease the validation.

Node.JS version
---
  ES5/ES6 features
  
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

