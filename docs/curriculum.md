# Curriculum

This file lists every chapter and lesson the app will teach, in the order a learner reads them. It is the plan for all lesson specs after step 16. Opus wrote it on 2026-11-03.

Every lesson is original writing. No lesson adapts, paraphrases or follows the outline of any repo in `docs/sources.md`. Those repos appear only as further-reading links. The chapter order, the lesson split, the running example and the diagrams below are our own.

## Who it is for

The reader is a developer who has built a web app on one server and wants to design systems that serve millions of users. They may be preparing for a system design interview. They know what HTTP, a database and a server are. They do not yet know why a design picks one option over another.

A reader who finishes the course can do 4 things:

1. Turn a one-line product idea into requirements and rough numbers.
2. Draw a first design and name its bottleneck.
3. Pick between 2 or 3 options for each part and say what each costs.
4. Explain how the design behaves when a machine, a network link or a whole region fails.

## Why the chapters come in this order

Each chapter uses only ideas from the chapters before it.

1. **Foundations** gives the words the rest of the course uses, such as latency, availability and consistency.
2. **Back of the envelope** comes next, because every later choice depends on numbers like requests per second.
3. **The path of a request** follows one request across the network. Later chapters add boxes to that path.
4. **Edge and traffic** covers the boxes a request meets first, such as the CDN and the load balancer.
5. **Application services** covers the servers behind them and how they call each other.
6. **Databases** covers where the data lives, which is where most designs hit their limits.
7. **Caching** needs databases first, because a cache only makes sense next to the slower store it protects.
8. **Asynchronous work** moves slow work off the request path. It uses queues, which need the failure ideas from chapter 5.
9. **Distributed systems** covers the hard problems that the earlier chapters work around, such as clocks, leaders and locks.
10. **Running in production** covers what happens after launch. That includes monitoring, deploys and more than one region.
11. **Security** covers who may do what, and how to keep data safe.
12. **Case studies** design whole products using everything above.

## The running example

Most lessons use one made-up product, Inkwell. Inkwell is a photo-sharing app. Users post photos, follow each other, comment, and read a feed.

One product keeps the numbers comparable between lessons. The reader already knows how Inkwell's traffic looks, so a new lesson only has to explain the new idea. A lesson leaves Inkwell when another product shows its idea better. The rate limiting lesson, for example, uses a public API.

Inkwell's rough numbers, used across the course:

| Measure | Value |
| :--- | ---: |
| Daily active users | 10 million |
| Feed views per user per day | 20 |
| Photos posted per user per day | 0.2 |
| Average photo size after compression | 500 KB |
| Reads for each write | about 100 |

## What every lesson contains

A lesson is one page with one diagram and one quiz. Each lesson meets this bar.

- It takes 6 to 12 minutes, which is about 1,000 to 2,000 words plus the diagram.
- It opens with a concrete problem, such as "Inkwell's one server hits 100% CPU every evening". The idea comes after the problem.
- It shows how the thing works in enough detail to draw it on a whiteboard.
- It gives each real option a name and says when to pick it. "It depends" is never the whole answer.
- It has a section on failure. That section says what breaks, what the user sees, and what the design does about it.
- It ends with what to say in a design review, such as the questions to ask and the trade-off to state out loud.
- It uses real numbers where they exist, rounded and labeled as rough.
- The diagram has 6 to 12 steps. Every step after the first is cued from a phrase in the text, so clicking the phrase plays that step.
- The quiz has 5 to 8 questions. Each wrong option says why it is wrong. At least half the questions test a decision, such as "which would you pick here", not a definition.
- The further-reading list has 3 to 6 links to sources the reader can trust, such as official docs, papers or the repos in `docs/sources.md`.

The text uses short sentences and plain words. It explains each new term the first time it appears. It uses the callouts the app already has. A note adds a side fact, a tradeoff names a cost, and a pitfall names a common mistake.

## What the diagram engine can draw

Each lesson's diagram below is built from what `src/scene` supports today.

- 13 box kinds are available: client, internet, dns, cdn, lb, proxy, server, service, cache, db, queue, worker and storage.
- A packet moves from one box to another. It is a request, a response, data or an error. Several packets can move at once.
- A box can appear, disappear, go down with a cross through it, and come back up.
- A box can be highlighted, or get a short handwritten note.

The engine cannot break a single line between two boxes. A lesson that needs a broken network link puts an internet box on that link and takes the box down.

## Chapter 1. Foundations

Track id `foundations`. This chapter gives the words and the measures that every later chapter uses.

### 1.1 What system design is

Slug `what-system-design-is`.

The lesson starts with a one-line idea, "let people share photos", and turns it into a design brief. It separates functional requirements, which say what the product does, from non-functional ones, which say how well it does it. The non-functional ones are scale, speed, availability, consistency and cost. It gives the order of work used for every case study later, in 6 steps:

1. Requirements.
2. Rough numbers.
3. An API.
4. A data model.
5. A first design.
6. The bottleneck and the fixes for it.

It explains that no design is best in general, only best for a stated set of requirements.

The diagram is the smallest real system, a client, a server and a database. One request goes in and one response comes out. The next steps put a note on each box with the question a designer asks about it, such as "how many users?", "how fast?" and "what if this dies?".

The quiz checks that the reader can sort requirements into functional and non-functional. It also checks that they know which question to ask first about a vague brief.

### 1.2 Latency and throughput

Slug `latency-and-throughput`. Builds on 1.1.

Latency is how long one request takes. Throughput is how many requests finish each second. The lesson shows why improving one does not always improve the other. It explains percentiles. The median (p50) describes a typical user, and the p99 describes the slowest 1 in 100. A page that makes 50 backend calls hits a p99-slow call on about 40% of page loads. It introduces queueing. When requests arrive faster than a server finishes them, they wait, and the wait grows sharply as the server nears 100% busy. Little's law (requests in the system = arrival rate × time in the system) ties these numbers together.

The diagram has a client, a queue in front of a server, and the server. Requests arrive slowly at first and pass straight through. Then they arrive faster than the server drains them. The queue fills, and a note shows the wait growing.

The quiz checks p50 versus p99, what happens to latency near full load, and one Little's law calculation.

### 1.3 Scaling up and scaling out

Slug `scaling-up-and-out`. Builds on 1.2.

Scaling up means buying a bigger machine. Scaling out means adding more machines. The lesson compares the two on cost, limits, downtime and difficulty. It separates a performance problem, where the system is slow for one user, from a scalability problem, where it is fast for one user and slow for a million. It names state as what makes scaling out hard. Any server must be able to handle any request, so data cannot live only in one server's memory.

The diagram starts with one server and a database. Evening traffic pushes the server to a note of "CPU 95%". The server is replaced by a bigger one, and the note drops. Then traffic grows again, and 2 more servers appear beside it. The servers share the database, and the last step puts the load note on the database. That shows where the next bottleneck moves.

The quiz checks which kind of scaling fits a given situation, and where the bottleneck moves after scaling out.

