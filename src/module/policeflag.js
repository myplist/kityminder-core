/**
 * @author: robeenlee.lsp
 */
define(function(require, exports, module) {
    var kity = require('../core/kity');

    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');

    Module.register('PoliceFlagModule', function() {

        var FLAG_PATH = 'M7.9,15.7c-0.5,0-1.6-0.2-2.6-0.8c-0.8-0.4-1.9-1.2-2.4-2.5l0,0l-0.1,0c-0.5-0.1-1-0.4-1.4-0.8c-0.3-0.3-0.7-0.7-0.7-1.3c0-0.9,0.5-1.6,1.2-1.9l0.1,0V8.2C2.2,8.1,2.3,8,2.4,8l0,0v0c0-0.2,0-0.3,0.1-0.5l0,0V7.2l0,0c0,0-0.1-0.1-0.1-0.1c0.4-0.1,2.2-0.7,5.6-0.7c3.3,0,5.2,0.5,5.6,0.7c0,0-0.1,0.1-0.1,0.1l-0.2,0.2h0.2c0,0,0,0.1,0,0.2c0,0.1,0.1,0.2,0.1,0.3v0l0,0C13.7,8,13.7,8,13.7,8.1v0.2l0.1,0c0.8,0.3,1.2,1,1.1,2l0,0v0c0,0.4-0.2,0.9-0.7,1.3c-0.4,0.4-0.9,0.7-1.4,0.8l-0.1,0l0,0c-0.5,1.3-1.5,2-2.4,2.5C9.5,15.4,8.5,15.7,7.9,15.7C7.9,15.7,7.9,15.7,7.9,15.7z M4,11.8c0.5,2,3.2,2.8,4,2.8c0.4,0,1.3-0.2,2.1-0.7c0.7-0.4,1.6-1.1,1.9-2.2l0,0v0c0-0.2,0.2-0.3,0.5-0.3c0.3,0,0.8-0.3,1.1-0.7c0.1-0.2,0.2-0.4,0.1-0.6c0-0.3-0.1-0.5-0.2-0.6l-0.1-0.1l-0.1,0.1c-0.1,0.1-0.2,0.1-0.4,0.1c-0.3,0-0.5-0.2-0.5-0.4V8.8c0-0.2,0-0.5-0.1-0.7l0-0.1L12.3,8c-0.9,0.5-2.6,1.1-4.4,1.1C6.1,9.1,4.4,8.4,3.5,8L3.4,7.9v0.2c0,0.1,0,0.2,0,0.3c0,0.1-0.1,0.3-0.1,0.4v0.5c0,0.2-0.2,0.4-0.5,0.4c-0.1,0-0.3-0.1-0.4-0.1L2.3,9.4L2.3,9.6c-0.1,0.2-0.2,0.4-0.2,0.7c0,0.3,0.4,0.7,0.6,0.8c0.3,0.2,0.6,0.4,0.8,0.4C3.7,11.5,3.9,11.6,4,11.8C4,11.8,4,11.8,4,11.8z M1.7,5.9C1.6,5.4,1.2,4.8,0.8,4.3C0.6,4,0.5,3.8,0.4,3.6C0.2,3.4,0.3,3.3,0.3,3.3c0,0,0,0,0.1,0c3.5,0,5-1.2,6-2.1C7,0.7,7.4,0.4,8,0.4c0.6,0,1.1,0.4,1.8,0.9c1.1,0.9,2.7,2,5.8,2c0.1,0,0.1,0,0.1,0c0,0,0,0.1-0.2,0.3c-0.1,0.1-0.3,0.3-0.5,0.5c-0.6,0.6-1.3,1.3-1.3,1.8c-0.2-0.1-0.6-0.2-1.3-0.3c-0.9-0.1-2.3-0.3-4.4-0.3C4.6,5.4,2.2,5.8,1.7,5.9C1.7,5.9,1.7,5.9,1.7,5.9z M6.4,3.7c0,0.3,0.3,0.6,0.8,0.9C7.6,4.9,8,5,8,5l0,0l0,0c0,0,0.4-0.2,0.8-0.4C9.3,4.3,9.6,4,9.6,3.7V3.6H9.5V2.4H6.4L6.4,3.7L6.4,3.7z';
        var PoliceFlagCommand = kity.createClass('PoliceFlagCommand', {
            base: Command,

            execute: function(minder) {
                var node = minder.getSelectedNode();
                var markers = node.getData('markers') || [];
                if ( markers.indexOf('police') === -1 ) {
                    markers.push('police');
                }
                node.setData('markers', markers);

                node.render();
                node.getMinder().layout(300);
            },

            queryState: function(minder) {
                return minder.getSelectedNodes().length === 1 ? 0 : -1;
            }
        });

        var PoliceFlagIcon = kity.createClass('PoliceFlagIcon', {
            base: kity.Group,

            constructor: function() {
                this.callBase();
                this.width = 20;
                this.height = 20;
                // 添加police marker
                this.addShape(new kity.Path().pipe(function() {
                    this.setPathData(FLAG_PATH);
                    this.fill('white');
                }));

                this.setStyle('cursor', 'pointer');
            }
        });

        var PoliceFlagRenderer = kity.createClass('PoliceFlagRenderer', {
            base: Renderer,

            create: function(node) {
                return new PoliceFlagIcon();
            },

            shouldRender: function(node) {
                var markers = node.getData('markers') || [];
                return markers.indexOf('police') !== -1;
            },

            update: function(icon, node, box) {
                var spaceLeft = node.getStyle('space-left');
                var iconBox = icon.getBoundaryBox();
                var x = box.left - iconBox.width - spaceLeft;
                var y = -icon.height / 2;
                icon.setTranslate(x, y);

                return new kity.Box({
                    x: x,
                    y: y,
                    width: icon.width,
                    height: icon.height
                });
            }
        });

        return {
            renderers: {
                left: PoliceFlagRenderer
            },
            commands: {
                'policeFlag': PoliceFlagCommand
            }
        };
    });
});