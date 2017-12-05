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
            connection.on('mouseover', function(event) {
                var width = +connection.getAttr('stroke-width');
                connection.setAttr('stroke-width', width + 2);
                node.getMinder().fire('node-connection-mouseover', {
                    node: node,
                    originEvent: event.originEvent
                });
            }).on('mouseout', function(event) {
                var width = +connection.getAttr('stroke-width');
                width = width - 2 < 1 ? 2 : width - 2;
                connection.setAttr('stroke-width', width);
                node.getMinder().fire('node-connection-mouseout', {
                    node: node,
                    originEvent: event.originEvent
                });
            }).on('click', function(event) {
                alert(node.getData('text'));
                node.getMinder().fire('node-connection', {
                    node: node,
                    originEvent: event.originEvent
                });
            });

            node._connection = connection;

            this._connectContainer.addShape(connection);
            this.updateConnect(node);
        },
        /**
         * [addRelationship 一对结点只能添加一条关联线]
         * @param {[type]} fromId [description]
         * @param {[type]} toId   [description]
         * @param {[type]} desc   [description]
         */
        addRelationship: function(fromId, toId, desc) {
            this._relationships = this._relationships || [];
            var relationship = this._relationships.find(function(r) {
                return fromId === r.fromId && toId === r.toId;
            });
            if ( !relationship ) {
                var newRelationship = {
                    fromId: fromId,
                    toId: toId,
                    desc: desc
                };
                this._relationships.push(newRelationship);
                newRelationship.connection = this.createRelationship(fromId, toId, desc);
            }
        },
        // 1.虚线 2.最短距离 3.连线两端，有一个节点isExpanded为false就不绘
        createRelationship: function(fromNodeId, toNodeId, desc) {
            var fromNode = this.getNodeById(fromNodeId);
            var toNode = this.getNodeById(toNodeId);
            if ( !fromNode || !toNode ) {
                // 删除关系
                var relationships = this._relationships || [];
                var relationship = relationships.find(function(r) {
                    return fromNodeId === r.fromId && toNodeId === r.toId;
                });
                if ( relationship ) {
                    var index = relationships.indexOf(relationship);
                    relationships.splice(index, 1);
                }
                return;
            }
            // 不绘制的情况
            if ( (fromNode.getParent() && fromNode.getParent().isCollapsed()) 
                    || (toNode.getParent() && toNode.getParent().isCollapsed()) 
                    || !fromNode.attached || !toNode.attached) {
                return;
            }

            var group = new kity.Group();
            var color = kity.Color.createHSLA(27, 95, 55, 0.9);
            this._connectContainer.addShape(group);
            // 创建线条
            var connection = new kity.Path();
            group.addShape(connection);
            connection.setVisible(true);

            // 设置线条样式
            var vconnectMarker = new kity.Marker().pipe(function() {
                var r = 16;
                var path = 'M5.11705799,4.47784466,1.27941416,8.3154885,0.00020978,7.03627389,4.79725434,2.23922932,5.11705799,1.91942567,10.23390621,7.03627389,8.9546916,8.3154885Z'
                var arrow = new kity.Path()
                    .setTranslate(8, -3)
                    // .rotate(180)
                    .setPathData(path)
                    .fill(color);
                this.addShape(arrow);
                this.setRef(r - 1, 0).setViewBox(-r, -r, r + r, r + r).setWidth(r*2).setHeight(r);
                // this.node.setAttribute('markerUnits', 'userSpaceOnUse');
            });
            var hconnectMarker = new kity.Marker().pipe(function() {
                var r = 12;
                var path = 'M5.11705799,4.47784466,1.27941416,8.3154885,0.00020978,7.03627389,4.79725434,2.23922932,5.11705799,1.91942567,10.23390621,7.03627389,8.9546916,8.3154885Z'
                var arrow = new kity.Path()
                    .setTranslate(14, -5)
                    .rotate(90)
                    .setPathData(path)
                    .fill(color);
                this.addShape(arrow);
                this.setRef(r - 1, 0).setViewBox(-r, -r, r + r, r + r).setWidth(r).setHeight(r);
                // this.node.setAttribute('markerUnits', 'userSpaceOnUse');
            });
            connection.stroke(new kity.Pen().pipe(function() {
                this.setColor(color);
                this.setWidth(2);
                this.setDashArray([10, 5]);
            }));
            fromNode.getMinder().getPaper().addResource(vconnectMarker);
            fromNode.getMinder().getPaper().addResource(hconnectMarker);
            

            group.on('mouseover', function() {
                connection.stroke(new kity.Pen().pipe(function() {
                    this.setColor(color);
                    this.setWidth(4);
                    this.setDashArray([10, 5]);
                }));
            }).on('mouseout', function() {
                connection.stroke(new kity.Pen().pipe(function() {
                    this.setColor(color);
                    this.setWidth(2);
                    this.setDashArray([10, 5]);
                }));
            }).on('click', function(event) {
                fromNode.getMinder().fire('relationship', {
                    fromId: fromNodeId,
                    toId: toNodeId,
                    originEvent: event.originEvent
                });
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
                        if ( startEnds[i].type !== 'left' && startEnds[i].type !== 'right' ) {
                            for( j = 0; j < endEnds.length; j++) {
                                distance = Math.abs(startEnds[i].x - endEnds[j].x) + Math.abs(startEnds[i].y - endEnds[j].y) * 0.5; //Vector.fromPoints( startEnds[i], endEnds[j] ).length();
                                if(distance < minDistance) {
                                    minDistance = distance;
                                    nearStart = startEnds[i];
                                    nearEnd = endEnds[j];
                                }
                            }
                        }
                    }

                    return {
                        start: nearStart,
                        end: nearEnd
                    };
                }

                var points = calcPoints(node, parent);
                start = new kity.Point(points.start.x, points.start.y);
                end = new kity.Point(points.end.x, points.end.y);
                if ( points.end.type === 'right' || points.end.type === "left" ) {
                    connection.setMarker(hconnectMarker);
                } else {
                    connection.setMarker(vconnectMarker);
                }

                vector = kity.Vector.fromPoints(start, end);
                pathData.push('M', start);
                pathData.push('A', abs(vector.x), abs(vector.y), 0, 0, (vector.x * vector.y > 0 ? 0 : 1), end);

                connection.setPathData(pathData);
            }
            provider(fromNode, toNode, connection);

            if ( desc ) {
                var declare = new kity.Text(desc).pipe(function() {
                    this.setSize(10);
                    this.fill(fromNode.getStyle('color'));
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
        },
        updateRelationship: function(node) {
            var relationships = this._relationships || [];
            var _self = this;
            relationships.forEach(function(relationship) {
                var nodeId = node.getData('id');
                if ( nodeId === relationship.fromId || nodeId === relationship.toId ) {
                    if ( relationship.connection ) {
                        relationship.connection.remove();
                        relationship.connection = null;
                    }
                    relationship.connection = _self.createRelationship(relationship.fromId, relationship.toId, relationship.desc);
                }
            })
        },
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
                this.updateRelationship(e.node);
            },
            'layoutapply layoutfinish noderender': function(e) {
                this.updateConnect(e.node);
                this.updateRelationship(e.node);
            },
        }
    });

    exports.register = register;
});