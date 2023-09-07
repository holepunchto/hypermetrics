class HypermetricsAutobase {
  constructor (client) {
    this.client = client
    this.bases = []
    const bases = this.bases

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'autobase_active_writers',
      help: 'autobase active writers',
      labelNames: ['key', 'type'],
      collect () {
        for (const base of bases) {
          this.labels({ key: base.local.id, type: 'autobase' }).set(base.activeWriters.size)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'autobase_view_length',
      help: 'autobase view length',
      labelNames: ['key', 'type'],
      collect () {
        for (const base of bases) {
          this.labels({ key: base.local.id, type: 'autobase' }).set(base.view.length)
        }
      }
    })

    new this.client.Gauge({ // eslint-disable-line no-new
      name: 'autobase_view_indexed_length',
      help: 'autobase view indexed length',
      labelNames: ['key', 'type'],
      collect () {
        for (const base of bases) {
          this.labels({ key: base.local.id, type: 'autobase' }).set(base.view.indexedLength)
        }
      }
    })
  }

  add (base) {
    this.bases.push(base)
  }

  get register () {
    return this.client.register
  }

  getMetricsAsJSON () {
    return this.client.register.getMetricsAsJSON()
  }
}

module.exports = HypermetricsAutobase