### 1.4 Availability and failure

Slug `availability`. Builds on 1.3.

Availability is the share of time a system answers correctly. The lesson turns "nines" into downtime. 99.9% allows about 8.8 hours of downtime a year. 99.99% allows about 53 minutes, and 99.999% about 5 minutes. It shows the arithmetic of parts in a chain, where each part's availability multiplies. Two 99.9% parts in a row give about 99.8%. Two 99.9% parts side by side, where either one is enough, give about 99.9999%. It defines a single point of failure. It covers redundancy, heartbeats and failover. In active-passive, a standby takes over. In active-active, every copy serves traffic all the time.

The diagram has a client, an active server, a standby server and a database. The active server sends heartbeats to the standby. The active server goes down. The standby notices the missing heartbeat, takes over, and the client's next request succeeds.

The quiz checks a chain and a side-by-side availability calculation, how to spot a single point of failure, and active-passive versus active-active.

### 1.5 Consistency when the network splits

Slug `consistency-and-partitions`. Builds on 1.4.

Two copies of the data sit in two places, and the network between them breaks. The lesson shows that each copy then has two choices. It can refuse writes and stay correct, or accept writes and risk two different answers. It states the CAP theorem carefully. The choice only exists during a network split. It adds the everyday version of that choice. Even with no split, waiting for every copy to agree costs latency on every write. It gives examples where each choice is right. A bank balance should refuse writes, and a like counter should accept them.

The diagram has client A and client B, two database copies, and an internet box between the copies. Writes flow and copy across. The internet box goes down. Client A writes to one copy and client B to the other, and notes show the two copies disagree. The last steps play both outcomes. In one, a copy rejects the write with an error. In the other, both accept the write and the copies reconcile when the link returns.

The quiz checks which choice fits a given product, and that CAP only forces a choice during a split.

## Chapter 2. Back of the envelope

Track id `estimation`. This chapter turns a product description into the numbers that pick a design.

### 2.1 Numbers worth knowing

Slug `numbers-to-know`. Builds on 1.2.

The lesson gives the few numbers a designer uses again and again, and the reason each one matters. These are powers of two and the storage units built on them (KB, MB, GB, TB, PB). It gives rough latencies:

- A memory read takes about 100 ns.
- A random read from an SSD takes about 100 µs.
- A round trip inside one data center takes about 0.5 ms.
- A spinning-disk seek takes about 10 ms.
- A round trip between continents takes about 150 ms.

Three rules follow from these numbers. Memory is about a thousand times faster than an SSD. Network round trips usually decide a request's latency. Distance costs time that no hardware can remove.

The diagram has a server, a cache in memory, a database on SSD, and storage in another region. The server reads from each in turn, and a note gives each read's rough time.

The quiz checks the order of these numbers, and which fix helps a slow page made of many round trips.

### 2.2 Estimating traffic

Slug `estimating-traffic`. Builds on 2.1.

Daily users × actions per user ÷ 86,400 seconds gives the average requests per second. The lesson works the formula for Inkwell's feed. 10 million users × 20 views ÷ 86,400 is about 2,300 reads per second. It explains the peak factor, where the busiest hour runs 2 to 10 times the average. It explains the read-to-write ratio and why it decides whether a cache is worth adding. It shows how to round so the math stays mental.

The diagram has many clients sending to a server, which reads from a cache and writes to a database. Notes show the average rate, the peak rate, and the split between reads and writes.

The quiz asks for 2 estimates from given numbers, and asks what a 100-to-1 read-to-write ratio suggests.

### 2.3 Estimating storage and bandwidth

Slug `estimating-storage`. Builds on 2.2.

Bytes per record × records per day × days kept gives the storage, and replication multiplies it. The lesson works Inkwell's photos. 2 million photos a day × 500 KB is about 1 TB a day, or about 365 TB a year before copies. It separates metadata, small rows in a database, from blobs, large files in object storage. It estimates bandwidth as requests per second × response size, and shows that serving photos costs far more bandwidth than storing them.

The diagram has a client uploading a photo to a server. The server stores the file in storage and a small metadata row in a database, and the database copies the row to 2 replicas. Notes give the size of each piece and the yearly totals.

The quiz asks for a storage estimate, and asks which data belongs in a database and which in object storage.

### 2.4 How many machines

Slug `capacity-planning`. Builds on 2.2 and 1.4.

Peak requests per second ÷ what one server handles gives the server count. The lesson then adds headroom. Servers run at 50% to 70% of their limit, so a spike or a lost server does not push the rest past their limit. It explains N+1 and N+2 redundancy. It sizes a cache. If 20% of the items take 80% of the reads, caching that 20% catches most reads.

The diagram has a load balancer in front of 4 servers. Traffic spreads evenly, with a note of "60% busy" on each server. One server goes down, and the notes on the other 3 rise to 80%. The last step adds a fifth server.

The quiz asks for a server count with headroom, and asks what happens when a fleet with no headroom loses one machine.

## Chapter 3. The path of a request

Track id `network`. This chapter follows one request across the network, from a click to a response.

### 3.1 From URL to response

Slug `url-to-response`. Builds on 2.1.

The lesson walks one page load in order:

1. A DNS lookup.
2. A TCP handshake.
3. A TLS handshake.
4. The HTTP request.
5. The server's work.
6. The response.

It counts the round trips before the first byte of the page arrives. On a 100 ms link that alone is several hundred milliseconds. It shows what reusing a connection saves on the second request.

The diagram has a client, a DNS server, an internet box and a web server. Each step is one exchange, labeled with what it carries, such as "where is inkwell.app?", "SYN", "hello" and "GET /". A note keeps a running count of round trips.

The quiz checks the order of the steps, and which steps a second request on the same connection skips.

### 3.2 DNS

Slug `dns`. Builds on 3.1.

A recursive resolver asks the root servers, then the servers for `.app`, then Inkwell's own name servers, and caches each answer. The lesson covers the main record types: A, AAAA, CNAME, MX and NS. It explains how TTL controls caching. It covers DNS as a traffic tool. DNS can send users to the nearest region, split traffic by weight, and move traffic away from a failed region. It also covers the limit of DNS. Clients and resolvers cache answers, sometimes past the TTL, so a DNS change does not reach everyone at once.

The diagram has a client, a resolver, a root server, a `.app` server and Inkwell's name server. The first lookup walks the whole chain. A second lookup is answered from the resolver's cache, and a note shows the TTL counting down.

The quiz checks the lookup order, what TTL controls, and why DNS failover is slow for some users.

### 3.3 TCP and UDP

Slug `tcp-and-udp`. Builds on 3.1.

TCP delivers bytes in order. It does this by numbering them, waiting for acknowledgements, and resending what is lost. UDP sends single messages with none of that. The lesson covers the handshake, acknowledgements, resends and congestion control. It covers head-of-line blocking, where one lost packet holds up everything behind it. It explains when UDP is the right choice. That includes video calls and games, where late data is useless, and DNS, where one small message fits in a single packet.

