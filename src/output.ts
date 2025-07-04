import { OsmObject } from "./osm-object.js";
import { strArrayToFloat } from "./utils.js";
import type { RefElements } from "./ref-elements.js";
import type { Feature, GeometryObject } from "geojson";

export class Output extends OsmObject {
    private geometry: GeometryObject | undefined;

    constructor(type: string, id: string, refElems: RefElements) {
        super(type, id, refElems);
    }

    public setGeometry(geometry: GeometryObject) {
        this.geometry = geometry;
    }

    public toFeatureArray(): Array<Feature<any, any>> {
        if (this.geometry) {
            return [{
                type: 'Feature',
                id: this.getCompositeId(),
                properties: this.getProps(),
                geometry: this.geometry,
            }];
        }
        return [];
    }
}
