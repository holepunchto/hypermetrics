# Hypermetrics

Hypercore Prometheus metric collector.

## Usage

``` js

const hypermetrics = new Hypermetrics()

const core = new Hypercore(ram)
await core.ready()
hypermetrics.add(core)

server.get('/metrics', async function (req, res) {
    res.send(await hypermetrics.register.metrics())
})

server.listen({ port: 8080 })

```

