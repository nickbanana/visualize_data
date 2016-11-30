/*Copyright (c) 2013-2016, Rob Schmuecker
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* The name Rob Schmuecker may not be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/



var app = angular.module("app", ["xeditable", "ngTagsInput", "ngDialog"], function ($interpolateProvider)
{ $interpolateProvider.startSymbol('[[').endSymbol(']]'); });

app.filter('prettyJSON', function () {
    return function (json) { return angular.toJson(json, true); }
});

/*class Rule
{
    constructor(name)
    {
        this.rulename = name;
        this.conceptset = [];
        this.responseset = [];
        this.childset = [];
    }
    
    addChild(name)
    {
        this.childset.push(name);
    }

    addResponse(string)
    {
        this.responseset.push(string);
    }

    addconcept(concept)
    {
        this.conceptset.push(concept);
    }
}*/

var test =
    [
        {
            "domain": "test",
            "response": [],
            "concepts": [],
            "children": [{
                "domain": "test1",
                "response": [],
                "concepts": [],
                "children": [{
                    "domain": "test2",
                    "response": [],
                    "concepts": [],
                    "children": []
                }]
            }, {
                "domain": "test3",
                "response": [],
                "concepts": [],
                "children": []
            }]
        },
        {
            "domain": "test1",
            "response": [],
            "concepts": [],
            "children": [{
                "domain": "test2",
                "response": [],
                "concepts": [],
                "children": []
            }]
        },
        {
            "domain": "test2",
            "response": [],
            "concepts": [],
            "children": []
        },
        {
            "domain": "test3",
            "response": [],
            "concepts": [],
            "children": []
        }

    ];




function Rule(domain, response, concepts, children) {
    this.domain = domain;
    this.children = children;
    this.response = response;
    this.concepts = concepts;
}

function GenerateTree(list) {
    var Return_Obj = new Rule(list[0].domain, list[0].response, list[0].concepts, list[0].children);
    Return_Obj = recursion(Return_Obj, list);
    console.log(Return_Obj);
    return Return_Obj;
}

function FindObjInArray(list, type, keyword) {
    var ret = null;
    angular.forEach(list, function (value, key) {
        if (value[type] == keyword) {
            ret = value;
        }
    })
    return ret;
}

function recursion(obj, array) {
    var tmp = new Rule(obj.domain, obj.response, obj.concepts, obj.children);
    var search;
    for (var i = 0, length = tmp.children.length; i < length; i++) {
        search = FindObjInArray(array, "domain", tmp.children[i]);
        if (search == null)
            continue;
        tmp.children.splice(i, 1, search);
        tmp.children[i] = recursion(tmp.children[i], array);
    }
    return tmp;
}

function isEqual(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}





