define(function(require, exports, module) {
    var kity = require('../core/kity');
    var utils = require('../core/utils');

    var Minder = require('../core/minder');
    var MinderNode = require('../core/node');
    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');

    Module.register('image', function() {
        function loadImageSize(url, callback) {
            var img = document.createElement('img');
            img.onload = function() {
                callback(img.width, img.height);
            };
            img.onerror = function() {
                callback(null);
            };
            img.src = url;
        }

        function fitImageSize(width, height, maxWidth, maxHeight) {
            var ratio = width / height,
                fitRatio = maxWidth / maxHeight;

            // 宽高比大于最大尺寸的宽高比，以宽度为标准适应
            if (width > maxWidth && ratio > fitRatio) {
                width = maxWidth;
                height = width / ratio;
            } else if (height > maxHeight) {
                height = maxHeight;
                width = height * ratio;
            }

            return {
                width: width | 0,
                height: height | 0
            };
        }

        /**
         * @command Image
         * @description 为选中的节点添加图片
         * @param {string} url 图片的 URL，设置为 null 移除
         * @param {string} title 图片的说明
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         * @return 返回首个选中节点的图片信息，JSON 对象： `{url: url, title: title}`
         */
        var ImageCommand = kity.createClass('ImageCommand', {
            base: Command,

            execute: function(km, url, title) {
                var nodes = km.getSelectedNodes();

                loadImageSize(url, function(width, height) {
                    nodes.forEach(function(n) {
                        var size = fitImageSize(
                            width, height,
                            km.getOption('maxImageWidth'),
                            km.getOption('maxImageHeight'));
                        n.setData('image', url);
                        n.setData('imageTitle', url && title);
                        n.setData('imageSize', url && size);
                        n.render();
                    });
                    km.fire('saveScene');
                    km.layout(300);
                });

            },
            queryState: function(km) {
                var nodes = km.getSelectedNodes(),
                    result = 0;
                if (nodes.length === 0) {
                    return -1;
                }
                nodes.forEach(function(n) {
                    if (n && n.getData('image')) {
                        result = 0;
                        return false;
                    }
                });
                return result;
            },
            queryValue: function(km) {
                var node = km.getSelectedNode();
                return {
                    url: node.getData('image'),
                    title: node.getData('imageTitle')
                };
            }
        });

        var ImageRenderer = kity.createClass('ImageRenderer', {
            base: Renderer,

            create: function(node) {
                var group = new kity.Group().setId(utils.uuid('node_image'));
                return group;
            },

            shouldRender: function(node) {
                var pNode = node.getParent();
                if ( pNode && pNode.isCollapsed() ) {
                    return false;
                }
                return node.getData('image');
            },

            update: function(imageGroup, node, box) {
                // 清除
                var imageGroupLength = imageGroup.getItems().length;
                while ( imageGroupLength > 0 ) {
                    imageGroup.removeItem(--imageGroupLength);
                }
                var image = new kity.Image(node.getData('image'));
                var url = node.getData('image');
                var title = node.getData('imageTitle');
                var size = node.getData('imageSize');
                var spaceTop = node.getStyle('space-top');

                if (!size) return;

                if (title) {
                    image.node.setAttributeNS('http://www.w3.org/1999/xlink', 'title', title);
                }

                var x = box.cx - size.width / 2;
                var y = box.y - size.height - spaceTop;

                image
                    .setUrl(url)
                    .setWidth(size.width | 0)
                    .setHeight(size.height | 0);
                imageGroup.addShape(image);
                var minusPath = 'M9.60 5.92H0.64V4.32h8.96v1.60z';
                var minus = new kity.Path()
                    .setTranslate(size.width + 4, 0)
                    .setPathData(minusPath)
                    .fill('white');
                minus.on('click', function() {
                    var height = node.getData('imageSize').height;
                    var width = node.getData('imageSize').width;
                    var ratio = height / width;
                    if ( height > 200 ) {
                        height -= 100;
                        width = height / ratio;
                        var imageSize = {
                            height: height,
                            width: width
                        };
                        node.setData('imageSize', imageSize);
                        node.getMinder().refresh();
                    }
                });
                minus.setStyle('cursor', 'pointer');
                imageGroup.addShape(minus);
                var plusPath = 'M10.24 4.38857143H5.85142857V0H4.38857143v4.38857143H0v1.46285714h4.38857143v4.38857143h1.46285714V5.85142857h4.38857143z';
                var plus = new kity.Path()
                    .setTranslate(size.width + 4, 18)
                    .setPathData(plusPath)
                    .fill('white');
                plus.setStyle('cursor', 'pointer');
                plus.on('click', function() {
                    var height = node.getData('imageSize').height;
                    var width = node.getData('imageSize').width;
                    var ratio = height / width;
                    if ( height < 500 ) {
                        height += 100;
                        width = height / ratio;
                        var imageSize = {
                            height: height,
                            width: width
                        };
                        node.setData('imageSize', imageSize);
                        node.getMinder().refresh();
                    }
                });
                imageGroup.addShape(plus);

                var imageUrl = node.getData('image');
                if ( imageUrl && imageUrl.indexOf('restapi.amap.com') !== -1 ) {
                    var zoomInPath = 'M8.7,6.2H5.3C4.8,6.2,4.5,6.6,4.5,7c0,0,0,0,0,0c0,0.4,0.3,0.8,0.8,0.8h3.5c0.4,0,0.8-0.3,0.8-0.8C9.5,6.6,9.2,6.2,8.7,6.2zM14.6,13.5l-3.2-3.2c1.8-2.4,1.4-5.9-1.1-7.7S4.4,1.2,2.5,3.6s-1.4,5.9,1.1,7.7c1,0.7,2.1,1.1,3.3,1.1c1.2,0,2.4-0.4,3.3-1.1l3.2,3.2c0.3,0.3,0.7,0.3,0.9,0c0,0,0,0,0,0l0.1-0.1C14.8,14.2,14.8,13.8,14.6,13.5z M6.9,10.9c-2.2,0-4-1.8-4-4s1.8-4,4-4s4,1.8,4,4S9.1,10.9,6.9,10.9z';
                    var zoomIn = new kity.Path()
                        .setTranslate(size.width + 3, 36)
                        .setPathData(zoomInPath)
                        .fill('white');
                    zoomIn.setStyle('cursor', 'pointer');
                    zoomIn.on('click', function() {
                        var zoomRegex = /.*(zoom=\d{1,2}).*/g;
                        var zoomKV = zoomRegex.exec(node.getData('image'))[1];
                        var zoomValue = +zoomKV.split('=')[1];

                        if ( zoomValue > 1 ) {
                            zoomValue -= 1;
                            node.setData('image', node.getData('image').replace(zoomKV, 'zoom=' + zoomValue));
                            node.getMinder().refresh();
                        }
                    });
                    imageGroup.addShape(zoomIn);

                    var zoomOutPath = 'M8,5.7C7.6,5.7,7.2,6,7.2,6.4S7.6,7.2,8,7.2h0.8V8c0,0.4,0.3,0.8,0.8,0.8s0.8-0.3,0.8-0.8V7.2h0.8c0.4,0,0.8-0.3,0.8-0.8s-0.3-0.8-0.8-0.8h-0.8V4.9c0-0.4-0.3-0.8-0.8-0.8S8.8,4.5,8.8,4.9v0.8L8,5.7z M1.4,12.9c-0.5,0.5-0.5,1.3,0,1.7c0.5,0.5,1.3,0.5,1.7,0l3.6-3.6c0.8,0.5,1.8,0.8,2.9,0.8c3,0,5.4-2.4,5.4-5.4c0-3-2.4-5.4-5.4-5.4S4.1,3.4,4.1,6.4c0,1.1,0.3,2,0.8,2.9L1.4,12.9z M5.7,6.4c0-2.1,1.7-3.9,3.9-3.9s3.9,1.7,3.9,3.9s-1.7,3.9-3.9,3.9S5.7,8.6,5.7,6.4z';
                    var zoomOut = new kity.Path()
                        .setTranslate(size.width, 56)
                        .setPathData(zoomOutPath)
                        .fill('white');
                    zoomOut.setStyle('cursor', 'pointer');
                    zoomOut.on('click', function() {
                        var zoomRegex = /.*(zoom=\d{1,2}).*/g;
                        var zoomKV = zoomRegex.exec(node.getData('image'))[1];
                        var zoomValue = +zoomKV.split('=')[1];

                        if ( zoomValue < 17 ) {
                            zoomValue += 1;
                            node.setData('image', node.getData('image').replace(zoomKV, 'zoom=' + zoomValue));
                            node.getMinder().refresh();
                        }
                    });
                    imageGroup.addShape(zoomOut);
                }

                imageGroup.setTranslate(x, y);
                return new kity.Box(x | 0, y | 0, size.width + 8| 0, size.height | 0);
            }
        });

        return {
            'defaultOptions': {
                'maxImageWidth': 200,
                'maxImageHeight': 200
            },
            'commands': {
                'image': ImageCommand
            },
            'renderers': {
                'top': ImageRenderer
            }
        };
    });
});