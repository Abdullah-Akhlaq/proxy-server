const WebSocket = require("ws");
const http = require("http");

// Create the HTTP server for handling WebSocket upgrade requests
const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Target WebSocket server (backend)
const targetWsUrl = "ws://localhost:7501/finger";

wss.on("connection", (clientWs) => {
  const targetWs = new WebSocket(targetWsUrl);

  // Forward messages from client to the target WebSocket server
  clientWs.on("message", (message) => {
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(message);
    }
  });

  // Forward messages from the target WebSocket server to the client
  targetWs.on("message", (message) => {
    let formattedMessage;

    // Convert binary data (Buffer or Blob) to string
    if (Buffer.isBuffer(message)) {
      formattedMessage = message.toString();
    } else {
      formattedMessage = message; // Assume it's already a string
    }

    // Optionally: Parse JSON and reformat before sending (uncomment if needed)
    // try {
    //   const parsed = JSON.parse(formattedMessage);
    //   formattedMessage = JSON.stringify(parsed);
    // } catch (e) {
    //   // If parsing fails, keep the message as is
    // }

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(formattedMessage);
    }
  });

  // Handle disconnection from both sides
  clientWs.on("close", () => targetWs.close());
  targetWs.on("close", () => clientWs.close());

  // Handle errors
  clientWs.on("error", (err) => console.error("Client WebSocket error:", err));
  targetWs.on("error", (err) => console.error("Target WebSocket error:", err));
});

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/finger") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  }
});

// Start the proxy server
const PORT = 7501;
server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
