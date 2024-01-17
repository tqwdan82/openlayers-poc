import {EventEmitter} from 'events';

const socket = new WebSocket('ws://localhost:3000/ws');

const eventEmitter = new EventEmitter();

// Connection opened
socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
    // Send a message to the server
    socket.send('Hello from the client!');
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
    console.log('WebSocket message received:', event.data);
    eventEmitter.emit('incidentEvent', event.data);
});

// Connection closed
socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event);
});

// Connection error
socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
});