let map;
let worker;

const DEFAULT_PROJECTION = 'EPSG:3857';
const TN_STTREE_W = {
    NAME: 'TREE',
    RADIUS_NAME: 'TREE_R',
    PATH: './shp/TN_STTREE_W',
    PROJECTION: 'EPSG:4326'
};
const Z_NGII_N3L_A0033320 = {
    NAME: 'STREET',
    PATH: './shp/Z_NGII_N3L_A0033320',
    PROJECTION: 'EPSG:5179'
};
const TREE_STYLE = {
    symbol: {
        symbolType: 'image',
        src: './images/tree.png',
        size: [32, 32],
        rotateWithView: false,
        offset: [0, 0]
    }
};
const RADIUS_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#736E2C',
        width: 1
    })
});
const STREET_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#BF7069',
        width: 3
    })
});

proj4.defs(
    'EPSG:5179',
    '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);
ol.proj.proj4.register(proj4);

const init = async () => {
    await createMap();
    await handleFetch([TN_STTREE_W, Z_NGII_N3L_A0033320]);
    await handleClick();
};

const createMap = async () => {
    map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                name: 'OSM',
                source: new ol.source.OSM()
            }),
            new ol.layer.WebGLPoints({
                name: TN_STTREE_W.NAME,
                source: new ol.source.Vector(),
                style: TREE_STYLE,
                minZoom: 13
            }),
            new ol.layer.Vector({
                name: TN_STTREE_W.RADIUS_NAME,
                source: new ol.source.Vector(),
                style: [RADIUS_STYLE],
                minZoom: 17
            }),
            new ol.layer.Vector({
                name: Z_NGII_N3L_A0033320.NAME,
                source: new ol.source.Vector(),
                style: [STREET_STYLE],
                minZoom: 15
            })
        ],
        target: 'map',
        view: new ol.View({
            projection: DEFAULT_PROJECTION,
            /** 서울역 근처 **/
            center: [14134387.051814102, 4516378.618876206],
            zoom: 17
        })
    });
};

const getFeatures = async (geoJSON, data) => {
    const format = new ol.format.GeoJSON({
        dataProjection: geoJSON.PROJECTION,
        featureProjection: DEFAULT_PROJECTION
    });

    return format.readFeatures(data);
};

const setRadiusFeatures = (features) => {
    const radiusFeatures = [];

    features.forEach(f => {
        try {
            const coordinate = f.getGeometry().getCoordinates();
            const circleGeom = new ol.geom.Circle(coordinate, 3);
            const radiusFeature = new ol.Feature(ol.geom.Polygon.fromCircle(circleGeom));

            radiusFeatures.push(radiusFeature);
        } catch (err) {
            console.error(err);
            console.dir(f);
        }
    });

    return radiusFeatures;
};

const startWorker = (msg) => {
    if (typeof (Worker) !== 'undefined') {
        worker = new Worker('./js/worker.js');
    } else {
        alert('지원하지 않는 브라우저입니다.');
        return;
    }

    worker.addEventListener('message', handleMessage);
    worker.postMessage(msg);
};

const handleFetch = async (arr) => {
    const msg = arr;

    const loading = document.getElementsByClassName('loading-wrapper')[0];
    const loadingSpan = loading.getElementsByTagName('span')[0];

    loadingSpan.textContent = 'FETCHING ' + arr[0].NAME + ' DATA...';

    startWorker(msg);
};

const handleMessage = async (msg) => {
    const {geoJSON, arr, data} = msg.data;
    const features = await getFeatures(geoJSON, data);

    await getSource(geoJSON.NAME).addFeatures(features);

    if (geoJSON.RADIUS_NAME) {
        const radiusFeatures = setRadiusFeatures(features);
        await getSource(geoJSON.RADIUS_NAME).addFeatures(radiusFeatures);
    }

    /** callback **/
    if (arr.length > 0) {
        await handleFetch(arr);
    } else {
        await handleComplete();
    }
};

const handleComplete = async () => {
    const loading = document.getElementsByClassName('loading-wrapper')[0];
    const loadingSpan = loading.getElementsByTagName('span')[0];

    loadingSpan.textContent = 'LOADING...';
    loading.style.display = 'none';
};

const handleClick = async () => {
    map.on('singleclick', e => {
        const feature = map.forEachFeatureAtPixel(e.pixel, feature => feature);

        if (feature) {
            const coord = e.coordinate;
            const props = feature.getProperties();

            popupInfo(coord, props);
        } else {
            deleteInfoItem();
        }
    });
};