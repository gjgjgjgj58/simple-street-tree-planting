const createInfoPopup = (coord, props) => {
    const container = document.createElement('div');
    container.setAttribute('id', 'popup');
    createInfoItem(props, container);

    document.body.appendChild(container);

    const overlay = new ol.Overlay({
        id: 'info',
        element: container,
        position: coord,
        positioning: 'bottom-right'
    });

    map.addOverlay(overlay);
};

const updateInfoPopup = (coord, props) => {
    const container = document.getElementById('popup');
    createInfoItem(props, container);

    map.getOverlayById('info').setPosition(coord);
};

const createInfoItem = (props, container) => {
    container.innerHTML = ``;

    for (const [key, value] of Object.entries(props)) {
        if (key === 'geometry') {
            continue;
        }

        const keySpan = document.createElement('span');
        keySpan.innerText = `${key}`;

        const valueSpan = document.createElement('span');
        valueSpan.innerText = `${value}`;

        container.appendChild(keySpan);
        container.appendChild(valueSpan);
    }
};

const deleteInfoItem = (container) => {
    container = document.getElementById('popup');
    if (container) {
        container.innerHTML = ``;
    }
};

const popupInfo = (coord, props) => {
    if (!document.getElementById('popup')) {
        createInfoPopup(coord, props);
    } else {
        updateInfoPopup(coord, props);
    }
};

const openPopup = (coord, feature) => {
    feature.set('featureId', feature.ol_uid);
    popupInfo(coord, feature.getProperties());
    selected = feature;
    TREE_STYLE.variables.selectedFeatureId = feature.ol_uid;

    map.getAllLayers().forEach(layer => {
        layer.changed();
    });
};

const closePopup = () => {
    deleteInfoItem();
    selected = undefined;
    TREE_STYLE.variables.selectedFeatureId = '';

    map.getAllLayers().forEach(layer => {
        layer.changed();
    });
};