The diagram has a client and a server. Over TCP, 3 packets go out, the second is lost, and the server's acknowledgement makes the client resend it. The third waits until it arrives. Over UDP, the same loss just leaves a gap.

The quiz checks which protocol fits a given product, and what head-of-line blocking is.

### 3.4 HTTP

Slug `http`. Builds on 3.3.

The lesson covers methods and which of them are safe to repeat. It covers status codes and what each range means, and the headers a designer relies on most. It shows how HTTP/1.1 runs one request at a time on each connection. HTTP/2 runs many requests at once over one TCP connection. HTTP/3 runs over QUIC on UDP, so one lost packet stops blocking every request. It introduces the caching headers `Cache-Control` and `ETag`, which come back in chapter 7.

The diagram has a client and a server. 3 requests for page assets go one after another over HTTP/1.1. Then the same 3 go at once over HTTP/2, and the client finishes sooner.

The quiz checks which methods are safe to retry, which status code fits a situation, and what HTTP/2 and HTTP/3 each fix.

### 3.5 TLS and HTTPS

Slug `tls`. Builds on 3.4.

TLS gives 3 guarantees. No one on the path can read the data. No one can change it unnoticed. The client is talking to the real server. The lesson explains certificates and the authorities that sign them. It explains the TLS 1.3 handshake in one round trip. It explains why the place where TLS ends matters. Often that place is the load balancer, so traffic inside the data center needs its own protection.

The diagram has a client, a coffee-shop wifi box shown as an internet box, and a server. The handshake runs, with the certificate sent and checked. Then a request crosses the wifi box, and a note on it says it sees only scrambled bytes.

The quiz checks what TLS protects, what a certificate proves, and the risk of ending TLS at the edge.

## Chapter 4. Edge and traffic

Track id `edge`. This chapter covers the boxes a request meets before it reaches application code.

### 4.1 Content delivery networks

Slug `cdn`. Builds on 3.2 and 2.3.

A CDN keeps copies of files in many cities, so a user in Mumbai gets a photo from Mumbai and not from Virginia. The lesson covers several parts of running one:

- Pull CDNs fetch a file on the first request. Push CDNs receive files in advance.
- The cache key and the TTL decide how long an edge copy is used.
- Versioned file names, such as `app.3f9c.js`, avoid waiting for an edge copy to expire.
- An origin shield is an extra cache layer that protects the origin servers.

It covers what to put on a CDN. Photos and scripts belong there. Some CDNs can also speed up uncached requests by keeping fast routes back to the origin.

The diagram has a client, a CDN edge, an origin server and storage. The first request misses at the edge, goes to the origin, and the edge keeps a copy. The second request is answered at the edge, and a note shows the time saved.

The quiz checks pull versus push, how to ship a changed file without waiting for edge copies to expire, and what a CDN should not cache.

### 4.2 Load balancers

Slug `load-balancer`. Builds on 1.3, 1.4 and 3.4.

This lesson replaces the current short one in step 17. A load balancer spreads requests over a pool of servers and stops sending to the ones that fail. The lesson covers each of these topics:

- Active health checks probe each server. Passive checks watch real responses.
- The balancing rules are round robin, weighted round robin, least connections and least response time. Hashing sends a given user to the same server.
- A layer 4 balancer sees only addresses and ports. A layer 7 balancer reads the HTTP request.
- The balancer can end TLS, so the servers behind it do not have to.
- Sticky sessions keep a user on one server. They cost uneven load and lost sessions when that server dies.
- Connection draining lets a server finish its requests before it leaves the pool.
- The balancer must not become the new single point of failure. A pair shares one address, and DNS spreads traffic over several balancers.
- Global load balancing chooses a region. Local load balancing chooses a server inside it.

The diagram has a client, a load balancer, 3 servers and a session store. Requests spread by round robin. One server fails a health check, is crossed out and skipped. A new server joins. A server being removed drains its last request first. The last step moves sessions to the shared store, so any server can serve any user.

The quiz checks layer 4 versus layer 7, the right rule for long-lived connections, the cost of sticky sessions, and how a request reaches a server that has just failed.

### 4.3 Reverse proxies and API gateways

Slug `reverse-proxy`. Builds on 4.2.

A forward proxy acts for clients. A reverse proxy acts for servers. The lesson lists what a reverse proxy does:

- end TLS;
- compress responses;
- serve static files;
- cache;
- hide the servers behind one address.

It shows what an API gateway adds on top of that. A gateway checks who the caller is, applies rate limits, and routes each path to a different service. It explains where the reverse proxy, the gateway and the load balancer overlap. In many systems one product does all three jobs.

The diagram has a client, a gateway, a user service, a photo service, and a cache beside the gateway. A request for `/users/42` goes to the user service. A request for `/photos/7` is answered from the gateway's cache. A request with no valid token stops at the gateway with an error.

The quiz checks forward versus reverse proxies, and which checks belong in the gateway and which in the service.

### 4.4 Rate limiting

Slug `rate-limiting`. Builds on 4.3.

Inkwell opens a public API, and one script sends 5,000 requests a second. The lesson explains why systems limit request rates. Limits stop abuse, keep one customer from starving the others, and control cost. It compares the algorithms:

- fixed window;
- sliding log;
- sliding window counter;
- token bucket, which allows short bursts;
- leaky bucket, which smooths traffic out.

It shows why a fleet of gateways needs a shared counter, and what a rejected caller receives, which is status 429 and a `Retry-After` header.

The diagram has a client, a gateway, a counter cache and a service. Requests pass while the cache counter rises. When the counter reaches the limit, the gateway answers with an error. After the window resets, requests pass again.

The quiz checks which algorithm allows bursts, why the counter must be shared, and what the client should do with a 429.

## Chapter 5. Application services

Track id `application`. This chapter covers the servers that run the product's code and how they talk to each other.

### 5.1 Stateless services

Slug `stateless-services`. Builds on 4.2.

A stateless server keeps nothing between requests that another server would need. The lesson shows what state hides in a server. That includes sessions, uploaded files and in-memory counters. It shows where each one moves, such as a shared store, object storage or a signed token. It shows why stateless servers can be added, removed and restarted freely.

The diagram has a client, a load balancer, 2 servers and a session store. A login sets the session on server 1. The next request lands on server 2 and fails. Then the session moves to the shared store, and the same request succeeds on either server.

The quiz checks how to spot hidden state, and where each kind of state should live.

### 5.2 Monoliths and microservices

Slug `monolith-and-microservices`. Builds on 5.1.

A monolith deploys all its code as one unit. Microservices split the code into units that deploy on their own. The lesson weighs what microservices give against what they cost:

- They give independent deploys, separate scaling and clear team ownership.
- They cost calls over the network, partial failures, data spread across stores and more to operate.

It explains drawing service boundaries around the data each service owns. It recommends a monolith with clean modules as the usual starting point, and names the signs that it is time to split.

