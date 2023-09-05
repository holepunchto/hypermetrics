const Hypercore = require('hypercore')
const ram = require('random-access-memory')
const server = require('fastify')()

class HyperMetrics {
    constructor () {
        this.client = require('prom-client')
        this.counter = new this.client.Counter({
            name: 'appended_blocks',
            help: 'number of appended blocks',
            labelNames: ['key']
        })
    }

    add (core, type = "hypercore") {
        core.on('append', () => {
            this.counter.labels({ key: core.key.toString('hex') }).inc()

        })
    }
}


const metrics = new HyperMetrics()

server.get('/metrics', async function (req, res) {
    res.send(await metrics.client.register.metrics())
})

const main = async () => {
    const coreA = new Hypercore(ram)
    const coreB = new Hypercore(ram)
    await coreA.ready()
    await coreB.ready()

    metrics.add(coreA)
    metrics.add(coreB)

    setInterval(() => {
        coreA.append(Date.now().toString())
        coreB.append(Date.now().toString())
    }, 1000)
}

server.listen({ port: 8080 })
main()
