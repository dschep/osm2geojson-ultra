import { parse, isElementNode, type TNode } from "txml";
import { purgeProps } from "./utils.js";
import { LatLon, Node } from "./node.js";
import { OsmObject } from "./osm-object.js";
import { Output } from "./output.js";
import { Way } from "./way.js";
import { Relation } from "./relation.js";
import { RefElements } from "./ref-elements.js";
import type { GeometryObject } from "geojson";

function setTagsFromXML(elNode: TNode, obj: OsmObject) {
  for (const elChild of elNode.children) {
    if (isElementNode(elChild) && elChild.tagName === "tag") {
      const { k, v } = elChild.attributes;
      if (k && v != null) {
        obj.addTag(k, v);
      }
    }
  }
}

export default function analyzeFeaturesFromXml(
  osm: string,
  refElements: RefElements,
): void {
  const parsed = parse(osm, { selfClosingTags: [] });

  for (const rootNode of parsed) {
    if (!isElementNode(rootNode) || rootNode.tagName !== "osm") continue;
    for (const elNode of rootNode.children) {
      if (!isElementNode(elNode)) continue;
      // Check children for evidence this is a derived element and process if so
      if (
        elNode.children.find(
          (c) =>
            isElementNode(c) &&
            ["point", "vertex", "linestring", "group"].includes(c.tagName),
        )
      ) {
        // TODO: other derived output geoms?
        const obj = new Output(
          elNode.tagName,
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
        const coordinates: [number, number][] = [];
        const geometries: GeometryObject[] = [];
        for (const elChild of elNode.children) {
          if (!isElementNode(elChild)) continue;
          switch (elChild.tagName) {
            case "point":
              obj.setGeometry({
                type: "Point",
                coordinates: [
                  parseFloat(elChild.attributes.lon!),
                  parseFloat(elChild.attributes.lat!),
                ],
              });
              break;
            case "vertex":
              coordinates.push([
                parseFloat(elChild.attributes.lon!),
                parseFloat(elChild.attributes.lat!),
              ]);
              break;
            case "linestring":
              const ring: [number, number][] = [];
              for (const vertex of elChild.children) {
                if (!isElementNode(vertex)) continue;
                ring.push([
                  parseFloat(vertex.attributes.lon!),
                  parseFloat(vertex.attributes.lat!),
                ]);
              }
              obj.setGeometry({ type: "Polygon", coordinates: [ring] });
              break;
            case "group":
              const groupCoords: [number, number][] = [];
              for (const groupChild of elChild.children) {
                if (!isElementNode(groupChild)) continue;
                switch (groupChild.tagName) {
                  case "point":
                    geometries.push({
                      type: "Point",
                      coordinates: [
                        parseFloat(groupChild.attributes.lon!),
                        parseFloat(groupChild.attributes.lat!),
                      ],
                    });
                    break;
                  case "vertex":
                    groupCoords.push([
                      parseFloat(groupChild.attributes.lon!),
                      parseFloat(groupChild.attributes.lat!),
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
      // handle nodes/ways/relations
      switch (elNode.tagName) {
        case "node":
          const node = new Node(elNode.attributes.id!, refElements);
          setTagsFromXML(elNode, node);
          node.addMetas(
            purgeProps(elNode.attributes as { [k: string]: string }, [
              "id",
              "lon",
              "lat",
            ]),
          );
          node.setLatLng(elNode.attributes as unknown as LatLon);
          break;
        case "way":
          const way = new Way(elNode.attributes.id!, refElements);
          setTagsFromXML(elNode, way);
          way.addMetas(
            purgeProps(elNode.attributes as { [k: string]: string }, [
              "id",
              "type",
            ]),
          );
          for (const elChild of elNode.children) {
            if (!isElementNode(elChild)) continue;
            switch (elChild.tagName) {
              case "center":
                way.setCenter(elChild.attributes as unknown as LatLon);
                break;
              case "nd":
                if (elChild.attributes.lon && elChild.attributes.lat) {
                  way.addLatLng(elChild.attributes as unknown as LatLon);
                } else if (elChild.attributes.ref) {
                  way.addNodeRef(elChild.attributes.ref);
                }
                break;
            }
          }
          break;
        case "relation":
          const rel = new Relation(elNode.attributes.id!, refElements);
          setTagsFromXML(elNode, rel);
          for (const elChild of elNode.children) {
            if (!isElementNode(elChild)) continue;
            switch (elChild.tagName) {
              case "center":
                rel.setCenter(elChild.attributes as unknown as LatLon);
                break;
              case "member":
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
                } else {
                  const geometry: any[] = [];
                  const nodes: any[] = [];
                  for (const memChild of elChild.children) {
                    if (!isElementNode(memChild)) continue;
                    if (memChild.attributes.lon && memChild.attributes.lat) {
                      geometry.push(memChild.attributes as unknown as LatLon);
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
                break;
              case "bounds":
                rel.setBounds([
                  parseFloat(elChild.attributes.minlon!),
                  parseFloat(elChild.attributes.minlat!),
                  parseFloat(elChild.attributes.maxlon!),
                  parseFloat(elChild.attributes.maxlat!),
                ]);
                break;
            }
          }
          break;
      }
    }
  }
}
