define(function(require, exports, module) {
    var kity = require('./kity');
    var utils = require('./utils');
    var Module = require('./module');
    var Minder = require('./minder');
    var MinderNode = require('./node');

    // 连线提供方
    var _connectProviders = {};

    function register(name, provider) {
        _connectProviders[name] = provider;
    }

    register('default', function(node, parent, connection) {
        connection.setPathData([
            'M', parent.getLayoutVertexOut(),
            'L', node.getLayoutVertexIn()
        ]);
    });

    kity.extendClass(MinderNode, {
        /**
         * @private
         * @method getConnect()
         * @for MinderNode
         * @description 获取当前节点的连线类型
         *
         * @grammar getConnect() => {string}
         */
        getConnect: function() {
            return this.data.connect || 'default';
        },
        getConnectProvider: function() {
            return _connectProviders[this.getConnect()] || _connectProviders['default'];
        },

        /**
         * @private
         * @method getConnection()
         * @for MinderNode
         * @description 获取当前节点的连线对象
         *
         * @grammar getConnection() => {kity.Path}
         */
        getConnection: function() {
            return this._connection || null;
        }
    });

    kity.extendClass(Minder, {

        getConnectContainer: function() {
            return this._connectContainer;
        },
        /**
         * 只是设置了空connect对象，update的时候会根据template设置值
         * @param node
         */
        createConnect: function(node) {
            if (node.isRoot()) return;

            var connection = new kity.Path();

            node._connection = connection;

            this._connectContainer.addShape(connection);
            this.updateConnect(node);
        },
        // 1.虚线 2.最短距离 3.连线两端，有一个节点isExpanded为false就不绘制
        createNetConnect: function(fromNode, toNode, relationship) {
            var group = new kity.Group();
            this._connectContainer.addShape(group);
            // 创建线索
            var connection = new kity.Path();
            group.addShape(connection);
            connection.setVisible(true);

            var strokeColor = fromNode.getStyle('connect-color') || 'white',
                strokeWidth = fromNode.getStyle('connect-width') || 2;

            // 设置线条样式
            connection.stroke(new kity.Pen().pipe(function() {
                this.setColor(kity.Color.createHSLA(27, 95, 55, 0.9));
                this.setWidth(2);
                this.setDashArray([10, 5]);
            }));

            group.on('mouseover', function() {
                connection.stroke(new kity.Pen().pipe(function() {
                    this.setColor(kity.Color.createHSLA(27, 95, 55, 0.9));
                    this.setWidth(4);
                    this.setDashArray([10, 5]);
                }));
            }).on('mouseout', function() {
                connection.stroke(new kity.Pen().pipe(function() {
                    this.setColor(kity.Color.createHSLA(27, 95, 55, 0.9));
                    this.setWidth(2);
                    this.setDashArray([10, 5]);
                }));
            });

            // 线条绘制
            var provider = function(node, parent, connection) {
                var box = node.getLayoutBox(),
                    pBox = parent.getLayoutBox();

                var start, end, vector;
                var abs = Math.abs;
                var pathData = [];
                var side = box.x > pBox.x ? 'right' : 'left';
                // TODO 需要一个算法绘制最短路径
                var getConnectPoints = function( node ) {
                    var box = node.getLayoutBox();
                    var x1 = box.x, x2 = box.x + box.width,
                        y1 = box.y, y2 = box.y + box.height,
                        xm = box.cx, ym = box.cy;
                    return [
                        { x: xm, y: y1, type: 'top' }, // top
                        { x: x2, y: ym, type: 'right' }, // right
                        { x: xm, y: y2, type: 'bottom' }, // bottom
                        { x: x1, y: ym, type: 'left' } // left
                    ];
                }
                var calcPoints = function(startNode, endNode) {
                    var startEnds = getConnectPoints(startNode),
                        endEnds = getConnectPoints(endNode);
                    var nearStart, nearEnd, minDistance = Number.MAX_VALUE;
                    var i, j, startEnd, endEnd, distance;
                    // 寻找最近的粘附点
                    // 暴力解法：可优化但不必要，因为点集不会很大
                    for( i = 0; i < startEnds.length; i++) {
                        for( j = 0; j < endEnds.length; j++) {
                            distance = Math.abs(startEnds[i].x - endEnds[j].x) + Math.abs(startEnds[i].y - endEnds[j].y) * 0.5; //Vector.fromPoints( startEnds[i], endEnds[j] ).length();
                            if(distance < minDistance) {
                                minDistance = distance;
                                nearStart = startEnds[i];
                                nearEnd = endEnds[j];
                            }
                        }
                    }

                    return {
                        start: nearStart,
                        end: nearEnd
                    };
                }

                let points = calcPoints(node, parent);
                start = new kity.Point(points.start.x, points.start.y);
                end = new kity.Point(points.end.x, points.end.y);

                vector = kity.Vector.fromPoints(start, end);
                pathData.push('M', start);
                pathData.push('A', abs(vector.x), abs(vector.y), 0, 0, (vector.x * vector.y > 0 ? 0 : 1), end);

                connection.setPathData(pathData);
            }
            provider(fromNode, toNode, connection, strokeWidth, strokeColor);

            if ( relationship ) {
                var declare = new kity.Text(relationship).pipe(function() {
                    this.setSize(10);
                    this.fill(kity.Color.createHSLA(27, 95, 55, 0.9));
                    this.setX(36);
                });
                declare.setPath(connection);
                group.addShape(declare);
            }

            return group;
        },

        removeConnection: function(connection) {
            this._connectContainer.removeShape(connection);
        },

        removeConnect: function(node) {
            var me = this;
            node.traverse(function(node) {
                me._connectContainer.removeShape(node._connection);
                node._connection = null;
            });
        },
        /**
         * 事件驱动connect更新重绘
         * @param node
         */
        updateConnect: function(node) {

            var connection = node._connection;
            var parent = node.parent;

            if (!parent || !connection) return;

            if (parent.isCollapsed()) {
                connection.setVisible(false);
                return;
            }
            connection.setVisible(true);

            var provider = node.getConnectProvider();

            var strokeColor = node.getStyle('connect-color') || 'white',
                strokeWidth = node.getStyle('connect-width') || 2;

            connection.stroke(strokeColor, strokeWidth);

            provider(node, parent, connection, strokeWidth, strokeColor);

            if (strokeWidth % 2 === 0) {
                connection.setTranslate(0.5, 0.5);
            } else {
                connection.setTranslate(0, 0);
            }
        }
    });

    Module.register('Connect', {
        init: function() {
            this._connectContainer = new kity.Group().setId(utils.uuid('minder_connect_group'));
            this.getRenderContainer().prependShape(this._connectContainer);
        },
        events: {
            'nodeattach': function(e) {
                this.createConnect(e.node);
            },
            'nodedetach': function(e) {
                this.removeConnect(e.node);
            },
            'layoutapply layoutfinish noderender': function(e) {
                this.updateConnect(e.node);
            }
        }
    });

    exports.register = register;
});