app.directive("tree", function () {
    function link(scope, element, attrs) {
        var data = scope.treedata; // fetch data from scope controller
        var draw_data = GenerateTree(data); // Generate the data for tree
        var margin = { top: 30, right: 90, bottom: 30, left: 90 },
            width = 1200 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;
        var treemap = d3.tree().size([width, height]);
        var root = d3.hierarchy(draw_data, function (d) { return d.children; });

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = d3.select("tree").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");

        var i = 0,
            duration = 750;

        // declares a tree layout and assigns the size


        // Assigns parent, children, height, depth
        root.x0 = height / 2;
        root.y0 = 0;

        // Collapse after the second level
        root.children.forEach(collapse);

        update(root);

        // Collapse the node and all it's children
        function collapse(d) {
            if (d.children) {
                d._children = d.children
                d._children.forEach(collapse)
                d.children = null
            }
        }

        function update(source) {

            // Assigns the x and y position for the nodes
            var treeData = treemap(root);

            // Compute the new tree layout.
            var nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);
            console.log("nodes");
            console.log(nodes);
            console.log("links");
            console.log(links);


            // Normalize for fixed-depth.
            nodes.forEach(function (d) { d.y = d.depth * 180 });

            // ****************** Nodes section ***************************

            // Update the nodes...
            var node = svg.selectAll('g.node')
                .data(nodes, function (d) { return d.id || (d.id = ++i); });

            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", function (d) {
                    return "translate(" + source.x0 + "," + source.y0 + ")";
                })
                ;

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6)
                .style("fill", function (d) {
                    return d._children ? "lightsteelblue" : "#fff";
                })
                .on('click', collapse_expand);
            //.on('click', function(d,i){return scope.onClick({item: d.data})})

            // Add labels for the nodes
            nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr("y", function (d) {
                    return -20;
                })
                .attr("text-anchor", function (d) {
                    return "middle";
                })
                .text(function (d) { return d.data.domain; })
                .on('click', function (d) {
                    console.log(d);
                    console.log(d.links());
                    scope.popUpCallback();


                    if (d.parent == null) {
                        console.log("root");
                    }
                });

            nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr("x", function (d) {
                    return 20;
                })
                .attr("text-anchor", function (d) {
                    return "middle";
                })
                .text("+")
                .on('click', function (d) { alert(d.data.domain) });

            nodeEnter.append('text')
                .attr("visibility", function (d, i) { if (d.children || d._children) return "hidden"; })
                .attr("x", -20)
                .attr("text-anchor", "middle")
                .text("X")
                .on('click', remove_node);


            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
                .duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', 10)
                .style("fill", function (d) {
                    return d._children ? "lightsteelblue" : "#fff";
                })
                .attr('cursor', 'pointer');


            // Remove any exiting nodes
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + source.x + "," + source.y + ")";
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            // ****************** links section ***************************

            // Update the links...
            var link = svg.selectAll('path.link')
                .data(links, function (d) { return d.id; });

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', function (d) {
                    var o = { x: source.x0, y: source.y0 }
                    return diagonal(o, o)
                });

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(duration)
                .attr('d', function (d) { return diagonal(d, d.parent) });

            // Remove any exiting links
            var linkExit = link.exit().transition()
                .duration(duration)
                .attr('d', function (d) {
                    var o = { x: source.x, y: source.y }
                    return diagonal(o, o)
                })
                .remove();

            // Store the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s, d) {

                path = `M ${s.x} ${s.y}
                            C ${s.x} ${(s.y + d.y) / 2} ,
                            ${d.x} ${(s.y + d.y) / 2} ,
                            ${d.x} ${d.y}`

                return path
            }

            // Toggle children on click.
            function collapse_expand(d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            }

            function remove_node(d) {
                var parent_node;
                removetarget = d;
                parent_node = FindObjInArray(data, "domain", d.parent.data.domain);
                angular.forEach(data, function (value, key) {
                    if (value["domain"] === d.data.domain) {
                        data.splice(key, 1);
                    }
                });
                angular.forEach(parent_node.children, function (value, key) {
                    if (value["domain"] === d.data.domain) {
                        parent_node.children.splice(key, 1);
                    }
                });
                root = d3.hierarchy(data[0], function (d) { return d.children; });
                root.children.forEach(collapse);


                var parent_link = d.parent.links();
                //svg.selectAll('path.link')
                //    .data(parent_link,function(d){console.log("d"); console.log(d);return d.id;})
                //    .filter(function (d, i) {
                //        //console.log(d);
                //        if (d.target.id == removetarget.id) {
                //            return true;
                //        }
                //        return false;
                //    }).remove();

                update(d.parent);


                //svg.selectAll("g.node")
                //.data(nodes, function(d){
                //    return d.id;
                //})
                //.fliter(function(d,i)
                //{
                //    if(d.id == target.id)
                //    {
                //        return 
                //    }
                //})


            }

            function add_node(d) {

            }



        }



    }
    return {

        restrict: 'E',
        template: "",
        scope: {
            treedata: "=",
            onClick: '&',
            popUpCallback: '&popUpFn'
        },
        link: link

    }
});


