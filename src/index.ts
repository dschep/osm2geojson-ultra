import { parse } from "txml";
import { purgeProps } from "./utils.js";
import { LatLon, Node } from "./node.js";
import { OsmObject } from "./osm-object.js";
import { Output } from "./output.js";
import { Way } from "./way.js";
import { Relation } from "./relation.js";
import { RefElements } from "./ref-elements.js";
import type { Feature, FeatureCollection, GeometryObject } from "geojson";

interface IOptions {
  /**
   * An OSM element ID in the form of type/id, eg: way/123 to create a GeoJSON representation of.
   * If not present, all tagged objects will be converted.
   * @default undefined
   */
  elementId?: string;
  /**
   * When it's set to `true`, the returned geojson will include all elements with tags (i.e., tagged)
   * until `suppressWay` changes its behavior a bit; otherwise only the unreferenced ones get returned.
   * @default false
   */
  renderTagged?: boolean;
  /**
   * When it's set to `true`, the returned `FeatureCollection` will exclude all referenced `way`s even though they are tagged;
   * otherwise the features of those `way`s will be included in the resulted result as well.
   * @default true
   */
  excludeWay?: boolean;
}

function parseOptions(options: IOptions | undefined): {
  elementId: string;
  renderTagged: boolean;
  excludeWay: boolean;
} {
  if (!options) {
    return { elementId: undefined, renderTagged: false, excludeWay: true };
  }
  let elementId = options.elementId;
  let excludeWay = options.excludeWay === undefined || options.excludeWay;
  let renderTagged = options.renderTagged ? true : false;
  return { elementId, renderTagged, excludeWay };
}

function detectFormat(
  o: string | { [k: string]: any },
): "json" | "xml" | "json-raw" | "invalid" {
  if ((o as { [k: string]: any }).elements) {
    return "json";
  }
  if (o.indexOf("<osm") >= 0) {
    return "xml";
  }
  if (o.trim().startsWith("{")) {
    return "json-raw";
  }
  return "invalid";
}

function analyzeFeaturesFromJson(
  osm: { [k: string]: any },
  refElements: RefElements,
): void {
  for (const elem of (osm as { [k: string]: any }).elements) {
    if (elem.geometry?.type) {
      const obj = new Output(
        elem.type as string,
        elem.id as string,
        refElements,
      );
      if (elem.tags) {
        obj.addTags(elem.tags);
      }
      obj.addMetas(
        purgeProps(elem as { [k: string]: string }, [
          "id",
          "type",
          "tags",
          "geometry",
        ]),
      );
      obj.setGeometry(elem.geometry);
      continue;
    }
    switch (elem.type) {
      case "node":
        const node = new Node(elem.id as string, refElements);
        if (elem.tags) {
          node.addTags(elem.tags);
        }
        node.addMetas(
          purgeProps(elem as { [k: string]: string }, [
            "id",
            "type",
            "tags",
            "lat",
            "lon",
          ]),
        );
        node.setLatLng(elem);
        break;
      case "way":
        const way = new Way(elem.id as string, refElements);
        if (elem.tags) {
          way.addTags(elem.tags);
        }
        way.addMetas(
          purgeProps(elem as { [k: string]: string }, [
            "id",
            "type",
            "tags",
            "nodes",
            "geometry",
          ]),
        );
        if (elem.geometry) {
          way.setLatLngArray(elem.geometry);
        } else if (elem.center) {
          way.setCenter(elem.center as LatLon);
        } else if (elem.nodes) {
          for (const n of elem.nodes) {
            way.addNodeRef(n);
          }
        }
        break;
      case "relation":
        const relation = new Relation(elem.id as string, refElements);
        if (elem.bounds) {
          relation.setBounds([
            parseFloat(elem.bounds.minlon),
            parseFloat(elem.bounds.minlat),
            parseFloat(elem.bounds.maxlon),
            parseFloat(elem.bounds.maxlat),
          ]);
        }
        if (elem.tags) {
          relation.addTags(elem.tags);
        }
        if (elem.center) {
          relation.setCenter(elem.center as LatLon);
        }
        relation.addMetas(
          purgeProps(elem as { [k: string]: string }, [
            "id",
            "type",
            "tags",
            "bounds",
            "members",
          ]),
        );
        if (elem.members) {
          for (const member of elem.members) {
            relation.addMember(member);
          }
        }
      default:
        break;
    }
  }
}

function setTagsFromXML(elNode: any, obj: OsmObject) {
  for (const elChild of elNode.children) {
    if (elChild.tagName === "tag") {
      obj.addTag(elChild.attributes.k, elChild.attributes.v);
    }
  }
}

