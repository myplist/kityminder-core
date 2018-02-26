/**
 * @author: robeenlee.lsp
 */
define(function(require, exports, module) {
    var kity = require('../core/kity');

    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');

    Module.register('RestoreIconModule', function() {

        var FLAG_PATH = 'M7.4,4.7v-2C7.3,1.9,6.6,2.4,6.6,2.4l-4.7,4c-1,0.7-0.1,1.2-0.1,1.2l4.6,4c0.9,0.7,1-0.4,1-0.4V9.5C12.1,8,14,13.9,14,13.9c0.2,0.3,0.3,0,0.3,0C16.1,5.1,7.4,4.7,7.4,4.7z';

        var RestoreIcon = kity.createClass('RestoreIcon', {
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

        var RestoreIconRenderer = kity.createClass('RestoreIconRenderer', {
            base: Renderer,

            create: function(node) {
                var icon = new RestoreIcon();
                icon.on('click', function() {
                    node.getMinder().fire('restore');
                });
                return icon;
            },

            shouldRender: function(node) {
                var minder = node.getMinder();
                return !!minder && minder.isInFocusMode() && node.isRoot();
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
                left: RestoreIconRenderer
            }
        };
    });
});