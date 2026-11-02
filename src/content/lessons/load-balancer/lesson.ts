import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  you: { kind: "client", label: "You", at: [0, 1] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 1] },
  a: { kind: "server", label: "Server A", at: [4, 0] },
  b: { kind: "server", label: "Server B", at: [4, 1] },
  c: { kind: "server", label: "Server C", at: [4, 2], hidden: true },
  sessions: { kind: "cache", label: "Session store", at: [6, 1], hidden: true },
}).steps((s) => ({
  arrive: s.step(
    "Your request goes to the load balancer, not to a server.",
    s.send("you", "lb", "GET /"),
  ),
  pick: s.step(
    "The balancer picks a healthy server, here by round robin, and forwards the request.",
    s.focus("lb"),
    s.send("lb", "a", "GET /"),
  ),
  reply: s.step(
    "Server A answers. The balancer passes the response back to you.",
    s.send("a", "lb", "200", "response"),
    s.send("lb", "you", "200", "response"),
  ),
  next: s.step(
    "The next request goes to the next server in turn.",
    s.send("you", "lb", "GET /"),
    s.send("lb", "b", "GET /"),
  ),
  fail: s.step(
    "Server A stops answering health checks. The balancer takes it out of rotation.",
    s.down("a"),
    s.note("lb", "health check failed"),
  ),
  reroute: s.step(
    "Traffic keeps flowing to the servers that are still up.",
    s.send("you", "lb", "GET /"),
    s.send("lb", "b", "GET /"),
  ),
  scale: s.step(
    "To handle more load, add another server behind the balancer. Nothing changes for you.",
    s.show("c"),
    s.send("you", "lb", "GET /"),
    s.send("lb", "c", "GET /"),
  ),
  stateless: s.step(
    "Any server can take any request only if servers keep no session state. Sessions move to a shared store.",
    s.show("sessions"),
    s.parallel(s.send("b", "sessions", "session", "data"), s.send("c", "sessions", "session", "data")),
  ),
}))

export default defineLesson({
  title: "Load balancer",
  summary: "Spread requests across many servers, route around the broken ones, and add capacity without anyone noticing.",
  track: "edge",
  order: 3,
  tags: ["L4", "L7", "round robin", "horizontal scaling", "health check", "sticky sessions"],
  sources: [
    {
      use: "adapted",
      repo: "donnemartin/system-design-primer",
      section: "Load balancer",
      anchor: "load-balancer",
    },
    {
      use: "link",
      title: "HAProxy architecture guide",
      url: "http://www.haproxy.org/download/1.2/doc/architecture.txt",
    },
    {
      use: "link",
      repo: "binhnguyennus/awesome-scalability",
      title: "awesome-scalability: load balancing",
      url: "https://github.com/binhnguyennus/awesome-scalability#load-balancing",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## What it does

    A load balancer sits in front of a group of servers. ${cue("arrive", "Clients talk to the balancer")},
    and ${cue("pick", "it forwards each request to one server")} and
    ${cue("reply", "relays the answer back")}. Clients never learn which server did the work.

    It earns its place three ways:

    - It ${cue("fail", "stops sending requests to unhealthy servers")}.
    - It spreads load so ${cue("next", "no single server gets all of it")}.
    - It removes the single server as a single point of failure.

    > note: The balancer itself can now be the single point of failure. Teams run two, in active-passive or active-active mode.

    ## How it picks a server

    Common rules are random, least loaded, round robin (optionally weighted), and
    session cookies. A **layer 4** balancer decides from IP addresses and ports
    only. A **layer 7** balancer reads the request itself, its path, headers, and
    cookies, so it can send \`/video\` to video servers and \`/billing\` to hardened
    ones. Layer 7 costs more work per request.

    ## Horizontal scaling

    ${cue("scale", "Adding cheap servers behind the balancer")} is called scaling out.
    It is cheaper and more available than buying one bigger machine, which is
    scaling up.

    > tradeoff: Scaling out only works if ${cue("stateless", "servers hold no user session")}. Keep sessions in a shared database or cache.

    ${cue("reroute", "Losing a server then costs capacity, not correctness")}.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "Server A fails its health checks. What does the load balancer do?",
      options: [
        { text: "Stops routing to Server A and keeps using the others", correct: true },
        { text: "Returns errors to every client until A recovers", why: "Only requests already in flight to A are affected." },
        { text: "Restarts Server A", why: "Restarting is an orchestrator's job, not the balancer's." },
      ],
      explain: "Health checks let the balancer route around a dead server.",
      replay: "fail",
    },
    {
      kind: "choice",
      prompt: "Which balancer can route /video and /billing to different servers?",
      options: [
        { text: "Layer 4", why: "Layer 4 sees only addresses and ports, not the path." },
        { text: "Layer 7", correct: true },
      ],
      explain: "Layer 7 reads the HTTP request, so it can route on the path.",
    },
    {
      kind: "multi",
      prompt: "What has to be true before you can add servers freely behind a balancer?",
      options: [
        { text: "Servers keep no per-user session in memory", correct: true },
        { text: "Sessions live in a shared store", correct: true },
        { text: "Every server has more RAM than the last", why: "Scaling out uses identical, commodity machines." },
      ],
      explain: "Any server must be able to serve any request.",
      replay: "stateless",
    },
    {
      kind: "order",
      prompt: "Put one request's path in order.",
      items: ["Client sends to the balancer", "Balancer picks a server", "Server responds to the balancer", "Balancer responds to the client"],
      explain: "The balancer sits on both legs of the trip.",
      replay: "reply",
    },
  ],
})
