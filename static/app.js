function initApp() {
    app = {
        window: 1 * 60 * 1000, // ms
        period: 1000, // ms
        storages: {},
        channels: {},
        pipes: {},
        routes: [],
        metricsTimestamps: [],
        metricsLabels: {},
        metrics: {},
        ratePrevPoints: {},
        subscriptions: [],
        charts: {},
        // onMetricsUpdated: renderCharts,
    }

    initData(app).then(app => {
        render(app);
        startFetcher(app);
    });

    return app
}

function initData(app) {
    promise = new Promise((resolve, reject) => {
        fetch("/status").then(response => {
            if (response.ok) return response.json();

            throw new Error(response.status)
        }).then(data => {
            if (data.hasOwnProperty("storages")) {
                for (let storage of data.storages) {
                    if (app.storages.hasOwnProperty(storage.name)) {
                        console.error(`Duplicate storage ${storage.name}`)
                    }
                    app.storages[storage.name] = storage
                }
            }

            if (data.hasOwnProperty("channels")) {
                for (let channel of data.channels) {
                    if (app.channels.hasOwnProperty(channel.name)) {
                        console.error(`Duplicate channel ${channel.name}`)
                    }
                    app.channels[channel.name] = channel
                }
            }

            if (data.hasOwnProperty("pipes")) {
                for (let pipe of data.pipes) {
                    if (app.pipes.hasOwnProperty(pipe.name)) {
                        console.error(`Duplicate pipe ${pipe.name}`)
                    }
                    app.pipes[pipe.name] = pipe
                }
            }

            if (data.hasOwnProperty("routes")) {
                app.routes = JSON.parse(JSON.stringify(data.routes))
            }

            resolve(app)
        }).catch(error => {
            console.error('Request failed', error);
        })
    })

    return promise
}
