define(function(require, exports, module) {
    var kity = require('../core/kity');
    var utils = require('../core/utils');

    var Minder = require('../core/minder');
    var MinderNode = require('../core/node');
    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');
    /**
     * 针对不同系统、不同浏览器、不同字体做居中兼容性处理
     * 暂时未增加Linux的处理
     */
    var FONT_ADJUST = {
        'safari': {
            '微软雅黑,Microsoft YaHei': -0.17,
            '楷体,楷体_GB2312,SimKai': -0.1,
            '隶书, SimLi': -0.1,
            'comic sans ms': -0.23,
            'impact,chicago': -0.15,
            'times new roman': -0.1,
            'arial black,avant garde': -0.17,
            'default': 0
        },
        'ie': {
            10: {
                '微软雅黑,Microsoft YaHei': -0.17,
                'comic sans ms': -0.17,
                'impact,chicago': -0.08,
                'times new roman': 0.04,
                'arial black,avant garde': -0.17,
                'default': -0.15
            },
            11: {
                '微软雅黑,Microsoft YaHei': -0.17,
                'arial,helvetica,sans-serif': -0.17,
                'comic sans ms': -0.17,
                'impact,chicago': -0.08,
                'times new roman': 0.04,
                'sans-serif': -0.16,
                'arial black,avant garde': -0.17,
                'default': -0.15
            }
        },
        'edge': {
            '微软雅黑,Microsoft YaHei': -0.15,
            'arial,helvetica,sans-serif': -0.17,
            'comic sans ms': -0.17,
            'impact,chicago': -0.08,
            'sans-serif': -0.16,
            'arial black,avant garde': -0.17,
            'default': -0.15
        },
        'sg': {
            '微软雅黑,Microsoft YaHei': -0.15,
            'arial,helvetica,sans-serif': -0.05,
            'comic sans ms': -0.22,
            'impact,chicago': -0.16,
            'times new roman': -0.03,
            'arial black,avant garde': -0.22,
            'default': -0.15
        },
        'chrome': {
            'Mac': {
                'andale mono': -0.05,
                'comic sans ms': -0.3,
                'impact,chicago': -0.13,
                'times new roman': -0.1,
                'arial black,avant garde': -0.17,
                'default': 0
            },
            'Win': {
                '微软雅黑,Microsoft YaHei': -0.15,
                'arial,helvetica,sans-serif': -0.02,
                'arial black,avant garde': -0.2,
                'comic sans ms': -0.2,
                'impact,chicago': -0.12,
                'times new roman': -0.02,
                'default': -0.15
            },
            'Lux': {
                'andale mono': -0.05,
                'comic sans ms': -0.3,
                'impact,chicago': -0.13,
                'times new roman': -0.1,
                'arial black,avant garde': -0.17,
                'default': 0
            }
        },
        'firefox': {
            'Mac': {
                '微软雅黑,Microsoft YaHei': -0.2,
                '宋体,SimSun': 0.05,
                'comic sans ms': -0.2,
                'impact,chicago': -0.15,
                'arial black,avant garde': -0.17,
                'times new roman': -0.1,
                'default': 0.05
            },
            'Win': {
                '微软雅黑,Microsoft YaHei': -0.16,
                'andale mono': -0.17,
                'arial,helvetica,sans-serif': -0.17,
                'comic sans ms': -0.22,
                'impact,chicago': -0.23,
                'times new roman': -0.22,
                'sans-serif': -0.22,
                'arial black,avant garde': -0.17,
                'default': -0.16
            },
            'Lux': {
                "宋体,SimSun": -0.2,
                "微软雅黑,Microsoft YaHei": -0.2,
                "黑体, SimHei": -0.2,
                "隶书, SimLi": -0.2,
                "楷体,楷体_GB2312,SimKai": -0.2,
                "andale mono": -0.2,
                "arial,helvetica,sans-serif": -0.2,
                "comic sans ms": -0.2,
                "impact,chicago": -0.2,
                "times new roman": -0.2,
                "sans-serif": -0.2,
                "arial black,avant garde": -0.2,
                "default": -0.16
            }
        },
    };

    var UnderTextRenderer = kity.createClass('UnderTextRenderer', {
        base: Renderer,

        create: function(node) {
            var group = new kity.Group().setId(utils.uuid('node_text'));

            group.on('mouseover', function(e) {
                node.getMinder().fire('showmemodetail', {
                    node: node
                });
                console.info('showmemodetail');
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
            var textArr = nodeText ? nodeText.split('\n') : [' '];
            // 样式设置
            var lineHeight = node.getStyle('line-height');
            var fontFamily = getDataOrStyle('font-family') || 'default';
            var fontSize = 8;

            var height = (lineHeight * fontSize) * textArr.length - (lineHeight - 1) * fontSize;
            var yStart = -height / 2;
            var Browser = kity.Browser;
            var adjust;

            if (Browser.chrome || Browser.opera || Browser.bd ||Browser.lb === "chrome") {
                adjust = FONT_ADJUST['chrome'][Browser.platform][fontFamily];
            } else if (Browser.gecko) {
                adjust = FONT_ADJUST['firefox'][Browser.platform][fontFamily];
            } else if (Browser.sg) {
                adjust = FONT_ADJUST['sg'][fontFamily];
            } else if (Browser.safari) {
                adjust = FONT_ADJUST['safari'][fontFamily];
            } else if (Browser.ie) {
                adjust = FONT_ADJUST['ie'][Browser.version][fontFamily];
            } else if (Browser.edge) {
                adjust = FONT_ADJUST['edge'][fontFamily];
            } else if (Browser.lb) {
                // 猎豹浏览器的ie内核兼容性模式下
                adjust = 0.9;
            }
            var paddingLeft = node.getStyle('padding-left');
            textGroup.setTranslate(paddingLeft, (adjust || 0) * fontSize);

            var textLength = textArr.length;
            var textGroupLength = textGroup.getItems().length;

            var i, ci, textShape, text;

            if (textLength < textGroupLength) {
                for (i = textLength, ci; ci = textGroup.getItem(i);) {
                    textGroup.removeItem(i);
                }
            } else if (textLength > textGroupLength) {
                var growth = textLength - textGroupLength;
                while (growth--) {
                    textShape = new kity.Text()
                        .setAttr('text-rendering', 'inherit');
                    if (kity.Browser.ie || kity.Browser.edge) {
                        textShape.setVerticalAlign('top');
                    } else {
                        textShape.setAttr('dominant-baseline', 'text-before-edge');
                    }
                    textGroup.addItem(textShape);
                }
            }

            for (i = 0, text, textShape;
                (text = textArr[i], textShape = textGroup.getItem(i)); i++) {
                textShape.setContent(text);
                if (kity.Browser.ie || kity.Browser.edge) {
                    textShape.fixPosition();
                }
            }


            return (function() {
                var rBox = new kity.Box(),
                    r = Math.round,
                    arrowSpace = 12;
                textGroup.eachItem(function(i, textShape) {
                    var y = yStart + i * fontSize * lineHeight;
                    textShape.setY(box.height / 2 + 2);
                    textShape.setX(box.left + arrowSpace);
                    textShape.fill(kity.Color.createHSLA(360, 8, 80, 0.6));
                    textShape.setSize(fontSize);
                    var bbox = textShape.getBoundaryBox();
                    rBox = rBox.merge(new kity.Box(0, y + box.height, bbox.height && bbox.width || 1, fontSize));
                });
                var path = 'M5.11705799,4.47784466,1.27941416,8.3154885,0.00020978,7.03627389,4.79725434,2.23922932,5.11705799,1.91942567,10.23390621,7.03627389,8.9546916,8.3154885Z'
                var arrow = new kity.Path()
                    .setTranslate(box.left, box.height / 2)
                    .setPathData(path)
                    .fill('grey');
                textGroup.addShapes([arrow]);
                // return new kity.Box(r(rBox.x), r(rBox.y), r(rBox.width), r(rBox.height));
            })();
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