The diagram shows a photo upload in a monolith first, as one server writing to one database. Then the same upload runs through a gateway that calls a user service, a photo service and a feed service, each with its own database. A note counts the network calls in each version.

The quiz checks when splitting is worth it, and what a good service boundary looks like.

### 5.3 Service discovery

Slug `service-discovery`. Builds on 5.2.

Servers come and go, so their addresses change. The lesson covers a registry that services sign up with, and health checks that remove dead entries. It covers 2 ways to find a service. In client-side discovery, the caller asks the registry. In server-side discovery, a load balancer asks for it. It also covers discovery built on DNS.

The diagram has a feed service, a registry, and 2 photo service servers. Both photo servers register. The feed service asks the registry and calls one of them. That server goes down, the registry drops it, and the next call goes to the other server.

The quiz checks client-side versus server-side discovery, and what happens when the registry is out of date.

### 5.4 API styles

Slug `api-styles`. Builds on 3.4 and 5.2.

The lesson compares 3 ways to design an API:

- REST is built around resources and HTTP methods.
- RPC, such as gRPC, sends compact binary messages over HTTP/2 and supports streaming.
- GraphQL lets the client name exactly the fields it wants in one request. Caching it is harder.

It covers pagination. Offset paging gets slower deeper in a list and skips items when the list changes. Cursor paging fixes both. It covers versioning an API without breaking old clients.

The diagram has a phone app loading a profile screen. With REST, it makes 3 calls in a row, for the user, the photos and the follower count. With GraphQL, it makes 1 call to a gateway, which calls the 3 services at once.

The quiz checks which style fits public, internal and mobile APIs, and why cursor paging beats offset paging on a busy feed.

### 5.5 Real-time updates

Slug `real-time-updates`. Builds on 5.4.

Inkwell wants a new comment to appear without a reload. The lesson compares 4 ways to do that:

- Short polling asks over and over.
- Long polling asks and waits for an answer.
- Server-sent events stream from the server to the client.
- WebSockets carry messages both ways.

It covers the cost of keeping millions of connections open. It explains how a message reaches a user connected to a different server, using a pub/sub channel between the servers.

The diagram has 2 clients, 2 connection servers and a pub/sub channel shown as a queue. Client A comments through server 1. Server 1 publishes the comment, server 2 receives it, and server 2 pushes it to client B over its open connection.

The quiz checks which method fits a given feature, and how a message crosses between connection servers.

### 5.6 Timeouts, retries and idempotency

Slug `retries-and-idempotency`. Builds on 5.2 and 3.4.

Any call over the network can fail or hang. The lesson covers timeouts. It covers retries with exponential backoff and random jitter. It covers retry storms, where retries multiply the load on a struggling service. It covers idempotency keys, which make a repeated request safe. A retried payment then charges the card once.

The diagram has a client, a payment service and a database. A charge succeeds, but the response is lost on the way back. The client retries with the same key. The service finds the key in the database and returns the stored result without charging again.

The quiz checks why jitter helps, which requests are safe to retry, and how an idempotency key works.

### 5.7 Failing gracefully

Slug `circuit-breakers`. Builds on 5.6.

One slow service can take down every service that calls it. The lesson shows how this cascading failure happens, as callers' threads pile up waiting. It covers circuit breakers, which are closed, open or half-open. It covers bulkheads, which keep one dependency from using all of a service's threads. It covers fallbacks, where a feed shows cached posts when ranking is down. It covers load shedding, where a service drops some work on purpose to keep serving the rest.

The diagram has a client, a feed service, a ranking service and a cache. The ranking service goes down, and the feed service's requests to it fail one by one. The breaker opens, and the feed service answers from the cache. Later a single test request succeeds, and the breaker closes.

The quiz checks the 3 breaker states, which fallback suits a given feature, and why retries without a breaker make an outage worse.

## Chapter 6. Databases

Track id `data`. This chapter covers where data lives, which is where most designs hit their limits.

### 6.1 Choosing a database

Slug `choosing-a-database`. Builds on 2.3.

The lesson surveys these stores and the access pattern each one suits:

- relational;
- key-value;
- document;
- wide-column;
- graph;
- time-series;
- search;
- object storage.

It gives a way to choose. Start from the queries the product runs, then the consistency it needs, then the scale. It warns against picking a store for its popularity.

The diagram has an Inkwell server sending each kind of data to its own store. Accounts and follows go to a relational database, sessions to a key-value cache, photos to object storage, and captions to a search service.

The quiz gives 4 data needs and asks which store fits each.

### 6.2 Indexes

Slug `indexes`. Builds on 6.1.

Without an index, a query reads every row. A B-tree index finds a row in a handful of page reads. The lesson covers composite indexes and why column order matters. It covers covering indexes, which answer a query without touching the table. It covers the cost of each index on every write. It introduces LSM trees, which many write-heavy stores use instead of B-trees.

The diagram has a server and a database. A query for one user's photos runs with no index, and a note says "reads 50M rows". An index is added, the same query runs again, and the note says "reads 4 pages". A write follows, and a note shows it updating the index too.

The quiz checks column order in a composite index, and when an extra index hurts more than it helps.

### 6.3 Transactions and isolation

Slug `transactions`. Builds on 6.1.

The lesson explains the 4 ACID guarantees through a transfer between two accounts. It names the problems that appear when transactions run at the same time:

- dirty reads;
- lost updates;
- write skew.

It explains the isolation levels that prevent each problem, and their costs. It explains the 2 ways databases enforce them, locking and keeping many versions of each row.

The diagram has 2 clients and a database. Both clients read a like count of 10, both write 11, and a note shows that one like is lost. The same race runs again inside transactions that lock the row, and the count ends at 12.

The quiz checks which problem a given bug is, and the lowest isolation level that prevents it.

### 6.4 Replication

Slug `replication`. Builds on 6.3 and 1.4.

The lesson covers a leader that takes writes and followers that copy them. It explains the difference between synchronous copying, which is safe and slow, and asynchronous copying, which is fast and can lose recent writes. It covers replication lag and what users see when a follower is behind. It covers failover, and split brain, where 2 nodes both believe they are the leader. It introduces multi-leader replication. It introduces leaderless replication with quorums, where a write needs W copies and a read asks R copies, and R + W > N means the read sees the latest write.

The diagram has a server, a leader database and 2 followers. A write goes to the leader and copies to both followers. A read from a follower that is behind returns an old value. The leader goes down, and a follower takes over as leader.

The quiz checks synchronous versus asynchronous trade-offs, a quorum calculation, and what causes split brain.

### 6.5 Consistency models

Slug `consistency-models`. Builds on 6.4 and 1.5.

A user posts a comment, reloads, and the comment is gone. The lesson names the guarantees a system can make:

- Linearizable means every read sees the latest write.
- Read-your-writes means a user always sees their own writes.
- Monotonic reads mean a user never sees time go backwards.
- Causal means an answer never appears before its question.
- Eventual means the copies agree once writes stop.

