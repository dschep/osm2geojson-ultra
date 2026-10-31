import { OsmObject } from "./osm-object.js";
import { Way } from "./way.js";
import { Node, LatLon } from "./node.js";
import { WayCollection } from "./way-collection.js";
import { LateBinder } from "./late-binder.js";
import { first, pointInsidePolygon, strArrayToFloat } from "./utils.js";
import type { RefElements } from "./ref-elements.js";
import type {
  BBox,
  Feature,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  GeometryObject,
} from "geojson";

export class Relation extends OsmObject {
  private relations: (LateBinder<Relation> | Relation)[] = [];
  private nodes: (LateBinder<Node> | Node)[] = [];
  private bounds: number[] | undefined = undefined;
  private center: null | LatLon = null;
  public ways: (LateBinder<Way> | Way)[] = [];
  private members: Array<{ [k: string]: any }> = [];

  constructor(id: string, refElems: RefElements) {
    super("relation", id, refElems);
  }

  public setBounds(bounds: any[]) {
    this.bounds = bounds;
  }

  public setCenter(center: LatLon) {
    this.center = center;
  }

  public addMember(member: { [k: string]: any }) {
    this.members.push(member);
    switch (member.type) {
      // super relation, need to do combination
      case "relation":
        let binder = new LateBinder(
          this.relations,
          (id: string) => {
            const relation = this.refElems.get(`relation/${id}`) as Relation;
            if (relation) {
              relation.refCount++;
              return relation;
            }
          },
          this,
          [member.ref],
        );
        this.relations.push(binder);
        this.refElems.addBinder(binder);
        break;

      case "way":
        if (member.geometry) {
          const way = new Way(member.ref, undefined as unknown as RefElements, undefined);
          way.setLatLngArray(member.geometry);
          way.refCount++;
          this.ways.push(way);
        } else if (member.nodes) {
          const way = new Way(member.ref, this.refElems, undefined);
          for (const nid of member.nodes) {
            way.addNodeRef(nid);
          }
          way.refCount++;
          this.ways.push(way);
        } else {
          let binder = new LateBinder(
            this.ways,
            (wid) => {
              const way = this.refElems.get(`way/${wid}`) as Way;
              if (way) {
                way.refCount++;
                return way;
              }
            },
            this,
            [member.ref],
          );
          this.ways.push(binder);
          this.refElems.addBinder(binder);
        }
        break;

      case "node":
        let node: Node | null = null;
        if (member.lat && member.lon) {
          node = new Node(member.ref, undefined as unknown as RefElements);
          node.setLatLng({ lon: member.lon, lat: member.lat });
          // vvv Is this stuff necessary? vvv
          if (member.tags) {
            node.addTags(member.tags);
          }
          for (const [k, v] of Object.entries(member)) {
            if (["id", "type", "lat", "lon"].indexOf(k) < 0) {
              node.addMeta(k, v);
            }
          }

          node.refCount++;
          this.nodes.push(node);
        } else {
          let binder = new LateBinder(
            this.nodes,
            (id) => {
              const nn = this.refElems.get(`node/${id}`) as Node;
              if (nn) {
                nn.refCount++;
                return nn;
              }
            },
            this,
            [member.ref],
          );
          this.nodes.push(binder);
          this.refElems.addBinder(binder);
        }
        break;
    }
  }

  private constructStringGeometry(ws: WayCollection): MultiLineString | null {
    const strings = ws ? ws.mergeWays() : [];
    if (strings.length === 0) {
      return null;
    }

    return {
      type: "MultiLineString",
      coordinates: strings,
    };
  }

