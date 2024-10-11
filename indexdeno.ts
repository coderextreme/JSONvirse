import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { Server as SocketIOServer } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import Multiplayer from "./MultiplayerDeno.ts";

const app = new Application();
const router = new Router();

const metaServer = Deno.env.get("METASERVER") || null;

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  await next();
});

// Serve static files
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// API routes
router.get("/api/servers", async (ctx) => {
  if (metaServer) {
    try {
      const response = await fetch(`${metaServer}/api/servers/`);
      const gameServers = await response.json();
      ctx.response.body = gameServers;
    } catch (e) {
      console.error("Start meta server first.");
      console.error(e);
      ctx.response.status = 500;
      ctx.response.body = { error: "An error occurred" };
    }
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Meta server not configured" };
  }
});

router.post("/api/group", async (ctx) => {
  try {
    const { request, response } = ctx;
    const body = await request.body().value;
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.body = body;
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = { error: "An error occurred" };
  }
});

router.post("/api/petnames", async (ctx) => {
  try {
    const { request, response } = ctx;
    const body = await request.body().value;
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    const data = JSON.parse(await Deno.readTextFile("./public/javascripts/petnames.json"));
    const [from, relationship, to] = body;

    if (from && relationship && to) {
      const sanitizedFrom = from.replace(/[<>&]/g, " ");
      const sanitizedRelationship = relationship.replace(/[<>&]/g, " ");
      const sanitizedTo = to.replace(/[<>&]/g, " ");

      data.push([sanitizedFrom, sanitizedRelationship, sanitizedTo]);
      await Deno.writeTextFile("./public/javascripts/petnames.json", JSON.stringify(data));
    }

    response.body = data;
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = { error: "An error occurred" };
  }
});

// Template routes
router.get("/tapi/template/:SessionName/:SessionToken/:WebSocket", async (ctx) => {
  console.log("Got template request");
  const templateCode = await Deno.readTextFile("./public/template.html");
  // Note: You'll need to implement or import a template engine like Handlebars for Deno
  // For this example, we'll use a simple string replacement
  const { SessionName, SessionToken, WebSocket } = ctx.params;
  const firstSession = SessionName.split(':')[0];
  const webSocket = WebSocket === '"null"' || WebSocket === 'null' ? null : WebSocket;

  const filledTemplate = templateCode
    .replace("{{firstSession}}", firstSession)
    .replace("{{sessionName}}", SessionName)
    .replace("{{sessionToken}}", SessionToken)
    .replace("{{webSocket}}", webSocket);

  ctx.response.body = filledTemplate;
});

// Similar changes for the templateapache route...

app.use(router.routes());
app.use(router.allowedMethods());

const defaultPort = 8088;
const port = parseInt(Deno.env.get("X3DJSONPORT") || defaultPort.toString());

let io = null;

const handler = async (request: Request): Promise<Response> => {
  const { pathname } = new URL(request.url);
  
  if (pathname.endsWith("/socket.io.js")) {
    console.log("request", pathname);
    return new Response(io?.serveClient(), {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  if (request.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(request);
    io = new SocketIOServer(socket, {
      maxHttpBufferSize: 1e9,
      pingTimeout: 60000,
      transports: ["polling", "websocket"],
    });
    new Multiplayer(io, metaServer);
    return response;
  }

  return await app.handle(request);
};

console.log(`go to the following in your browser or restart after typing $ export X3DJSONPORT=${port} # at your terminal prompt:`);
console.log('\thttp://localhost:%s/', port);
console.log('\thttp://localhost:%s/symbols.html', port);
console.log('\thttp://localhost:%s/tapi/template/yottzumm/Unique%20Super%20Secret%20Token/null', port);
console.log('\thttp://localhost:%s/yottzumm.html', port);
console.log('\thttp://localhost:%s/yottzumm2.html', port);
console.log('\thttp://localhost:%s/petnames.html', port);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/index.html', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/tapi/templateapache/yottzumm/Unique%20Super%20Secret%20Token/null', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/yottzumm.html', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/yottzumm2.html', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/lc-soc-lc.html', 8443);
/*
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/petnames.html', 8443);
*/
console.log(`Server running on http://localhost:${port}/`);
await serve(handler, { port });
