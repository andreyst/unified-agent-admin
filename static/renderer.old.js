function renderConfig(app) {
    let node = $("<div></div>")
    $("main.container").append(node)

    node.append(`<h3 class="mt-4">System</h3>`)
    let chartNode = $(`<div class="clearfix"></div>`)
    node.append(chartNode)
    for (let metric of ["Errors", "Backlog", "MessagesLost", "BytesLost"]) {
        let chartId = `scope=health&sensor=${metric}`
        chartNode.append(`<div id="${chartId}" style="float: left; width: 250px; height: 110px; margin-left: ${0 * 21 + 11}px;"></div>`)
        app.charts[chartId] = createChart(chartId, metric, metric)
    }


    for (let route of app.routes) {
        renderRoute(app, node, route)
    }
}

function renderRoute(app, node, route) {
    let level = 0

    node.append(`<h3 class="mt-4">Route</h3>`)
    node.append(`<h6><i class="bi bi-box-arrow-in-right" style="afont-size: 0.7em"></i> ${route.input.plugin}  <small class="text-muted">${route.input.id || ""}</h6>`)
    if (route.input.id) {
        let chartNode = $(`<div class="clearfix"></div>`)
        node.append(chartNode)
        for (let metric of ["ReceivedBytes", "InflightBytes", "AckBytes"]) {
            let chartId = `_flow=outgoing&plugin_id=${route.input.id}&sensor=${metric}`
            chartNode.append(`<div id="${chartId}" style="float: left; width: 250px; height: 110px; margin-left: ${level * 21 + 11}px;"></div>`)
            app.charts[chartId] = createChart(chartId, metric, metric)
        }
    }
    console.info("INPUT: " + route.input.plugin)
    renderChannel(app, node, route.channel, level)
}

function renderChannel(app, node, channel, level) {
    channelDef = channel

    if (channelDef.hasOwnProperty("pipe")) {
        renderPipe(app, node, channelDef.pipe, level)
    }

    if (channel.hasOwnProperty("channel_ref")) {
        if (!app.channels.hasOwnProperty(channel.channel_ref.name)) {
            console.error(`Missing named channel`, channel.channel_ref.name)
            return
        }

        node.append(`<h6 style="margin-left: ${level * 21 + 21}px;"><small class="text-muted">Named channel: ${channel.channel_ref.name}</small></h6>`)
        renderChannel(app, node, app.channels[channel.channel_ref.name].channel, level)
    } else if (channelDef.hasOwnProperty("output")) {
        node.append(`<h6 style="margin-left: ${level * 21}px;"><i class="bi bi-box-arrow-right" style="afont-size: 0.7em"></i> ${channelDef.output.plugin} <small class="text-muted">${channelDef.output.id || ""}</h6>`)
        if (channelDef.output.id) {
            let chartNode = $(`<div class="clearfix"></div>`)
            node.append(chartNode)
            for (let metric of ["ReceivedBytes", "PluginInflightBytes", "AckBytes"]) {
                let chartId = `_flow=incoming&plugin_id=${channelDef.output.id}&sensor=${metric}`
                chartNode.append(`<div id="${chartId}" style="float: left; width: 250px; height: 110px; margin-left: ${level * 21 + 11}px;"></div>`)
                app.charts[chartId] = createChart(chartId, metric, metric)
            }
        }
        console.info(">".repeat(level) + "OUTPUT: " + channelDef.output.plugin)
    } else if (channelDef.hasOwnProperty("fanout")) {
        let i = 0
        for (let dst of channelDef.fanout) {
            node.append(`<h6 style="margin-left: ${level * 21}px;"><i class="bi bi-diagram-3" style="afont-size: 0.7em"></i> fanout</span></h6>`)
            console.info(">".repeat(level) + "FANOUT " + i)
            renderChannel(app, node, dst.channel, level + 1)
            i += 1
        }
    } else {
        console.error(`Channel has neither channel_ref nor output nor fanout`, channelDef);
    }
}

function renderPipe(app, node, pipe, level) {
    pipeDef = pipe
    if (pipe.hasOwnProperty("pipe_ref")) {
        if (!app.pipes.hasOwnProperty(pipe.pipe_ref.name)) {
            console.error(`Missing named pipe`, pipe.pipe_ref.name)
            return
        }

        pipeDef = app.pipes[pipe.pipe_ref.name].pipe
    }

    for (let filter of pipeDef) {
        renderFilter(app, node, filter, level)
    }
}

function renderFilter(app, node, filter, level) {
    if (filter.hasOwnProperty("filter")) {
        node.append(`<h6 style="margin-left: ${level * 21}px;"><i class="bi bi-funnel"></i> ${filter.filter.plugin} <small class="text-muted">${filter.filter.id || ""}</small></h6>`)
        console.info(">".repeat(level) + "FILTER: " + filter.filter.plugin)
    } else if (filter.hasOwnProperty("storage_ref")) {
        if (!app.storages.hasOwnProperty(filter.storage_ref.name)) {
            console.error(`Missing named storage`, filter.storage_ref.name)
            return
        }

        storage = app.storages[filter.storage_ref.name]
        node.append(`<h6 style="margin-left: ${level * 21}px;"><i class="bi bi-hdd" style="afont-size: 0.7em"></i> ${storage.plugin} storage  <small class="text-muted">${storage.name}</h6>`)

        let chartNode = $(`<div class="clearfix"></div>`)
        node.append(chartNode)
        for (let flow of ["incoming", "outgoing"]) {
            for (let metric of ["ReceivedBytes", "AckBytes"]) {
                let chartId = `_flow=${flow}&plugin_id=storage-${storage.name}&sensor=${metric}`
                chartNode.append(`<div id="${chartId}" style="float: left; width: 250px; height: 110px; margin-left: ${level * 21 + 11}px;"></div>`)
                app.charts[chartId] = createChart(chartId, `${metric} ${flow}`, `${metric} ${flow}`)
            }
        }
        console.info(">".repeat(level) + "STORAGE: " + storage.plugin)
    } else {
        console.error(`Filter has neither filter nor storage`, filter);
    }
}

function renderCharts(app) {
    for (let chartId of Object.keys(app.charts)) {
        if (!app.metrics.hasOwnProperty(chartId)) {
            console.error("Labels missing for chartId", chartId)
            continue
        }
        let x = app.metricsTimestamps[app.metricsTimestamps.length - 1]
        let y = app.metrics[chartId][app.metrics[chartId].length - 1]
        app.charts[chartId].series[0].addPoint([x, y], true, true, false);
    }
}

function generateInitialData() {
    let data = []
    let curTs = Date.now()
    curTs = curTs - curTs % app.period
    let ts = curTs - app.window
    while (ts < curTs) {
        data.push([ts, null])
        ts += app.period;
    }

    return data
}

function createChart(container, title, seriesName) {
    return Highcharts.chart(container, {
        title: {
            align: "left",
            text: title,
            style: {
                fontSize: "12px",
            },
        },
        yAxis: {
            title: "",
            width: 100,
        },
        xAxis: {
            type: "datetime",
        },
        legend: {
            enabled: false,
        },
        plotOptions: {
            series: {
                animation: false,
                marker: false,
            },
        },
        series: [{
            name: seriesName,
            data: generateInitialData()
        }],
    });
}