For each guarantee it gives a product feature that needs it and a common way to provide it.

The diagram has a client, a server, a leader and a follower. The user's comment goes to the leader. The reload reads the follower, which is behind, and the comment is missing. Then the same reload runs with reads pinned to the leader for a short time after a write, and the comment appears.

The quiz matches features to the weakest guarantee that still keeps each one correct.

### 6.6 Sharding

Slug `sharding`. Builds on 6.4.

Inkwell's database can no longer hold all the writes or all the data. The lesson covers choosing a shard key. It compares range sharding, which keeps neighbors together and risks hot spots, with hash sharding, which spreads load and breaks range queries. It covers hot keys, such as a celebrity's account. It covers queries and joins that span shards, and moving data when shards are added.

The diagram has a server, a router and 3 database shards. Requests for users 17, 42 and 90 each go to the shard that owns them. A celebrity's account floods one shard, shown by a note. A fourth shard is added, and some data moves to it.

The quiz checks a shard key for a given access pattern, and range versus hash sharding.

### 6.7 Consistent hashing

Slug `consistent-hashing`. Builds on 6.6.

Hashing a key and taking it mod N moves almost every key when N changes. The lesson explains the hash ring, where each key belongs to the next node clockwise. On a ring, adding a node moves only about 1/N of the keys. It explains virtual nodes, which even out the load and let a larger machine take a larger share.

The diagram has a server and 3 cache nodes placed around it. Keys go to their owners. A fourth cache node appears, and only the keys between it and its neighbor move to it. A note compares this with mod N, where most keys would move.

The quiz checks how many keys move in each scheme, and what virtual nodes fix.

### 6.8 Denormalization and read models

Slug `denormalization`. Builds on 6.6 and 6.2.

Joins across shards are slow, and some screens need data from 5 tables. The lesson covers storing copies of data in the shape a screen reads it, such as materialized views and precomputed counters. It covers keeping those copies in step with the source by reading the database's change log, an approach called change data capture.

The diagram has a server, the main database, a change-log queue, a worker and a read-model database. A new like is written to the main database. The change flows through the queue, and the worker updates the precomputed count. The profile page then reads that count in one lookup.

The quiz checks when denormalizing is worth the extra writes, and how the copies drift out of date.

### 6.9 Object storage

Slug `object-storage`. Builds on 2.3 and 4.1.

Photos do not belong in database rows. The lesson covers object storage, which keeps files by key with very high durability. The database holds only each file's metadata and key. It covers presigned URLs, which let the client upload straight to storage without passing through the servers. It covers putting a CDN in front of storage for reads.

The diagram has a client, a server, storage, a database and a CDN. The client asks the server for an upload URL and gets one. The client uploads the photo straight to storage. The server records the photo's key in the database. A later view fetches the photo through the CDN.

The quiz checks where files and metadata each live, and why a presigned upload takes load off the servers.

### 6.10 Search

Slug `search-indexes`. Builds on 6.2 and 6.8.

A query like `LIKE '%sunset%'` reads every row. The lesson explains the inverted index, which maps each word to the documents that contain it. It covers tokenizing text, basic relevance ranking, and keeping a search index in step with the main database through a queue. It warns that a search index is a copy that can be behind, not the source of truth.

The diagram has a client, a server, a database, a queue, an indexer worker and a search service. A new caption is saved, sent through the queue, and indexed. A search for "sunset" goes to the search service and returns the photo.

The quiz checks why `LIKE` does not scale, and what users see while the index is behind.

## Chapter 7. Caching

Track id `cache`. This chapter covers keeping copies of hot data close to where they are read.

### 7.1 Where caches live

Slug `where-caches-live`. Builds on 2.1 and 6.1.

A request can be answered from a cache at several layers:

- the browser;
- a CDN;
- the gateway;
- the server's own memory;
- a shared cache;
- the database's own memory.

The lesson works out the effective latency for a given hit rate. At a 90% hit rate, the 10% of misses take most of the total time. It explains what makes data cacheable. Data is cacheable when it is read often, changes rarely, and can be a little stale.

The diagram has a client, a CDN, a server, a cache and a database. Three requests stop at different layers. The first is a browser hit and never leaves the client. The second is a CDN hit. The third misses everywhere and reaches the database. A note on each request gives its time.

The quiz asks for an effective latency calculation, and asks which layer suits a given kind of data.

### 7.2 Caching patterns

Slug `caching-patterns`. Builds on 7.1.

The lesson compares 5 ways an app and its cache share work:

- In cache-aside, the app checks the cache, then the database, then fills the cache.
- In read-through, the cache loads from the database itself.
- In write-through, each write goes to both at once.
- In write-behind, the cache writes to the database later, which is fast and can lose data.
- In refresh-ahead, the cache reloads hot keys before they expire.

For each pattern it names the risk and the product it fits.

The diagram has a server, a cache and a database. A read misses, loads from the database, and fills the cache. The next read hits. A write updates the database and deletes the cache entry, so the next read loads the new value.

The quiz checks which pattern fits a given product, and the data-loss risk in write-behind.

### 7.3 Invalidation and expiry

Slug `cache-invalidation`. Builds on 7.2.

The lesson compares ways to keep a cache from serving old data. A TTL expires every entry after a set time. A write can delete the cache entry or update it. Versioned keys give each new version of the data its own key. It shows the race where a slow read puts an old value back into the cache just after a write deleted it. It covers eviction policies, LRU and LFU, which decide what goes when the cache is full.

The diagram has 2 servers, a cache and a database. Server A misses and reads the old value from the database. Server B writes a new value and deletes the cache entry. Then server A writes its old value into the cache, and a note marks the entry stale. The fix plays next. A short TTL bounds how long the stale value lasts.

The quiz checks the race and its fixes, and LRU versus LFU for a given workload.

### 7.4 Stampedes and hot keys

Slug `cache-stampedes`. Builds on 7.3.

The entry for a celebrity's profile expires, and 10,000 requests hit the database in the same second. The lesson covers several fixes:

- Request coalescing lets one request load the value while the others wait for it.
- A short lock does the same across servers.
- Early refresh with random jitter reloads the entry before it expires.
- A small local cache inside each server absorbs reads for the hottest keys.
- Copies of a hot key spread its reads over several cache nodes.

The diagram has 4 servers, a cache and a database. The hot entry expires, every server misses, and 4 requests hit the database, shown overloaded with a note. Then the scene replays with a lock. One server reloads the entry while the other 3 wait and then read the fresh value.

The quiz checks what causes a stampede, and which fix suits a key that is hot for minutes and which suits one that is hot all day.

## Chapter 8. Asynchronous work

Track id `async`. This chapter covers moving slow work off the request path.

### 8.1 Queues and workers

Slug `queues-and-workers`. Builds on 5.6.

