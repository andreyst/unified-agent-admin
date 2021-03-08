// Metrics in-memory storage

function isLabelEqual(labels1, labels2) {
    const keys1 = Object.keys(labels1);
    const keys2 = Object.keys(labels2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (labels1[key] !== labels2[key]) {
            return false;
        }
    }

    return true;
}

function labelsHash(labels) {
    keys = Object.keys(labels)
    keys.sort()
    res = []
    for (let key of keys) {
        res.push(`${key}=${labels[key]}`)
    }
    hash = res.join("&")

    return hash
}