  private constructPolygonGeometry(
    ows: WayCollection,
    iws: WayCollection,
  ): Polygon | MultiPolygon | null {
    const outerRings = ows ? ows.toRings("counterclockwise") : [];
    const innerRings = iws ? iws.toRings("clockwise") : [];

    if (outerRings.length > 0) {
      const compositPolyons: any[] = [];

      let ring: number[][] | undefined;
      for (ring of outerRings) {
        compositPolyons.push([ring]);
      }

      // link inner polygons to outer containers
      ring = innerRings.shift();
      while (ring) {
        for (const idx in outerRings) {
          if (pointInsidePolygon(first(ring), outerRings[idx])) {
            compositPolyons[idx].push(ring);
            break;
          }
        }
        ring = innerRings.shift();
      }

      // construct the Polygon/MultiPolygon geometry
      if (compositPolyons.length === 1) {
        return {
          type: "Polygon",
          coordinates: compositPolyons[0],
        };
      }

      return {
        type: "MultiPolygon",
        coordinates: compositPolyons,
      };
    }

    return null;
  }

  public toFeature(): Feature | undefined {
    const geometries: Array<GeometryObject> = [];
    const polygonFeatures: Array<Feature<Polygon | MultiPolygon, any>> = [];
    const stringFeatures: Array<Feature<LineString | MultiLineString, any>> =
      [];
    let pointFeatures: Array<Feature<Point | MultiPoint, any>> = [];
    let tainted = false;
    const membersAccountedFor: Array<string> = [];

    const feature: Feature<any, any> = {
      type: "Feature",
      id: this.getCompositeId(),
      bbox: this.bounds as BBox,
      properties: this.getProps(),
      geometry: null,
    };

    if (!this.bounds) {
      delete feature.bbox;
    }

    if (this.members.some(({ role }) => role === "outer")) {
      const outerWayCollection = new WayCollection();
      const innerWayCollection = new WayCollection();
      for (const { type, ref, role } of this.members) {
        if (type === "way" && ["inner", "outer"].includes(role)) {
          const wid = `way/${ref}`;
          membersAccountedFor.push(wid);
          const way = this.ways.find(
            (way) => (way as Way).getCompositeId() === wid,
          );
          if (way) {
            if (role === "outer") {
              outerWayCollection.addWay(way as Way);
            } else if (role === "inner") {
              innerWayCollection.addWay(way as Way);
            }
          } else {
            tainted = true;
          }
        }
      }
      let geometry = this.constructPolygonGeometry(
        outerWayCollection,
        innerWayCollection,
      );
      if (geometry) {
        geometries.push(geometry);
      }
    } else if (
      ["multilinestring", "route", "waterway"].includes(this.tags.type)
    ) {
      const wayCollection = new WayCollection();
      for (const { type, ref, role } of this.members) {
        if (type === "way") {
          const wid = `way/${ref}`;
          membersAccountedFor.push(wid);
          const way = this.ways.find(
            (way) => (way as Way).getCompositeId() === wid,
          );
          if (way) {
            wayCollection.addWay(way as Way);
          } else {
            tainted = true;
          }
        }
      }
      let geometry = this.constructStringGeometry(wayCollection);
      if (geometry) {
        geometries.push(geometry);
      }
    }

    for (const { type, ref, role } of this.members) {
      const mid = `${type}/${ref}`;
      if (membersAccountedFor.includes(mid)) continue;
      let obj;
      switch (type) {
        case "node":
          obj = this.nodes.find(
            (node) => (node as Node).getCompositeId() === mid,
          );
          break;
        case "way":
          obj = this.ways.find((way) => (way as Way).getCompositeId() === mid);
          break;
        case "relation":
          obj = this.relations.find(
            (relation) => (relation as Relation).getCompositeId() === mid,
          );
          break;
      }
      if (obj) {
        const feature = (obj as OsmObject).toFeature();
        if (feature?.geometry) {
          geometries.push(feature.geometry);
        }
      } else {
        tainted = true;
      }
    }

    if (this.center !== null) {
      geometries.push({
        type: "Point",
        coordinates: strArrayToFloat([this.center.lon, this.center.lat]),
      });
    }

    if (tainted) {
      feature.properties["@tainted"] = tainted;
    }

    if (geometries.length === 1) {
      feature.geometry = geometries[0];
    } else {
      feature.geometry = { type: "GeometryCollection", geometries };
    }
    return feature;
  }
}