Resizing a photo takes 2 seconds, and the user should not wait for it. The lesson covers a producer, a queue and a worker. It explains why the server answers 202 Accepted. It covers removing a job only after it is done, and the timeout after which an unfinished job returns to the queue. It covers a dead-letter queue for jobs that keep failing. It covers adding workers as the queue grows.

The diagram has a client, a server, a queue, a worker and storage. The upload returns at once while the job waits in the queue. The worker takes the job and writes the resized photos to storage. A second job fails 3 times and moves to a dead-letter queue.

The quiz checks when to make work asynchronous, and what happens to a job whose worker crashes partway.

### 8.2 Publish and subscribe

Slug `pub-sub`. Builds on 8.1.

With a queue, each job goes to one worker. With pub/sub, each event goes to every subscriber. The lesson covers topics and subscriptions. It shows how pub/sub lets a new feature listen for an event without changing the service that sends it.

The diagram has a photo service, a topic shown as a queue, and 3 workers for notifications, the feed and moderation. One "photo posted" event reaches all 3. Then a fourth subscriber, analytics, is added, and the photo service does not change.

The quiz checks queue versus pub/sub, and what the publisher loses when subscribers are decoupled.

### 8.3 Event logs and streams

Slug `event-streams`. Builds on 8.2.

A log keeps every event in order, in numbered partitions, for days. Each reader tracks its own position. The lesson covers partitions and partition keys, which keep one user's events in order. It covers consumer groups, which share the work. It covers how long the log keeps events, and how a new reader can replay history.

The diagram has 2 producers, a log shown as a queue, 2 workers in one group, and a new analytics worker. Events go into the log and are shared between the 2 workers. The analytics worker starts from the beginning and replays past events.

The quiz checks how to keep events in order, and log versus queue for a given need.

### 8.4 Delivery guarantees

Slug `delivery-guarantees`. Builds on 8.1 and 5.6.

The lesson defines at-most-once delivery, which may lose a message, and at-least-once, which may deliver it twice. It explains why exactly-once delivery across systems is not really available, and how to get the same effect. The consumer records which messages it has handled, so a repeat does nothing.

The diagram has a queue, a worker and a database. The worker handles a message and saves the result. It crashes before telling the queue the message is done, so the queue delivers it again. The worker finds the message id in the database and skips it.

The quiz checks which guarantee fits a given feature, and how a dedupe table works.

### 8.5 Back pressure

Slug `back-pressure`. Builds on 8.1 and 1.2.

Producers sometimes add work faster than consumers finish it. The lesson covers bounded queues. It covers rejecting new work early with a 429 or a 503. It covers adding consumers as the queue grows. It shows why a queue that grows without limit only delays an outage.

The diagram has a client, a server, a queue and a worker. A spike fills the queue, and a note shows its depth climbing. The server starts rejecting new uploads with an error. Then 2 more workers appear, the depth falls, and uploads succeed again.

The quiz checks why an unbounded queue is dangerous, and which signal should trigger more workers.

### 8.6 Work across services

Slug `sagas-and-outbox`. Builds on 8.4 and 6.3.

No single transaction can cover the order, payment and inventory services. The lesson covers two-phase commit and why it blocks when the coordinator dies. It covers sagas, where each step has an undo step that runs if a later step fails. It covers the transactional outbox. The outbox writes an event in the same database transaction as the data, so the event can never be lost or sent for a change that did not happen.

The diagram has an order service, a payment service, an inventory service and a queue. The order is placed, payment succeeds, and inventory fails. The undo step runs and refunds the payment, and the order is marked cancelled.

The quiz checks saga versus two-phase commit, and the bug the outbox prevents.

## Chapter 9. Distributed systems

Track id `distributed`. This chapter covers the hard problems that earlier chapters worked around.

### 9.1 Time and order

Slug `time-and-order`. Builds on 6.4.

Every machine's clock drifts, and NTP only corrects it to within a few milliseconds. The lesson shows how "last write wins" by timestamp throws away a newer write when clocks disagree. It covers logical clocks, which order events without trusting wall time. It introduces version vectors, which detect writes that happened at the same time.

The diagram has 2 servers and 2 database copies. Server A's clock runs 2 seconds fast, shown by a note. Server B writes after server A, but with an earlier timestamp. The copies keep server A's older value.

The quiz checks why timestamps cannot order writes across machines, and what a logical clock guarantees.

### 9.2 Leader election and consensus

Slug `consensus`. Builds on 6.4 and 9.1.

Many systems need exactly one leader at a time. The lesson covers majority quorums, and why clusters have an odd number of nodes. It covers terms, numbered periods that each have at most one leader. It explains, at whiteboard level, how Raft copies a log and commits an entry once a majority has it. It shows how a majority rule prevents split brain.

The diagram has 3 nodes. The leader sends heartbeats and copies a log entry to both followers. The leader goes down. A follower times out, asks for votes, wins 2 of 3, and becomes leader for the next term.

The quiz checks how many failures a 5-node cluster survives, and why 2 nodes cannot both win.

### 9.3 Locks and leases

Slug `locks-and-leases`. Builds on 9.2.

Two workers must not both send the same weekly email. The lesson covers locks that expire, called leases. It covers the paused-process problem, where a worker stalls, its lease runs out, another worker takes over, and the first one wakes and keeps writing. It covers the fix, fencing tokens. Each new lease gets a higher number, and storage rejects writes with an old number.

The diagram has worker A, worker B, a lock service and storage. Worker A takes the lease with token 33 and then stalls, shown by a note. The lease expires, and worker B takes token 34 and writes. Worker A wakes and writes with token 33, and storage rejects it with an error.

The quiz checks why a lease alone is not enough, and how a fencing token fixes it.

### 9.4 Unique IDs

Slug `unique-ids`. Builds on 6.6 and 9.1.

One database's auto-increment cannot hand out IDs for a sharded system. The lesson compares 3 ways to make IDs:

- Random UUIDs need no coordination but sort in no useful order.
- Time-ordered IDs combine a timestamp, a machine number and a counter.
- Blocks of IDs can be handed out from a central service.

It weighs ID size, sort order and what happens when a clock goes backwards.

The diagram has 3 servers and a database. Each server makes IDs on its own, and notes show how the ID's parts break down. The IDs arrive at the database in time order with no collisions.

The quiz checks which scheme fits a given need, and the risk of a clock going backwards.

## Chapter 10. Running in production

Track id `operations`. This chapter covers keeping a system healthy after launch.

### 10.1 Monitoring and observability

Slug `observability`. Builds on 5.2.

The lesson covers the 3 kinds of signal. Metrics are numbers over time, logs are events, and traces follow one request across services. It gives 2 checklists for what to measure. For a service, measure rate, errors and duration. For a resource, measure use, saturation and errors. It recommends alerting on what users feel, not on every internal number. It shows how a trace id passed along with each call ties one request together.

The diagram has a client, a gateway, 2 services and a collector shown as storage. One request passes through all 3. Each service sends its timing to the collector. The last step's note shows the trace, with the slow call marked.

