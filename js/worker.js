importScripts(
    'https://unpkg.com/shapefile@0.6'
);

/** progress indicator **/
const {fetch: originalFetch} = self;
self.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const contentLength = +response.headers.get('Content-Length');
    let loaded = 0;
    let percent = 0;

    return new Response(
        new ReadableStream({
                start(controller) {
                    const reader = response.body.getReader();
                    const read = async () => {
                        const progressE = await reader.read();

                        if (progressE.done === true) {
                            controller.close();
                            return;
                        }

                        loaded += progressE.value.byteLength;

                        const cal = Math.round((loaded / contentLength) * 100);
                        if (percent < cal) {
                            // console.log(cal + ' => ' + contentLength);
                            self.postMessage({percent: percent});
                        }
                        percent = cal;
                        controller.enqueue(progressE.value);
                        await read();
                    };

                    read();
                }
            }
        ));
};

const formattingPath = (path) => {
    return '.' + path;
};

const getData = async (geoJSON) => {
    const _geoJSON = {
        features: [],
        type: 'FeatureCollection',
        name: geoJSON.NAME
    };

    try {
        const _shp = geoJSON.SHP_PATH;
        const _dbf = geoJSON.DBF_PATH;
        const _source = await shapefile.open(_shp, _dbf, {
            encoding: 'windows-949'
        });

        let reader;
        while (!(reader = await _source.read())?.done) {
            const value = reader.value;
            _geoJSON.features.push(value);
        }
    } catch (err) {
        console.error(err);
    }

    return _geoJSON;
};

self.onmessage = async (e) => {
    const arr = e.data;
    const geoJSON = arr.shift();
    const result = await getData(geoJSON);

    console.dir(result);

    self.postMessage({geoJSON: geoJSON, arr: arr, data: result}, result);
    self.close();
};
