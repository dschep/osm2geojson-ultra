import { purgeProps } from "./utils.js";
import { LatLon, Node } from "./node.js";
import { OsmObject } from "./osm-object.js";
import { Output } from "./output.js";
import { Way } from "./way.js";
import { Relation } from "./relation.js";
import { RefElements } from "./ref-elements.js";
import type { polygonTags } from "./polygonTags.js";

export default function analyzeFeaturesFromJson(
  osm: { [k: string]: any },
  refElements: RefElements,
  polygonTagOverrides: polygonTags | undefined,
): void {
  for (const elem of (osm as { [k: string]: any }).elements) {
    // Check for evidence ths is a derived element and process if so
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
    // handle nodes/ways/relations
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
        const way = new Way(elem.id as string, refElements, polygonTagOverrides);
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
        break;
    }
  }
}
