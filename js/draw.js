let draw;
let snap;

class MenuControl extends ol.control.Control {
    /**
     * @param {Object} [opt_options] Control options.
     */
    constructor(opt_options) {
        const options = opt_options || {};

        const container = document.createElement('div');
        container.classList.add('menu-container');

        const menu = document.createElement('nav');
        menu.setAttribute('id', 'menu');

        const ul = document.createElement('ul');

        const li = document.createElement('li');
        li.setAttribute('id', 'planting');

        const i = document.createElement('i');
        i.classList.add('material-icons');
        i.textContent = 'park';

        container.appendChild(menu);
        menu.appendChild(ul);
        ul.appendChild(li);
        li.appendChild(i);

        super({
            element: container,
            target: options.target
        });

        menu.addEventListener('click', this.handleInteractions.bind(this), false);
    }

    handleInteractions = () => {
        const planting = document.getElementById('planting');
        const flag = planting.classList.contains('active');

        if (!flag) {
            addPlantingInteraction();
            planting.classList.add('active');
            closePopup();
        } else {
            removePlantingInteraction();
            planting.classList.remove('active');
        }

        handleMapEvent(!flag);
    };
}

const addControl = async () => {
    map.addControl(new MenuControl());
};

const addPlantingInteraction = () => {
    draw = new ol.interaction.Draw({
        source: getSource(TN_STTREE_W.NAME),
        type: 'Point'
    });

    map.addInteraction(draw);
};

const removePlantingInteraction = () => {
    map.removeInteraction(draw);
};