app.controller("graphCtrl", function graphCtrl($scope, ngDialog) {

    $scope.onClick = function (item) {
        $scope.$apply(function () {
            $scope.selection = item;
        })
    }

    $scope.popupForm = function () {
        ngDialog.open({ template: 'popup.html', className: 'ngdialog-theme-default'});
    }

    $scope.objlist = [
        {
            "domain": "test",
            "response": [],
            "concepts": [],
            "children": ["test1", "test3"]
        },
        {
            "domain": "test1",
            "response": [],
            "concepts": [],
            "children": ["test2"]
        },
        {
            "domain": "test2",
            "response": [],
            "concepts": [],
            "children": []
        },
        {
            "domain": "test3",
            "response": [],
            "concepts": [],
            "children": []
        }

    ];

    $scope.objlist2 = [
        {
            "domain": "吃喝玩樂",
            "response": [

            ],
            "concepts": [
                "吃", "餓", "喝", "好玩", "逛"
            ],
            "children": [
                "吃",
                "飲料",
                "景點",
                "超商"
            ]
        },
        {
            "domain": "吃",
            "response": [

            ],
            "concepts": [
                "吃", "餓", "好吃"
            ],
            "children": [
                "飯",
                "麵",
                "鍋貼",
                "火鍋",
                "速食",
                "西餐",
                "粥",
                "小吃",
                "美食",
                "冰"
            ]
        },
        {
            "domain": "飲料",
            "response": [

            ],
            "concepts": [
                "喝", "渴"
            ],
            "children": [
                "茶",
                "果汁",
                "咖啡",
                "牛奶"
            ]
        },
        {
            "domain": "景點",
            "response": [

            ],
            "concepts": [
                "玩", "好玩", "逛", "看", "好看", "去", "走"
            ],
            "children": [
                "電影",
                "電影院",
                "夜市",
                "公園",
                "博物館",
                "紀念館",
                "美術館",
                "捷運站",
                "公車站",
                "火車站"
            ]
        },
        {
            "domain": "超商",
            "response": [

            ],
            "concepts": [
                "超商", "零食", "水", "汽水"
            ],
            "children": [
            ]
        },
        {
            "domain": "電影",
            "response": [

            ],
            "concepts": [
                "電影"
            ],
            "children": [
            ]
        },
        {
            "domain": "電影院",
            "response": [

            ],
            "concepts": [
                "電影院", "影城"
            ],
            "children": [
            ]
        },
        {
            "domain": "夜市",
            "response": [

            ],
            "concepts": [
                "夜市"
            ],
            "children": [
            ]
        },
        {
            "domain": "公園",
            "response": [

            ],
            "concepts": [
                "公園"
            ],
            "children": [
            ]
        },
        {
            "domain": "博物館",
            "response": [

            ],
            "concepts": [
                "博物館"
            ],
            "children": [
            ]
        },
        {
            "domain": "紀念館",
            "response": [

            ],
            "concepts": [
                "紀念館"
            ],
            "children": [
            ]
        },
        {
            "domain": "美術館",
            "response": [

            ],
            "concepts": [
                "美術館"
            ],
            "children": [
            ]
        },
        {
            "domain": "捷運站",
            "response": [

            ],
            "concepts": [
                "捷運站", "捷運"
            ],
            "children": [
            ]
        },
        {
            "domain": "公車站",
            "response": [

            ],
            "concepts": [
                "公車站", "公車"
            ],
            "children": [
            ]
        },
        {
            "domain": "火車站",
            "response": [

            ],
            "concepts": [
                "火車站", "火車"
            ],
            "children": [
            ]
        },
        {
            "domain": "飯",
            "response": [
            ],
            "concepts": [
                "飯"
            ],
            "children": [
                "咖哩飯",
                "燒臘飯",
                "炒飯",
                "燴飯",
                "燉飯"
            ]
        },
        {
            "domain": "咖哩飯",
            "response": [
            ],
            "concepts": [
                "咖哩飯"
            ],
            "children": [
            ]
        },
        {
            "domain": "燒臘飯",
            "response": [
            ],
            "concepts": [
                "燒臘"
            ],
            "children": [
            ]
        },
        {
            "domain": "炒飯",
            "response": [
            ],
            "concepts": [
                "炒飯"
            ],
            "children": [
            ]
        },
        {
            "domain": "燴飯",
            "response": [
            ],
            "concepts": [
                "燴飯"
            ],
            "children": [
            ]
        },
        {
            "domain": "燉飯",
            "response": [
            ],
            "concepts": [
                "燉飯"
            ],
            "children": [
            ]
        },
        {
            "domain": "鍋貼",
            "response": [
            ],
            "concepts": [
                "鍋貼"
            ],
            "children": [
            ]
        },
        {
            "domain": "麵",
            "response": [
            ],
            "concepts": [
                "麵", "拉麵", "炒麵", "意麵", "泡麵", "義大利麵", "烏龍麵"
            ],
            "children": [
                "拉麵",
                "炒麵",
                "意麵",
                "泡麵",
                "義大利麵",
                "烏龍麵"
            ]
        },
        {
            "domain": "拉麵",
            "response": [
            ],
            "concepts": [
                "拉麵"
            ],
            "children": [
            ]
        },
        {
            "domain": "炒麵",
            "response": [
            ],
            "concepts": [
                "炒麵"
            ],
            "children": [
            ]
        },
        {
            "domain": "意麵",
            "response": [
            ],
            "concepts": [
                "意麵"
            ],
            "children": [
            ]
        },
        {
            "domain": "泡麵",
            "response": [
            ],
            "concepts": [
                "泡麵"
            ],
            "children": [
            ]
        },
        {
            "domain": "義大利麵",
            "response": [
            ],
            "concepts": [
                "義大利麵"
            ],
            "children": [
            ]
        },
        {
            "domain": "烏龍麵",
            "response": [
            ],
            "concepts": [
                "烏龍麵"
            ],
            "children": [
            ]
        },
        {
            "domain": "火鍋",
            "response": [
            ],
            "concepts": [
                "火鍋"
            ],
            "children": [

            ]
        },
        {
            "domain": "速食",
            "response": [
            ],
            "concepts": [
                "速食"
            ],
            "children": [

            ]
        },
        {
            "domain": "西餐",
            "response": [
            ],
            "concepts": [
                "西餐"
            ],
            "children": [

            ]
        },
        {
            "domain": "粥",
            "response": [
            ],
            "concepts": [
                "粥"
            ],
            "children": [

            ]
        },
        {
            "domain": "小吃",
            "response": [
            ],
            "concepts": [
                "小吃"
            ],
            "children": [

            ]
        },
        {
            "domain": "美食",
            "response": [
            ],
            "concepts": [
                "美食"
            ],
            "children": [

            ]
        },
        {
            "domain": "冰",
            "response": [
            ],
            "concepts": [
                "冰"
            ],
            "children": [

            ]
        },
        {
            "domain": "茶",

            "response": [
            ],
            "concepts": [
                "茶", "紅茶", "綠茶", "麥茶", "冬瓜茶", "奶茶", "烏龍茶"
            ],
            "children": [

            ]
        },
        {
            "domain": "果汁",

            "response": [
            ],
            "concepts": [
                "果汁"
            ],
            "children": [

            ]
        },
        {
            "domain": "咖啡",

            "response": [
            ],
            "concepts": [
                "咖啡", "拿鐵", "卡布奇諾"
            ],
            "children": [

            ]
        },
        {
            "domain": "牛奶",
            "response": [
            ],
            "concepts": [
                "牛奶", "喝牛奶", "鮮奶", "奶粉", "奶"
            ],
            "children": [

            ]
        }
    ];
    //$scope.objlist.length = objs.length;
}
);

app.controller('NgTagsCtrl', function ($scope, $http) {
    $scope.contents = null;

});






