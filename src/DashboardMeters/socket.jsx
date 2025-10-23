import { io } from "socket.io-client";

const socket = io("https://login-signup-production-9bdf.up.railway.app"); // Match your backend server port

export default socket;