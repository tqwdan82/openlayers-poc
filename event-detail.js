export class EventDetail {
    constructor(name, locate, close) {
        this.element = document.getElementById(name);
        this.locate = document.getElementById("event-detail-locate");
        this.close = document.getElementById("event-detail-close");

        this.locate.addEventListener('click', locate);
        this.close.addEventListener('click', evt => {
            this.hide();
            close(evt);
        });
    }

    show(incidentType, location) {
        document.getElementById("event-info-event-type").innerHTML = incidentType;
        document.getElementById("event-info-event-location").innerHTML = location;
        this.element.classList.remove("invisible");
    }

    hide() {
        this.element.classList.add("invisible");
    }
}