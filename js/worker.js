importScripts(
    'https://unpkg.com/shapefile@0.6'
);

const formattingPath = (path) => {
    return '.' + path;
};

const getData = async (geoJSON) => {
    try {
        const path = formattingPath(geoJSON.PATH);
        const _source = await shapefile.read(path, path, {
            encoding: 'windows-949'
        });

        _source.name = geoJSON.NAME;

        return _source;
    } catch (err) {
        console.error(err);
        return [];
    }
};

self.onmessage = async (e) => {
    const arr = e.data;
    const geoJSON = arr.shift();
    const result = await getData(geoJSON);

    console.dir(result);

    self.postMessage({geoJSON: geoJSON, arr: arr, data: result}, result);
    self.close();
};
