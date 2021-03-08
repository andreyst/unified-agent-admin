function render(app) {
    renderConfig(app)
}

function renderConfig(app) {
    traverseConfig(app).map(table => renderRoute(app, table))
}

function renderRoute(app, table) {
    let tableNode = $(`<table class="mt-4" cellspacing=0 cellpadding=0 style="border-spacing: 0;"></table>`)
    $("main.container").append(['<h3 class="mt-4">Route</h3>', tableNode])

    for (let row of table) {
        let rowNode = $("<tr></tr>")
        tableNode.append(rowNode)
        for (let cell of row) {
            let content = ""

            if (!cell) {
                continue
            } else if (cell.type == "connector") {
                content = `<div><div style="width: 50%; height: 30px; border-right: 1px solid #cccccc;">&nbsp;</div></div>`
            } else if (cell.type == "fanout_start") {
                content = `<div class="clearfix">
                            <div style="width: 50%; height: 30px; border-right: 1px solid #cccccc; float: left;">&nbsp;</div>
                            <div style="width: 50%; height: 15px; border-bottom: 1px solid #cccccc; float: left; font-size: 8px; padding-left: 3px; padding-top: 3px; color: #929292">fanout</div>
                        </div>`
            } else if (cell.type == "fanout_middle") {
                content = `<div class="clearfix">
                            <div style="height: 15px; border-bottom: 1px solid #cccccc;">&nbsp;</div>
                            <div style="width: 50%; height: 15px; border-right: 1px solid #cccccc; float: left;">&nbsp;</div>
                        </div>`
            } else if (cell.type == "fanout_end") {
                content = `<div class="clearfix">
                                <div style="width: 50%; height: 15px; border-bottom: 1px solid #cccccc;">&nbsp;</div>
                                <div style="width: 50%; height: 15px; border-right: 1px solid #cccccc;">&nbsp;</div>
                        </div>`
            } else if (cell.type == "case_start") {
                content = `<div class="clearfix">
                            <div style="width: 50%; height: 30px; border-right: 1px solid #cccccc; float: left;">&nbsp;</div>
                            <div style="width: 50%; height: 15px; border-bottom: 1px solid #cccccc; float: left; font-size: 8px; padding-left: 3px; padding-top: 3px; color: #929292">case</div>
                        </div>`
            } else if (cell.type == "case_middle") {
                content = `<div class="clearfix">
                            <div style="height: 15px; border-bottom: 1px solid #cccccc;">&nbsp;</div>
                            <div style="width: 50%; height: 15px; border-right: 1px solid #cccccc; float: left;">&nbsp;</div>
                        </div>`
            } else if (cell.type == "case_end") {
                content = `<div class="clearfix">
                                <div style="width: 50%; height: 15px; border-bottom: 1px solid #cccccc;">&nbsp;</div>
                                <div style="width: 50%; height: 15px; border-right: 1px solid #cccccc;">&nbsp;</div>
                        </div>`
            } else if (cell.type == "text") {
                let footer = `<div class="card-footer">&nbsp;</div>`
                if (cell.data.subtitle == "output") {
                    footer = `<div class="card-footer"><i class="bi bi-exclamation-circle text-warning"></i></i> No bytes acknowledged in last 5 minutes</div>`
                }

                content = `<div class="card" style="margin-right: 10px;">
                <div class="card-body">
                    <h6 class="card-title">${cell.data.title} <span class="text-muted">${cell.data.subtitle}</span></h6>
                </div>
                 </div>`
            }

            let cellNode = $(`<td>${content}</td>`)
            rowNode.append(cellNode)
        }
    }
}

function traverseConfig(app) {
    let x = 0, y = 0;
    let tables = []

    for (let route of app.routes) {
        table = []
        traverseRoute(app, table, route, x, y)
        tables.push(table)
    }

    return tables
}

function traverseRoute(app, table, route, x, y) {
    let maxXBelow = x

    collectCell(table, x, y, "text", { title: `${route.input.plugin} ${route.input.id || ""}`, subtitle: "output" })
    y += 1

    x = traverseChannel(app, table, route.channel, x, y, "connector")

    return x
}

function traverseChannel(app, table, channel, x, y, connector_type) {
    if (channel.hasOwnProperty("pipe")) {
        let oldY = y
        y = traversePipe(app, table, channel.pipe, x, y, connector_type)
        if (y > oldY) connector_type = null
    }

    if (channel.hasOwnProperty("channel_ref")) {
        channel = app.channels[channel.channel_ref.name].channel
        return traverseChannel(app, table, channel, x, y, connector_type)
    } else if (channel.hasOwnProperty("output")) {
        collectCell(table, x, y, connector_type || "connector")
        y += 1

        collectCell(table, x, y, "text", { title: `${channel.output.plugin} ${channel.output.id || ""}`, subtitle: "output" })
        y += 1
        x += 1
    } else if (channel.hasOwnProperty("fanout")) {
        // let i = 0
        for (let i = 0; i < channel.fanout.length; i++) {
            let fanout = channel.fanout[i];
            let connector_type = "connector"
            if (i == 0 && channel.fanout.length > 1) connector_type = "fanout_start"
            if (i > 0 && i < channel.fanout.length - 1) connector_type = "fanout_middle"
            if (i > 0 && i == channel.fanout.length - 1) connector_type = "fanout_end"

            x = traverseChannel(app, table, fanout.channel, x, y, connector_type)
            // i++
        }
    } else if (channel.hasOwnProperty("case")) {
        for (let i = 0; i < channel.case.length; i++) {
            let kase = channel.case[i]
            let connector_type = "connector"
            if (i == 0 && channel.case.length > 1) connector_type = "case_start"
            if (i > 0 && i < channel.case.length - 1) connector_type = "case_middle"
            if (i > 0 && i == channel.case.length - 1) connector_type = "case_end"

            x = traverseChannel(app, table, kase.channel, x, y, connector_type)
        }
    } else {
        console.error("Unhandled channel", channel)
        throw new Error()
    }

    return x
}

function traversePipe(app, table, pipe, x, y, connector_type) {
    for (let filter of pipe) {
        if (filter.hasOwnProperty("pipe_ref")) {
            let pipe = app.pipes[filter.pipe_ref.name].pipe
            y = traversePipe(app, table, pipe, x, y, connector_type)
        } else if (filter.hasOwnProperty("storage_ref")) {
            let storage = app.storages[filter.storage_ref.name]

            collectCell(table, x, y, connector_type || "connector")
            y += 1

            collectCell(table, x, y, "text", { title: `${storage.plugin} ${storage.id || ""}`, subtitle: "storage" })
            y += 1
        } else {
            collectCell(table, x, y, connector_type || "connector")
            y += 1

            collectCell(table, x, y, "text", { title: `${filter.filter.plugin} ${filter.filter.id || ""}`, subtitle: "filter" })
            y += 1
        }

        connector_type = null
    }

    return y
}

function collectCell(table, x, y, type, data) {
    if (table.length <= y) {
        table.push([])
    }
    while (table[y].length < x) {
        table[y].push(null)
    }
    // console.info(data)
    table[y].push({ type, data })
}

