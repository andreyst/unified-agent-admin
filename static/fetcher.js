// Metrics fetcher

function startFetcher(app) {
    scheduleFetch(app)
}

function fetchMetrics(app) {
    ts = Date.now()
    ts = ts - (ts % app.period)

    fetch("/metrics").then(response => {
        if (response.ok) return response.json();

        throw new Error(response.status)
    }).then(data => {
        processMetrics(app, data, ts)
        if (app.onMetricsUpdated) app.onMetricsUpdated(app)
        scheduleFetch(app)
    }).catch(error => {
        console.error('Request failed', error);
    })
}

function processMetrics(app, data) {
    app.metricsTimestamps.push(ts)
    processedMetrics = new Set()

    for (let metric of data.sensors) {
        hash = labelsHash(metric.labels)
        processedMetrics.add(hash)
        if (!app.metrics.hasOwnProperty(hash)) {
            app.metricsLabels[hash] = Object.assign({}, metric.labels)
            app.metrics[hash] = []
        }

        if (metric.kind == "RATE" || metric.kind == "HIST_RATE") {
            if (app.ratePrevPoints.hasOwnProperty(hash)) {
                value = (metric.value - app.ratePrevPoints[hash]) / app.period
                app.metrics[hash].push(value)
            } else {
                app.metrics[hash].push(null)
            }
            app.ratePrevPoints[hash] = metric.value
        } else if (metric.kind == "GAUGE") {
            app.metrics[hash].push(metric.value)
        } else {
            throw new Error(`Unknown metric kind ${metric.kind} (${JSON.stringify(metric.labels)})`)
        }
    }

    for (let hash of Object.keys(app.metrics)) {
        if (!processedMetrics.has(hash)) {
            app.metrics[hash].push(null)
        }
    }
}

function scheduleFetch(app) {
    now = Date.now()
    timeout = app.period - (now % app.period)
    window.setTimeout(function () {
        fetchMetrics(app)
    }, timeout)
}

// fetch("/counters").then(response => {
//     return response.json()
// }).then(data => {
//     console.log(data)
// })
