osm2geojson-lite
============

[![NPM Version](https://img.shields.io/npm/v/osm2geojson-lite)](https://www.npmjs.com/package/osm2geojson-lite) [![Codecov](https://img.shields.io/codecov/c/github/tibetty/osm2geojson-lite/main.svg)](https://codecov.io/gh/tibetty/osm2geojson-lite/)


A lightweight (not as lightweight as xml2geojson though) yet faster convertor for [OSM](http://openstreetmap.org) [data](http://wiki.openstreetmap.org/wiki/OSM_XML) whatever in XML or JSON formats to [GeoJSON](http://www.geojson.org/) - much faster (the more complex the data source is, the more performance advantages it posesses) than osmtogeojson in most situations - implemented in pure JavaScript without any 3rd party dependency.

History
-----
An internal function inside [query-geo-boundary](https://www.npmjs.com/package/query-geo-boundary) &rightarrow; stripped out to handle OSM XML only [xml2geojson-lite](https://www.npmjs.com/package/xml2geojson-lite) &rightarrow; this library that supports both OSM XML and OSM/Overpass JSON

Usage
-----

### As a Node.JS Library

Installation:

    $ npm install osm2geojson-lite

Usage:

```js
    import osm2geojson from 'osm2geojson-lite';
    let geojson = osm2geojson(osm, opts);
```

### In the Browser
```html
    <script src='your/path/to/osm2geojson-lite.js'/>
```
```js
    let geojson = osm2geojson(osm, opts);
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
1. XML
   
| zhucheng  | hebei    | tokyodo | usa  |
|-----------|----------|---------|------|
| >2.5x     | >4.0x    | >3.0x   | >3.0x|

2. Overpass JSON
   
| zhucheng  | hebei    | tokyodo | usa  |
|-----------|----------|---------|------|
| >2.5x     | >11.0x   | >7.0x   | >5.0x|


Correctness
---
You can copy the converted results to [geojsonlint](http://geojsonlint.com) for the correctness validation.  Up until now, `osm2geojson-lite` behaves pretty well with all the samples (also quite representative) in the `data` subfolers under `test` and `bench` directories, which also outperforms `osmtogeojson`. 

The client side example shipped along with this package, `test/index.html` - due to CORS limitation, the direct post to geojsonlint is blocked, so there's a "copy to clipboard" button for you to ease the validation.

Node.JS version
---
  ES5/ES6 features
  
Dependencies
---
  - No 3rd party dependency

License
---
MIT

Collaborators
---
* [tibetty](https://github.com/tibetty/)
* [HarelM](https://github.com/HarelM)

