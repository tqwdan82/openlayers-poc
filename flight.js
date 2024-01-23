import { Point } from "ol/geom";

export class FLight {
    constructor(plane, start, end, step) {
        this.plane = plane;
        this.step = step;
        this.delta = [(end[0] - start[0])/this.step, (end[1] - start[1])/this.step];
        this.active = true;
    }

    update() {
        if (this.step == 0) {
            console.log("flight reached");
            this.active = false;
            return;
        }

        var curr = this.plane.getGeometry().getCoordinates();
        this.plane.setGeometry(new Point([
            curr[0] + this.delta[0],
            curr[1] + this.delta[1]
        ]));
        this.step--;
    }
}