function analyzeFeaturesFromXml(osm: string, refElements: RefElements): void {
  const parsed = parse(osm, { noChildNodes: [] });

  for (const rootNode of parsed) {
    for (const elNode of rootNode.children) {
      if (
        elNode.children.find((c: any) =>
          ["point", "vertex", "linestring", "group"].includes(c.tagName),
        )
      ) {
        // TODO: other derived output geoms
        const obj = new Output(
          elNode.tagName as string,
          elNode.attributes.id as string,
          refElements,
        );
        obj.addMetas(
          purgeProps(elNode.attributes as { [k: string]: string }, [
            "id",
            "type",
            "tags",
            "geometry",
          ]),
        );
        setTagsFromXML(elNode, obj);
        const coordinates = [];
        const geometries: GeometryObject[] = [];
        for (const elChild of elNode.children) {
          switch (elChild.tagName) {
            case "point":
              obj.setGeometry({
                type: "Point",
                coordinates: [
                  parseFloat(elChild.attributes.lon),
                  parseFloat(elChild.attributes.lat),
                ],
              });
              break;
            case "vertex":
              coordinates.push([
                parseFloat(elChild.attributes.lon),
                parseFloat(elChild.attributes.lat),
              ]);
              break;
            case "linestring":
              const ring = [];
              for (const vertex of elChild.children) {
                ring.push([
                  parseFloat(vertex.attributes.lon),
                  parseFloat(vertex.attributes.lat),
                ]);
              }
              obj.setGeometry({ type: "Polygon", coordinates: [ring] });
              break;
            case "group":
              const groupCoords = [];
              for (const groupChild of elChild.children) {
                switch (groupChild.tagName) {
                  case "point":
                    geometries.push({
                      type: "Point",
                      coordinates: [
                        parseFloat(groupChild.attributes.lon),
                        parseFloat(groupChild.attributes.lat),
                      ],
                    });
                    break;
                  case "vertex":
                    groupCoords.push([
                      parseFloat(groupChild.attributes.lon),
                      parseFloat(groupChild.attributes.lat),
                    ]);
                    break;
                }
              }
              if (groupCoords.length > 0) {
                geometries.push({
                  type: "LineString",
                  coordinates: groupCoords,
                });
              }
              break;
          }
        }
        if (coordinates.length > 0) {
          obj.setGeometry({ type: "LineString", coordinates });
        } else if (geometries.length > 0) {
          obj.setGeometry({ type: "GeometryCollection", geometries });
        }
        continue;
      }
      switch (elNode.tagName) {
        case "node":
          const nd = new Node(elNode.attributes.id, refElements);
          nd.addMetas(
            purgeProps(elNode.attributes as { [k: string]: string }, [
              "id",
              "lon",
              "lat",
            ]),
          );
          setTagsFromXML(elNode, nd);
          nd.setLatLng(elNode.attributes as LatLon);
          break;
        case "way":
          const way = new Way(elNode.attributes.id, refElements);
          way.addMetas(
            purgeProps(elNode.attributes as { [k: string]: string }, [
              "id",
              "type",
            ]),
          );
          setTagsFromXML(elNode, way);
          for (const elChild of elNode.children) {
            if (elChild.tagName === "center") {
              way.setCenter(elChild.attributes as LatLon);
            } else if (elChild.tagName === "nd") {
              if (elChild.attributes.lon && elChild.attributes.lat) {
                way.addLatLng(elChild.attributes as LatLon);
              } else {
                way.addNodeRef(elChild.attributes.ref);
              }
            }
          }
          break;
        case "relation":
          const rel = new Relation(elNode.attributes.id, refElements);
          setTagsFromXML(elNode, rel);
          for (const elChild of elNode.children) {
            if (elChild.tagName === "center") {
              rel.setCenter(elChild.attributes as LatLon);
            } else if (elChild.tagName === "member") {
              const member: { [k: string]: any } = {
                type: elChild.attributes.type,
                role: elChild.attributes.role || "",
                ref: elChild.attributes.ref,
              };
              if (
                elChild.attributes.type === "node" &&
                elChild.attributes.lon &&
                elChild.attributes.lat
              ) {
                member.lon = elChild.attributes.lon;
                member.lat = elChild.attributes.lat;
                member.tags = {};
                for (const [k, v] of Object.entries(elChild.attributes)) {
                  if (
                    !k.startsWith("$") &&
                    ["type", "lat", "lon"].indexOf(k) < 0
                  ) {
                    member[k] = v;
                  }
                }
              } else {
                const geometry: any[] = [];
                const nodes: any[] = [];
                for (const memChild of elChild.children) {
                  if (memChild.attributes.lon && memChild.attributes.lat) {
                    geometry.push(memChild.attributes as LatLon);
                  } else if (memChild.attributes.ref) {
                    nodes.push(memChild.attributes.ref);
                  }
                }
                if (geometry.length > 0) {
                  member.geometry = geometry;
                } else if (nodes.length > 0) {
                  member.nodes = nodes;
                }
              }
              rel.addMember(member);
            }
            if (elChild.tagName === "bounds") {
              rel.setBounds([
                parseFloat(elChild.attributes.minlon),
                parseFloat(elChild.attributes.minlat),
                parseFloat(elChild.attributes.maxlon),
                parseFloat(elChild.attributes.maxlat),
              ]);
            }
          }
          break;
      }
    }
  }
}

function osm2geojson(
  osm: string | { [k: string]: any },
  opts?: IOptions,
): FeatureCollection<GeometryObject> {
  let { elementId, renderTagged, excludeWay } = parseOptions(opts);

  let format = detectFormat(osm);

  const refElements = new RefElements();
  let featureArray: Feature<any, any>[] = [];

  if (format === "json-raw") {
    osm = JSON.parse(osm as string) as { [k: string]: any };
    if ((osm as { [k: string]: any }).elements) {
      format = "json";
    } else {
      format = "invalid";
    }
  }

  if (format === "json") {
    analyzeFeaturesFromJson(osm as { [k: string]: any }, refElements);
  } else if (format === "xml") {
    analyzeFeaturesFromXml(osm as string, refElements);
  }

  refElements.bindAll();

  if (elementId) {
    const features = refElements[elementId].toFeatureArray();
    featureArray = featureArray.concat(features);
  } else {
    for (const v of refElements.values()) {
      if (
        v.refCount > 0 &&
        (!v.hasTag || !renderTagged || (v instanceof Way && excludeWay))
      ) {
        continue;
      }
      const features = v.toFeatureArray();
      featureArray = featureArray.concat(features);
    }
  }

  return { type: "FeatureCollection", features: featureArray };
}

export default osm2geojson;
