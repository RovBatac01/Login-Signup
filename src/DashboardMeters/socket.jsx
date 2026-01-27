import { io } from "socket.io-client";

const socket = io("https://login-signup-3470.onrender.com"); // Match your backend server port

export default socket;