let map;
let worker;
let selected;

const DEFAULT_PROJECTION = 'EPSG:3857';
const TN_STTREE_W = {
    NAME: 'TREE',
    RADIUS_NAME: 'TREE_R',
    SHP_PATH: 'https://dl.dropboxusercontent.com/s/tsukwd5ufn9w7m1/TN_STTREE_W.shp?dl=1',
    DBF_PATH: 'https://dl.dropboxusercontent.com/s/a1w2wubye2pyz8t/TN_STTREE_W.dbf?dl=1',
    PROJECTION: 'EPSG:4326'
};
const Z_NGII_N3L_A0033320 = {
    NAME: 'STREET',
    SHP_PATH: 'https://dl.dropboxusercontent.com/s/cx3uluzs3efx8g5/Z_NGII_N3L_A0033320.shp?dl=1',
    DBF_PATH: 'https://dl.dropboxusercontent.com/s/2jhoucjc8vkvju7/Z_NGII_N3L_A0033320.dbf?dl=1',
    PROJECTION: 'EPSG:5179'
};
const TREE_STYLE = {
    variables: {
        selectedFeatureId: ''
    },
    symbol: {
        symbolType: 'image',
        src: './images/tree.png',
        size: ['case', ['==', ['get', 'featureId', 'string'], ['var', 'selectedFeatureId']], 64, 32],
        rotateWithView: false,
        offset: [0, 0]
    }
};
const RADIUS_STYLE = [
    new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#736E2C',
            width: 1
        })
    })
];
const STREET_STYLE = [
    new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#BF7069',
            width: 3
        })
    })
];
const SELECTED_STREET_STYLE = [
    new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#BF7069',
            width: 7
        })
    }),
    new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#FFFFFF',
            width: 3
        })
    })
];
const STREET_STYLE_FUNC = (feature) => {
    if (feature.ol_uid === selected?.get('featureId')) {
        return SELECTED_STREET_STYLE;
    } else {
        return STREET_STYLE;
    }
};

proj4.defs(
    'EPSG:5179',
    '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);
ol.proj.proj4.register(proj4);

const init = async () => {
    await createMap();
    await handleFetch([TN_STTREE_W, Z_NGII_N3L_A0033320]);
    await handleMapEvent();
    await addControl();
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
                style: RADIUS_STYLE,
                minZoom: 17
            }),
            new ol.layer.Vector({
                name: Z_NGII_N3L_A0033320.NAME,
                source: new ol.source.Vector(),
                style: STREET_STYLE_FUNC,
                minZoom: 15
            })
        ],
        target: 'map',
        view: new ol.View({
            projection: DEFAULT_PROJECTION,
            /** near Seoul Station **/
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
    const loading = document.getElementsByClassName('loading-wrapper')[0];
    const loadingSpan = loading.getElementsByTagName('span')[0];

    loadingSpan.textContent = 'FETCHING ' + arr[0].NAME + ' DATA...';

    startWorker(arr);
};

const handleMessage = async (msg) => {
    const {geoJSON, arr, data, percent} = msg.data;

    if (typeof percent === 'number') {
        await indicateLoading(percent);
        return;
    }

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

const indicateLoading = async (percent) => {
    const loading = document.getElementsByClassName('loading-wrapper')[0];
    const loadingSpan = loading.getElementsByTagName('span')[2];

    loadingSpan.textContent = percent + '%';
};

const handleComplete = async () => {
    const loading = document.getElementsByClassName('loading-wrapper')[0];

    loading.getElementsByTagName('span')[0].textContent = 'LOADING...';
    loading.getElementsByTagName('span')[2].textContent = '';
    loading.style.display = 'none';
};

const handleMapEvent = async (flag) => {
    if (!flag) {
        map.on('singleclick', handleSingleClickEvent);
        map.on('pointermove', handlePointerMoveEvent);
    } else {
        map.un('singleclick', handleSingleClickEvent);
        map.un('pointermove', handlePointerMoveEvent);
    }
};

const handleSingleClickEvent = (e) => {
    const feature = map.forEachFeatureAtPixel(e.pixel, feature => feature);

    if (feature) {
        openPopup(e.coordinate, feature);
    } else {
        closePopup();
    }
};

const handlePointerMoveEvent = (e) => {
    const pixel = map.getEventPixel(e.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);

    document.getElementById(map.getTarget()).style.cursor = hit ? 'pointer' : '';
};