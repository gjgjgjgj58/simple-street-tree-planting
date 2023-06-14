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
    deleteInfoItem(container);
    createInfoItem(props, container);

    map.getOverlayById('info').setPosition(coord);
};

const createInfoItem = (props, container) => {
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
    container = !container ? document.getElementById('popup') : container;
    container.innerHTML = ``;
};

const popupInfo = (coord, props) => {
    if (!document.getElementById('popup')) {
        createInfoPopup(coord, props);
    } else {
        updateInfoPopup(coord, props);
    }
};