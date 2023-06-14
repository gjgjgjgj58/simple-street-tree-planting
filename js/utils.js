const getLayer = (layerName) => {
    return map.getLayers().getArray().find(layer => layer.get('name') === layerName);
};

const getSource = (layerName) => {
    return getLayer(layerName).getSource();
};