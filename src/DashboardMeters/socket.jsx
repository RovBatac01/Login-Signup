import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Match your backend server port

export default socket;