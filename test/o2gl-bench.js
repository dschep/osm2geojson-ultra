#!/usr/bin/env node

import fs from 'fs';
import osm2geojson from '../dist/index.js';

const rounds = 100;
console.log('==========xml processing performance results==========');
const xmlFiles = ['zhucheng.osm', 'hebei.osm', 'tokyodo.osm', 'usa.osm'];
for (let file of xmlFiles) {
	const osm = fs.readFileSync(`./data/${file}`, 'utf-8');
	console.log(`---processing ${file}---`);
	const stime = new Date().getTime();
	for (let i = 0; i < rounds; i++) {
		osm2geojson(osm, {completeFeature: true});
	}
	const etime = new Date().getTime();
	console.log(`-> ${etime - stime}ms was taken for ${rounds} rounds`);
}

console.log('==========json processing performance results==========');
const jsonFiles = ['zhucheng.json', 'hebei.json', 'tokyodo.json', 'usa.json'];
for (let file of jsonFiles) {
	const osm = JSON.parse(fs.readFileSync(`./data/${file}`, 'utf-8'));
	console.log(`---processing ${file}---`);
	const stime = new Date().getTime();
	for (let i = 0; i < rounds; i++) {
		osm2geojson(osm, {completeFeature: true});
	}
	const etime = new Date().getTime();
	console.log(`-> ${etime - stime}ms was taken for ${rounds} rounds`);
}