The quiz checks which signal answers a given question, and which alerts should wake someone.

### 10.2 SLIs, SLOs and error budgets

Slug `slos`. Builds on 10.1 and 1.4.

An SLI is a measure of service, such as the share of requests that succeed within 300 ms. An SLO is the target for that measure, such as 99.9% over 30 days. An SLA is a contract with a penalty. The lesson explains the error budget, which is 1 minus the SLO. A 99.9% SLO over 30 days allows about 43 minutes of failure. It shows how a team uses the budget to decide between shipping features and fixing reliability.

The diagram has a client and a server. Most requests succeed. Some fail as errors, and a note on the server shows the remaining budget falling with each failure. At zero, a note marks new releases as frozen.

The quiz asks for an error budget calculation, and asks what a team should do when the budget is used up.

### 10.3 Deploying safely

Slug `deployments`. Builds on 4.2 and 10.1.

The lesson compares 3 ways to release a new version:

- A rolling deploy replaces servers a few at a time.
- A blue-green deploy runs the old and new versions side by side and switches all traffic at once.
- A canary deploy sends a small share of traffic to the new version first.

It covers feature flags, which separate deploying code from turning features on. It covers fast rollback. It covers changing a database schema in steps that work for old and new code at the same time.

The diagram has a client, a load balancer, 3 servers on version 1 and a canary on version 2. 5% of requests go to the canary. The canary returns errors, shown in red. The balancer stops sending to it, which rolls the release back before most users are affected.

The quiz checks which release style fits a given risk, and the safe order of steps for renaming a column.

### 10.4 Running in more than one region

Slug `multi-region`. Builds on 3.2, 6.4 and 10.3.

A second region cuts latency for far-away users and survives the loss of a whole data center. The lesson compares 2 setups. In active-passive, one region serves and the other waits. In active-active, both serve. It covers copying data between regions, with the lag and conflicts that brings. It covers routing users to the nearest region. It covers practicing failover, because untested failover usually fails.

The diagram has users, a DNS server, and 2 regions, each shown as a load balancer and a database. Users go to the nearest region, and the regions copy data to each other. Region A goes down. DNS sends its users to region B.

The quiz checks active-passive versus active-active, and what data a region can lose when it fails.

## Chapter 11. Security

Track id `security`. This chapter covers who may do what, and keeping data safe.

### 11.1 Authentication

Slug `authentication`. Builds on 3.5 and 5.1.

The lesson covers storing passwords with a slow hash such as bcrypt or Argon2, never in plain text or with a fast hash. It compares server sessions with signed tokens such as JWTs. A server can revoke a session at once. A token is easier to scale and harder to revoke. It covers multi-factor sign-in, and limiting login attempts.

The diagram has a client, a server, a database and a session store. The login sends a password. The server checks it against the stored hash, creates a session, and returns a cookie. The next request carries the cookie, and the server checks it in the session store.

The quiz checks why a slow hash, sessions versus tokens for a given app, and how to sign out a stolen device.

### 11.2 Authorization and OAuth

Slug `authorization`. Builds on 11.1.

Authentication proves who someone is. Authorization decides what they may do. The lesson covers roles and permissions, and checking them in every service, not only at the edge. It explains the OAuth 2.0 authorization code flow, which lets a printing app read a user's Inkwell photos without ever seeing the password. It covers scopes that limit what the app may do.

The diagram has a client, a printing app as a server, Inkwell's sign-in service and Inkwell's photo API. The user approves access at the sign-in service. The printing app trades a one-time code for a token, then calls the photo API with the token and gets the photos.

The quiz checks authentication versus authorization, and why the printing app never receives the password.

### 11.3 Protecting data

Slug `protecting-data`. Builds on 11.2.

The lesson covers encrypting data on the network and on disk, and keeping the keys in a key service. It covers keeping secrets out of code and config files. It covers giving each service only the access it needs. It covers using parameterized queries so user input cannot change a query, which prevents SQL injection. It covers audit logs that record who did what.

The diagram has a client, a gateway, a service, a secrets service and a database. The request arrives over TLS. The service fetches its database password from the secrets service. The service writes encrypted data to the database. A request carrying an injected query is rejected with an error.

The quiz checks which defense stops a given attack, and why secrets do not belong in the repository.

## Chapter 12. Case studies

Track id `case-studies`. Each case study designs a whole product with the order of work from lesson 1.1. That means requirements, numbers, an API, a data model, a first design, the bottleneck and its fixes. A case study that needs more than one diagram is split into lessons, one for each flow.

### 12.1 URL shortener, making a link

Slug `url-shortener-create`. Builds on chapters 2, 6 and 9.4.

The lesson covers the requirements and numbers for a service with 100 million new links a month and 100 reads per write. It covers the API and the data model. It compares 3 ways to make short codes:

- A counter encoded in base 62 gives short codes, but anyone can guess the next one.
- A hash of the URL needs a check for collisions.
- Blocks of codes made ahead of time can be handed out to servers.

The diagram has a client, a server, an ID service and a database. The client posts a long URL. The server takes the next ID, encodes it as a short code, saves the pair, and returns the short link.

The quiz checks how many characters the code needs, and the trade-offs of each way to make codes.

### 12.2 URL shortener, following a link

Slug `url-shortener-redirect`. Builds on 12.1 and chapter 7.

The lesson covers the read path, where most of the traffic goes. It caches popular codes. It compares 301 redirects, which browsers remember, with 302 redirects, which count every click. It records clicks through a queue so the redirect stays fast. It handles codes that do not exist.

The diagram has a client, a load balancer, a server, a cache, a database, a queue and a worker. A click hits the cache and is redirected. A cache miss reads the database and fills the cache. Each click is also sent to the queue, and the worker counts it.

The quiz checks 301 versus 302, and why click counting goes through a queue.

### 12.3 News feed, posting

Slug `news-feed-post`. Builds on chapters 6 and 8.

The lesson covers fan-out on write. When a user posts, a worker adds the post to each follower's precomputed feed. It shows the celebrity problem, where one post fans out to 50 million feeds. It covers the usual fix, which skips fan-out for accounts with huge followings.

The diagram has a client, a post service, a queue, a fan-out worker and a feed cache. A post goes in and is queued. The worker writes it into 3 followers' feeds. A celebrity's post is marked to skip fan-out.

The quiz checks the cost of fan-out on write, and where to draw the celebrity line.

### 12.4 News feed, reading

Slug `news-feed-read`. Builds on 12.3.

The lesson covers fan-out on read, where the feed is built when it is opened. It covers the mixed approach, where precomputed feeds are merged with celebrity posts at read time. It covers paging with a cursor, and caching the post bodies separately from each feed's list of post ids. It covers where ranking fits.

The diagram has a client, a feed service, a feed cache, a post cache and a celebrity post store. Opening the feed reads the precomputed ids, merges in recent celebrity posts, loads the post bodies, and returns the first page.

