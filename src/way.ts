import { Feature } from "geojson";
import { OsmObject } from "./osm-object.js";
import { LatLon, Node } from "./node.js";
import { LateBinder } from "./late-binder.js";
import {
  isRing,
  ringDirection,
  strArrayToFloat,
  strArrayArrayToFloat,
} from "./utils.js";
import { defaultPolygonTags, type polygonTags } from "./polygonTags.js";
import type { RefElements } from "./ref-elements.js";

export class Way extends OsmObject {
  private latLngArray: Array<LatLon | LateBinder<LatLon>>;
  private center: null | LatLon;
  private tainted: boolean = false;
  private polygonTags: polygonTags = defaultPolygonTags;

  constructor(id: string, refElems: RefElements, polygonTagOverrides: polygonTags | undefined) {
    super("way", id, refElems);
    this.latLngArray = [];
    this.center = null;
    if (polygonTagOverrides !== undefined) {
      this.polygonTags = polygonTagOverrides;
    }
  }

  public addLatLng(latLng: LatLon) {
    this.latLngArray.push(latLng);
  }

  public setCenter(center: LatLon) {
    this.center = center;
  }

  public setLatLngArray(latLngArray: Array<LatLon & { [k: string]: any }>) {
    this.latLngArray = latLngArray;
  }

  public addNodeRef(ref: string) {
    const binder = new LateBinder(
      this.latLngArray,
      (id: string) => {
        const node = this.refElems.get(`node/${id}`) as Node;
        if (node) {
          node.refCount++;
          return node.getLatLng();
        } else {
          this.tainted = true;
        }
      },
      this,
      [ref],
    );

    this.latLngArray.push(binder);
    this.refElems.addBinder(binder);
  }

  public addTags(tags: { [k: string]: string }) {
    super.addTags(tags);
  }

  public addTag(k: string, v: string) {
    super.addTag(k, v);
  }

  public toCoordsArray(): string[][] {
    return (this.latLngArray as Array<LatLon>).map((latLng) => [
      latLng.lon,
      latLng.lat,
    ]);
  }

  public toFeature(): Feature | undefined {
    let coordsArrayString = this.toCoordsArray();
    if (coordsArrayString.length > 1) {
      const coordsArray = strArrayArrayToFloat(coordsArrayString);
      const feature: Feature<any, any> = {
        type: "Feature",
        id: this.getCompositeId(),
        properties: this.getProps(),
        geometry: {
          type: "LineString",
          coordinates: coordsArray,
        },
      };
      if (this.tainted) {
        feature.properties["@tainted"] = this.tainted;
      }

      if (this.isPolygon && isRing(coordsArray)) {
        if (ringDirection(coordsArray) !== "counterclockwise") {
          coordsArray.reverse();
        }

        feature.geometry = {
          type: "Polygon",
          coordinates: [coordsArray],
        };
        if (this.tainted) {
          feature.properties["@tainted"] = this.tainted;
        }

        return feature;
      }

      return feature;
    } else if (this.center !== null) {
      const feature: Feature<any, any> = {
        type: "Feature",
        id: this.getCompositeId(),
        properties: this.getProps(),
        geometry: {
          type: "Point",
          coordinates: strArrayToFloat([this.center.lon, this.center.lat]),
        },
      };
      if (this.tainted) {
        feature.properties["@tainted"] = this.tainted;
      }
      return feature;
    }
  }

  get isPolygon() {
    let isPolygon = false;
    for (const [key, o] of Object.entries(this.polygonTags)) {
      const v = this.tags[key];
      if (v && o) {
        if (o.ignore?.includes(v)) {
          continue;
        }
        isPolygon = true;
        if (o.include) {
          isPolygon = o.include.includes(v);
        } else if (o.exclude) {
          isPolygon = !o.exclude.includes(v);
        }
      }
    }
    return isPolygon;
  }
}
