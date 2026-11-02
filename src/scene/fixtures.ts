import { defineScene } from "./model"
import { compile } from "./timeline"

export const fixtureScene = defineScene({
  client: { kind: "client", label: "Client", at: [0, 0] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 0] },
  server: { kind: "server", label: "Server", at: [4, 0], hidden: true },
}).steps((s) => ({
  ask: s.step("The client sends a request.", s.send("client", "lb", "GET /")),
  route: s.step(
    "The balancer forwards it to a new server.",
    s.show("server"),
    s.focus("lb"),
    s.send("lb", "server", "GET /"),
  ),
  answer: s.step(
    "The server answers.",
    s.send("server", "lb", "200", "response"),
    s.send("lb", "client", "200", "response"),
  ),
  fail: s.step("The server goes down.", s.down("server"), s.note("lb", "health check failed")),
}))

export const fixture = compile(fixtureScene)