The quiz checks fan-out on read versus on write for a given user, and why ids and bodies are cached apart.

### 12.5 Chat, sending a message

Slug `chat-send`. Builds on 5.5 and 9.4.

The lesson covers keeping a connection open for each user to a chat server, and routing a message to the server the recipient is connected to. It covers storing messages in order within each conversation, and sent, delivered and read receipts. It covers group chats.

The diagram has 2 clients, 2 chat servers, a message store and a pub/sub channel. A message goes from client A to chat server 1 and is stored. It crosses the channel to chat server 2 and is pushed to client B. The receipt flows back to A.

The quiz checks how messages stay in order, and how the system finds the recipient's server.

### 12.6 Chat, presence and offline users

Slug `chat-presence`. Builds on 12.5.

The lesson covers showing who is online using heartbeats with a timeout. It covers limiting how many presence updates fan out to friends. It covers reaching offline users with push notifications, and syncing missed messages when a device reconnects.

The diagram has a client, a chat server, a presence cache, a queue and a push worker. Heartbeats keep the user online. The heartbeats stop, and the user's status turns offline after the timeout. A new message for them goes through the queue to the push worker.

The quiz checks the heartbeat timeout trade-off, and how missed messages sync on reconnect.

### 12.7 Notifications

Slug `notifications`. Builds on chapter 8.

The lesson covers sending by push, email and SMS through each provider. It covers a separate queue for each channel, so a slow email provider does not delay push. It covers user preferences, retries, removing duplicates, and limits on how many notifications one user gets.

The diagram has an event source, a notification service, 3 queues, 3 workers and a preferences database. An event is checked against the user's preferences and placed on the push and email queues. The email worker fails, retries and succeeds.

The quiz checks why each channel has its own queue, and how to avoid sending the same notification twice.

### 12.8 Typeahead

Slug `typeahead`. Builds on chapter 7 and 8.3.

The lesson covers suggesting completions within about 100 ms while the user types. It covers a prefix index, a trie, that stores the top results for each prefix. It covers rebuilding that index offline from the search log. It covers caching the shortest prefixes at the CDN.

The diagram has a client, a CDN, a suggestion service, a search-log queue and a builder worker. Typing "su" is answered by the CDN. Typing "suns" goes to the suggestion service. Past searches flow through the queue, and the builder publishes a new index.

The quiz checks why the results are precomputed, and how fresh suggestions need to be.

### 12.9 Web crawler

Slug `web-crawler`. Builds on chapter 8 and 3.2.

The lesson covers a queue of URLs still to visit. It covers politeness, which means one queue per host and a delay between requests to it. It covers skipping URLs already seen and pages whose content was already seen. It covers caching DNS answers, and respecting `robots.txt`.

The diagram has a URL queue, 2 fetcher workers, a DNS server, the internet, a dedupe cache and storage. A fetcher takes a URL, looks up its host, downloads the page, and stores it. New links go through the dedupe check, and only new ones return to the queue.

The quiz checks why politeness needs a queue per host, and how the crawler detects duplicate pages.

### 12.10 Video upload and processing

Slug `video-upload`. Builds on 6.9 and chapter 8.

The lesson covers resumable uploads in chunks. It covers transcoding into several resolutions with a pool of workers, splitting long videos into segments so work runs in parallel. It covers tracking each video's progress, and telling the user when it is ready.

The diagram has a client, an upload server, storage, a queue, 2 transcode workers and a database. The video arrives in chunks. The segments are queued and transcoded in parallel. The finished versions are stored, and the video is marked ready.

The quiz checks why the video is split into segments, and how a failed upload resumes.

### 12.11 Video playback

Slug `video-playback`. Builds on 12.10 and 4.1.

The lesson covers adaptive bitrate. The player reads a list of available versions and switches quality as bandwidth changes. It covers serving video segments from a CDN. It covers starting playback fast by fetching the first segments early.

The diagram has a client, a CDN, an origin and storage. The player fetches the list of versions, then high-quality segments. Its bandwidth drops, shown by a note, and it switches to lower-quality segments without stopping.

The quiz checks how adaptive bitrate decides, and why video traffic needs a CDN.

### 12.12 Nearby drivers

Slug `nearby-drivers`. Builds on chapters 6 and 7.

Drivers send their location every 4 seconds. The lesson covers that write volume, and why a location index is kept in memory. It covers dividing the map into grid cells or geohashes, and searching a rider's cell and its neighbors. It covers matching a rider to one driver without offering the same driver twice.

The diagram has 2 driver clients, a location service, a location cache, a rider client and a matching service. Locations stream into the cache. The rider requests a ride, the matching service searches the nearby cells, and one driver gets the offer.

The quiz checks why locations live in memory, and how cell size affects the search.

### 12.13 A key-value store

Slug `key-value-store`. Builds on chapters 6 and 9.

This lesson combines ideas from earlier lessons into one design. Consistent hashing spreads the keys. Each key is copied to N nodes, and reads and writes use quorums. Writes meant for a failed node go to a stand-in node and are passed on when it recovers. Repairs fix copies that drift apart, and version vectors detect writes that conflict.

The diagram has a client, a coordinator and 4 nodes. A write goes to 3 copies and succeeds when 2 confirm. One node goes down, and a later write is held by a stand-in node. The node recovers, and the stand-in hands the write over.

The quiz checks a quorum setting for a given need, and what the stand-in write protects against.

## Code changes the curriculum needs

The current `TRACKS` list in `src/content/curriculum.ts` has 10 tracks. The curriculum uses 12. Step 17 replaces the list with these ids and titles, in this order:

| Id | Title |
| :--- | :--- |
| `foundations` | Foundations |
| `estimation` | Back of the envelope |
| `network` | The path of a request |
| `edge` | Edge and traffic |
| `application` | Application services |
| `data` | Databases |
| `cache` | Caching |
| `async` | Asynchronous work |
| `distributed` | Distributed systems |
| `operations` | Running in production |
| `security` | Security |
| `case-studies` | Case studies |

`communication` goes away. Its topics move to chapters 3 and 5. The load balancer lesson's `order` becomes 2, its place in chapter 4. The home page lists only tracks that have lessons, so empty tracks stay hidden until their first lesson merges.

## Build order

1. **Step 17.** The full original load balancer lesson (4.2), the removal of the adaptation and credit code, and the new `TRACKS` list ship in one PR. One PR keeps the live site from ever showing adapted text without credit.
2. **Steps 18 and later.** One lesson per spec, in chapter order. The order starts at 1.1 and skips 4.2, which step 17 already built.

That is 69 lessons. A lesson that needs a new box kind or diagram feature gets its own engine step before it.

## How a lesson is checked for originality

Opus writes each lesson's text from general knowledge. Before a spec goes out, Opus reads the matching sections of the primer and the other repos in `docs/sources.md`. The check passes when the lesson's headings, the order of its points, its examples and its sentences differ from each source. A test cannot catch a close paraphrase, so this check is manual. Its result goes in the spec.
