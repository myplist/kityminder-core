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
        // addRelationship: function(fromId, toId, desc, dashed) {
        addRelationship: function(options) {
            this._relationships = this._relationships || [];
            var relationship = this._relationships.find(function(r) {
                return options.fromId === r.fromId && options.toId === r.toId;
            });
            if ( !relationship ) {
                // var newRelationship = {
                //     fromId: fromId,
                //     toId: toId,
                //     desc: desc,
                //     dashed: dashed === undefined ? true : dashed
                // };
                this._relationships.push(options);
                options.connection = this.createRelationship(options);
                return options;
            }
        },
        // 1.虚线 2.最短距离 3.连线两端，有一个节点isExpanded为false就不绘
        // createRelationship: function(fromId, toId, desc, dashed, noarrow) {
        createRelationship: function(options) {
            options.dashed = options.dashed === undefined ? true : options.dashed;
            var fromNode = this.getNodeById(options.fromId);
            var toNode = this.getNodeById(options.toId);
            // if ( !fromNode || !toNode ) {
            //     // 删除关系
            //     var relationships = this._relationships || [];
            //     var relationship = relationships.find(function(r) {
            //         return fromNodeId === r.fromId && toNodeId === r.toId;
            //     });
            //     if ( relationship ) {
            //         var index = relationships.indexOf(relationship);
            //         relationships.splice(index, 1);
            //     }
            //     return;
            // }
            // 不绘制的情况
            if ( (fromNode.getParent() && fromNode.getParent().isCollapsed()) 
                    || (toNode.getParent() && toNode.getParent().isCollapsed()) 
                    || !fromNode.attached || !toNode.attached) {
                return;
            }
            // 线条绘制
            var provider = function(node, parent, connection, options) {
                var dashed = options.dashed;
                var noarrow = options.noarrow;
                var lineType = options.lineType;
                // 是否是虚线
                if ( dashed ) {
                    var box = node.getLayoutBox(),
                        pBox = parent.getLayoutBox();

                    var start, end, vector;
                    var abs = Math.abs;
                    var pathData = [];
                    // 是否需要箭头
                    if ( !noarrow ) {
                        var getConnectPoints = function( node, dashed ) {
                            var box = node.getLayoutBox();
                            var x1 = box.x, x2 = box.x + box.width,
                                y1 = box.y, y2 = box.y + box.height,
                                xm = box.cx, ym = box.cy;
                            return dashed ? [
                                { x: xm, y: ym, type: 'center' }, // center
                                { x: xm, y: y1, type: 'top' }, // top
                                { x: x2, y: ym, type: 'right' }, // right
                                { x: xm, y: y2, type: 'bottom' }, // bottom
                                { x: x1, y: ym, type: 'left' } // left
                            ] : [
                                { x: x2, y: ym, type: 'right' }, // right
                                { x: x1, y: ym, type: 'left' } // left
                            ];
                        }
                        var calcPoints = function(startNode, endNode, dashed) {
                            var startEnds = dashed ? getConnectPoints(startNode, dashed).slice(0,1) : getConnectPoints(startNode, dashed),
                                endEnds = dashed ? getConnectPoints(endNode, dashed).slice(1) : getConnectPoints(endNode, dashed);
                            var nearStart, nearEnd, minDistance = Number.MAX_VALUE;
                            var i, j, startEnd, endEnd, distance;
                            // 寻找最近的粘附点
                            for( i = 0; i < startEnds.length; i++) {
                                for( j = 0; j < endEnds.length; j++) {
                                    distance = Math.abs(startEnds[i].x - endEnds[j].x) + Math.abs(startEnds[i].y - endEnds[j].y) * 0.5;
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

                        var points = calcPoints(parent, node, dashed);
                        start = new kity.Point(points.start.x, points.start.y);
                        end = new kity.Point(points.end.x, points.end.y);
                        switch ( points.end.type ) {
                            case 'top':
                                end = new kity.Point(points.end.x, points.end.y - 12);
                                break;
                            case 'right':
                                end = new kity.Point(points.end.x + 12, points.end.y);
                                break;
                            case 'bottom':
                                end = new kity.Point(points.end.x, points.end.y + 12);
                                break;
                            case 'left':
                                end = new kity.Point(points.end.x - 12, points.end.y);
                                break;
                            default:
                                end = new kity.Point(points.end.x, points.end.y);
                                break;
                        }
                        // 设置线条箭头
                        var color = options.lineColor || kity.Color.createHSLA(27, 95, 55, 0.9);
                        var vconnectMarker = new kity.Marker().pipe(function() {
                            var path = 'M 0 0 L 3 6 L 6 0 z';
                            var arrow = new kity.Path()
                                .setPathData(path)
                                .fill(color);
                            this.addShape(arrow);
                            this.setRef(3,1).setWidth(6).setHeight(6);
                        });
                        var hconnectMarker = new kity.Marker().pipe(function() {
                            var path = 'M 0 0 L 6 3 L 0 6 z';
                            var arrow = new kity.Path()
                                .setPathData(path)
                                .fill(color);
                            this.addShape(arrow);
                            this.setRef(1,3).setWidth(6).setHeight(6);
                        });
                        node.getMinder().getPaper().addResource(vconnectMarker);
                        node.getMinder().getPaper().addResource(hconnectMarker);

                        if ( points.end.type === 'right' || points.end.type === "left" ) {
                            connection.setMarker(hconnectMarker);
                        } else {
                            connection.setMarker(vconnectMarker);
                        }
                    } else {
                        end = new kity.Point(box.cx, box.cy);
                        start = new kity.Point(pBox.cx, pBox.cy);
                    }
                    // 根据start,end绘制线条
                    vector = kity.Vector.fromPoints(start, end);
                    pathData.push('M', start);
                    pathData.push('A', abs(vector.x), abs(vector.y), 0, 0, (vector.x * vector.y > 0 ? 0 : 1), end);
                    connection.setPathData(pathData);
                } else {
                    var provider = _connectProviders[lineType || 'arc'];
                    provider(toNode, fromNode, connection);
                }
            }
            var connection = options.connection;
            if ( !connection ) {
                var group = new kity.Group();
                var color = options.lineColor || kity.Color.createHSLA(27, 95, 55, 0.9);
                this._connectContainer.addShape(group);
                // 创建线条
                var connection = new kity.Path();
                group.addShape(connection);
                connection.setVisible(true);
                // 设置线条颜色
                connection.stroke(new kity.Pen().pipe(function() {
                    if ( options.dashed ) {
                        this.setColor(color);
                        this.setDashArray([10, 5]);
                    } else {
                        this.setColor(fromNode.getStyle('connect-color') || 'white');
                    }
                    this.setWidth(options.lineWeight || 2);
                }));

                // 线条的交互反馈
                if ( options.dashed ) {
                    group.on('mouseover', function() {
                        connection.stroke(new kity.Pen().pipe(function() {
                            this.setColor(color);
                            this.setWidth(6);
                            this.setDashArray([10, 5]);
                        }));
                    }).on('mouseout', function() {
                        connection.stroke(new kity.Pen().pipe(function() {
                            this.setColor(color);
                            this.setWidth(options.lineWeight || 2);
                            this.setDashArray([10, 5]);
                        }));
                    }).on('click', function(event) {
                        fromNode.getMinder().fire('relationship', {
                            fromId: options.fromId,
                            toId: options.toId,
                            originEvent: event.originEvent
                        });
                    }).on('contextmenu', function(event) {
                         fromNode.getMinder().fire('relationship.contextmenu', {
                            fromId: options.fromId,
                            toId: options.toId,
                            originEvent: event.originEvent
                        });
                    });
                }
                provider(toNode, fromNode, connection, options);
                // 线条描述
                if ( options.desc ) {
                    var declare = new kity.Text(options.desc).pipe(function() {
                        var box1 = toNode.getLayoutBox(),
                            box2 = fromNode.getLayoutBox();
                        this.setSize(options.fontSize || 11);
                        this.fill(options.color || fromNode.getStyle('color'));
                        this.setX( Math.floor(Math.sqrt(Math.pow(box1.cx - box2.cx,2) + Math.pow(box1.cy - box2.cy,2)) / 3) );
                        this.setTextAnchor('middle');
                        this.setVerticalAlign('bottom');
                    });
                    declare.setPath(connection);
                    group.addShape(declare);
                }

                return group;
            } else {
                provider(toNode, fromNode, connection.getItems()[0], options);
                // 线条描述
                connection.getItems()[1] && connection.getItems()[1].pipe(function() {
                    var box1 = toNode.getLayoutBox(),
                        box2 = fromNode.getLayoutBox();
                    this.setSize(options.fontSize || 11);
                    this.fill(options.color || fromNode.getStyle('color'));
                    this.setX( Math.floor(Math.sqrt(Math.pow(box1.cx - box2.cx,2) + Math.pow(box1.cy - box2.cy,2)) / 3) );
                    this.setTextAnchor('middle');
                    this.setVerticalAlign('bottom');
                });

                return connection;
            }
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
        removeRelationship: function(node) {
            (this._relationships || []).forEach(function(relationship) {
                var nodeId = node.getData('id');
                if ( nodeId === relationship.fromId || nodeId === relationship.toId ) {
                    // // 存在且可见
                    if ( relationship.connection && relationship.connection.getAttr('display') !== 'none' ) {
                        relationship.connection.remove();
                        relationship.connection = null;
                    }
                }
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
            if ( node.getData('connectVisible') !== undefined ) {
                connection.setVisible(node.getData('connectVisible'));
            } else {
                connection.setVisible(true);
            }

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
            // 只要一端节点不存在，删除连线
            this._relationships = relationships.filter(function(relationship) {
                if ( !_self.getNodeById(relationship.fromId) || !_self.getNodeById(relationship.toId) ) {
                    if ( relationship.connection ) {
                        relationship.connection.remove();
                        relationship.connection = null;
                    }
                    return false;
                } else {
                    if ( relationship.hide && relationship.connection ) {
                        relationship.connection.remove();
                        relationship.connection = null;
                    }
                    return true;
                }
            });
            // 刷新
            this._relationships.forEach(function(relationship) {
                if ( !relationship.hide ) {
                    var nodeId = node.getData('id');
                    if ( nodeId === relationship.fromId || nodeId === relationship.toId ) {
                        relationship.connection = _self.createRelationship(relationship);
                    }
                }
            });
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
                this.updateRelationship(e.node);
            },
            'nodedetach': function(e) {
                this.removeConnect(e.node);
                this.removeRelationship(e.node);
            },
            'layoutapply': function(e) {
                this.updateConnect(e.node);
                this.updateRelationship(e.node);
            },
        }
    });

    exports.register = register;
});