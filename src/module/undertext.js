define(function(require, exports, module) {
    var kity = require('../core/kity');
    var utils = require('../core/utils');

    var Minder = require('../core/minder');
    var MinderNode = require('../core/node');
    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');
    var UnderTextRenderer = kity.createClass('UnderTextRenderer', {
        base: Renderer,

        create: function(node) {
            var group = new kity.Group().setId(utils.uuid('node_undertext'));

            group.on('mouseover', function(e) {
                node.getMinder().fire('showmemodetail', {
                    node: node
                });
            });
            group.on('mouseout', function(e) {
                node.getMinder().fire('hidememodetail', {
                    node: node
                });
            });
            group.setStyle('cursor', 'pointer');

            return group;
        },

        update: function(textGroup, node, box) {
            function getDataOrStyle(name) {
                return node.getData(name) || node.getStyle(name);
            }
            // 有就渲染
            var nodeText = node.getData('memo');
            if ( !nodeText ) {
                return;
            }
            // 清除
            var textGroupLength = textGroup.getItems().length;
            while ( textGroupLength > 0 ) {
                textGroup.removeItem(--textGroupLength);
            }
            // 样式设置
            var fontSize = 10;
            var paddingLeft = node.getStyle('padding-left');
            var arrowSpace = 12;
            textGroup.setTranslate(paddingLeft, 0);
            var textShape = new kity.Text(nodeText).pipe(function() {
                this.setY(box.bottom + fontSize);
                this.setX(box.left + arrowSpace);
                this.fill('grey');
                this.setSize(fontSize);
            });
            var path = 'M5.11705799,4.47784466,1.27941416,8.3154885,0.00020978,7.03627389,4.79725434,2.23922932,5.11705799,1.91942567,10.23390621,7.03627389,8.9546916,8.3154885Z'
            var arrow = new kity.Path()
                .setTranslate(box.left, box.height / 2)
                .setPathData(path)
                .fill('grey');
            textGroup.addShapes([arrow, textShape]);
        }
    });

    var UnderTextCommand = kity.createClass({
        base: Command,
        execute: function(minder, text) {
            var node = minder.getSelectedNode();
            if (node) {
                node.setData('memo', text);
                node.render();
                minder.layout();
            }
        },
        queryState: function(minder) {
            return minder.getSelectedNodes().length == 1 ? 0 : -1;
        },
        queryValue: function(minder) {
            var node = minder.getSelectedNode();
            return node ? node.getData('memo') : null;
        }
    });

    Module.register('undertext', {
        'commands': {
            'undertext': UnderTextCommand
        },
        'renderers': {
            afteroutline: UnderTextRenderer
        }
    });

    module.exports = UnderTextRenderer;
});
