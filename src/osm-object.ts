import type { RefElements } from "./ref-elements.js";
import type { Feature } from "geojson";

export abstract class OsmObject {
  public refCount: number;
  public hasTag: boolean;

  protected refElems: RefElements;

  public type: string;
  public id: string;
  public tags: { [k: string]: string };
  public meta: { [k: string]: string };

  constructor(type: string, id: string, refElems: RefElements) {
    this.type = type;
    this.id = id;
    this.refElems = refElems;
    this.tags = {};
    this.meta = {};
    this.refCount = 0;
    this.hasTag = false;
    if (refElems) {
      refElems.add(this.getCompositeId(), this);
    }
  }

  public addTags(tags: { [k: string]: string }) {
    this.tags = Object.assign(this.tags, tags);
    this.hasTag = true;
  }

  public addTag(k: string, v: string) {
    this.tags[k] = v;
    this.hasTag = true;
  }

  public addMeta(k: string, v: any) {
    this.meta[k] = v;
  }

  public addMetas(meta: { [k: string]: string }) {
    this.meta = Object.assign(this.meta, meta);
  }

  public getCompositeId(): string {
    return `${this.type}/${this.id}`;
  }

  public getProps(): { [k: string]: string | { [k: string]: string } } {
    return {
      "@id": this.id,
      "@type": this.type,
      ...Object.fromEntries(
        Object.entries(this.meta).map(([k, v]) => ["@" + k, v]),
      ),
      ...Object.fromEntries(
        Object.entries(this.tags).map(([k, v]) => [
          k.startsWith("@") ? "@" + k : k,
          v,
        ]),
      ),
    };
  }

  public abstract toFeatureArray(): Array<Feature<any, any>>;
}
