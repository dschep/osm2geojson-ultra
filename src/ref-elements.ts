import { LateBinder } from "./late-binder.js";
import type { OsmObject } from "./osm-object.js";

export class RefElements extends Map<string, OsmObject> {
    private binders: LateBinder<any>[];

    constructor() {
        super();
        this.binders = [];
    }

    public add(k: string, v: OsmObject) {
        this.set(k, v);
    }

    public addBinder(binder: LateBinder<any>) {
        this.binders.push(binder);
    }

    public bindAll() {
        this.binders.forEach((binder) => binder.bind());
    }
}
