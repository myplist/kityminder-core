define(function(require, exports, module) {
    var theme = require('../core/theme');

    ['classic', 'classic-compact'].forEach(function(name) {
        var compact = name == 'classic-compact';

        /* jscs:disable maximumLineLength */
        theme.register(name, {
            'background': '#3A4144',

            'root-color': 'white',
            'root-background': '#4178ff',
            'root-stroke': 'none',
            'root-font-size': 24,
            'root-padding': compact ? [10, 25] : [15, 25],
            'root-margin': compact ? [15, 25] : [30, 100],
            'root-radius': 30,
            'root-space': 4,
            // 'root-shadow': 'rgba(0, 0, 0, .25)',

            'main-color': 'white',
            'main-background': 'transparent',
            'main-stroke': 'none',
            'main-font-size': 12,
            'main-padding': compact ? [5, 10] : [6, 20],
            'main-margin': compact ? [8, 10]  : 15,
            'main-radius': 5,
            'main-space': 4,
            // 'main-shadow': 'rgba(0, 0, 0, .25)',

            'sub-color': 'white',
            'sub-background': 'transparent',
            // 'sub-background': '#55A7FA',
            'sub-stroke': 'none',
            'sub-font-size': 12,
            'sub-padding': [5, 10],
            'sub-margin': compact ? [8, 10] : 15,
            'sub-tree-margin': 30,
            'sub-radius': 5,
            'sub-space': 4,

            'connect-color': 'white',
            'connect-width': 2,
            'main-connect-width': 2,
            'connect-radius': 5,

            // 'selected-background': 'rgb(254, 219, 0)',
            'selected-stroke': 'rgb(254, 219, 0)',
            'selected-stroke-width': '4',
            // 'selected-color': 'black',

            'marquee-background': 'rgba(255,255,255,.3)',
            'marquee-stroke': 'white',

            'drop-hint-color': 'yellow',
            'sub-drop-hint-width': 2,
            'main-drop-hint-width': 4,
            'root-drop-hint-width': 4,

            'order-hint-area-color': 'rgba(0, 255, 0, .5)',
            'order-hint-path-color': '#0f0',
            'order-hint-path-width': 1,

            'text-selection-color': 'rgb(27,171,255)',
            'line-height':1.5
        });
    });
});