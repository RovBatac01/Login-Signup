import { io } from "socket.io-client";

const socket = io("https://login-signup-production-e1ef.up.railway.app"); // Match your backend server port

export default socket;