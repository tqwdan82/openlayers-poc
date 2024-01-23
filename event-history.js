export class EventHistory {
    constructor(name) {
        this.element = document.getElementById(name);
    }

    addHistory(timestamp, incidentType, location, onclick) {
        var li = document.createElement("li");
        const event_date = new Date(timestamp);
        const formate_date = event_date.getDate() + "/" + event_date.getMonth() + 1 + " " + event_date.getHours() + ":" + event_date.getMinutes() + ":" + event_date.getSeconds();
        li.classList.add("list-group-item");
        li.classList.add("list-group-item-action");
        li.classList.add("list-group-item-dark");
        li.appendChild(document.createTextNode(`[${formate_date}][${incidentType}] ${location}`));
        li.addEventListener('click', onclick);
        this.element.appendChild(li);
    }
}