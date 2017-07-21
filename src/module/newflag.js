/**
 * @author: robeenlee.lsp
 */
define(function(require, exports, module) {
    var kity = require('../core/kity');

    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');

    Module.register('NewFlagModule', function() {

        var FLAG_PATH = 'M0,0h42v17.9L12.8,18C9.1,14.9,7.2,11.6,7,8.1C6.1,4.4,3.7,1.7,0,0z';
        var NewFlagCommand = kity.createClass('NewFlagCommand', {
            base: Command,

            execute: function(minder) {
                var node = minder.getSelectedNode();
                var markers = node.getData('markers') || [];
                if ( markers.indexOf('new') === -1 ) {
                    markers.push('new');
                }
                node.setData('markers', markers);

                node.render();
                node.getMinder().layout(300);
            },

            queryState: function(minder) {
                return minder.getSelectedNodes().length === 1 ? 0 : -1;
            }
        });

        var NewFlagIcon = kity.createClass('NewFlagIcon', {
            base: kity.Group,

            constructor: function() {
                this.callBase();
                this.path = new kity.Path().setPathData(FLAG_PATH).fill(kity.Color.createHSLA(27, 95, 55, 0.9));
                this.text = new kity.Text('最新').fill('white').setSize(12).setTranslate(12, 12);
                this.addShapes([this.path, this.text]);

                this.setStyle('cursor', 'pointer');
            }
        });

        var NewFlagRenderer = kity.createClass('NewFlagRenderer', {
            base: Renderer,

            create: function(node) {
                return new NewFlagIcon();
            },

            shouldRender: function(node) {
                var markers = node.getData('markers') || [];
                return markers.indexOf('new') !== -1;
            },

            update: function(icon, node, box) {
                var iconBox = icon.getBoundaryBox();
                var x = box.right - iconBox.width;
                var y = box.top;
                icon.setTranslate(x, y);
            }
        });

        return {
            renderers: {
                afteroutline: NewFlagRenderer
            },
            commands: {
                'newFlag': NewFlagCommand
            }
        };
    });
});