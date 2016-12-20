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


// declare the angular app dependency and some config
var app = angular.module("app", ["ngTagsInput", "ngDialog"], function ($interpolateProvider)
{ $interpolateProvider.startSymbol('[[').endSymbol(']]'); });

app.config(['ngDialogProvider', function (ngDialogProvider) {
    ngDialogProvider.setOpenOnePerName(true);
}]);

// Rule class
function Rule(domain, response, concepts, children) {
    this.domain = domain;
    this.children = children;
    this.response = response;
    this.concepts = concepts;
}

Rule.prototype.addChild = function (name) {
    return this.children.push(name);
}

// Generate the hierarchy json for d3
function GenerateTree(list) {
    var Return_Obj = new Rule(list[0].domain, list[0].response, list[0].concepts, list[0].children);
    Return_Obj = recursion(Return_Obj, list);
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
        //TODO shrink $watch into small area
        

        scope.$watch('treedata', function (newValue, oldValue) {
            var data = [];
            angular.copy(scope.treedata, data);
            console.log(data);

        
            // fetch data from scope controller
            var draw_data = GenerateTree(data); // Generate the data for tree
            console.log(scope.treedata);
            console.log(data);
            var margin = { top: 30, right: 90, bottom: 30, left: 90 };
            var width = 1200 - margin.left - margin.right,
                height = 800 - margin.top - margin.bottom;
            var treemap = d3.tree().size([width, height]);
            var root = d3.hierarchy(draw_data, function (d) { return d.children; });
            var color = d3.scaleOrdinal(d3.schemeCategory20);
            var color_domain = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
            color.domain(color_domain);


            // append the svg object to the body of the page
            // appends a 'group' element to 'svg'
            // moves the 'group' element to the top left margin
            var svg = d3.select("tree").append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            //var zoom = d3.zoom().scaleExtent([0.1, 3]).on("zoom", zoomed);

            //var zoomer = svg.append("rect")
            //    .attr("width", width + margin.right + margin.left)
            //    .attr("height", height + margin.top + margin.bottom)
            //    .style("fill", "none")
            //    .style("pointer-events", "all")
            //    .call(zoom);
            //zoomer.call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));

            var i = 0,
                duration = 750;

            // declares a tree layout and assigns the size


            // Assigns parent, children, height, depth
            root.x0 = width / 2;
            root.y0 = 0;

            // Collapse after the second level


            update(root);
            console.log(root.children);
            root.children.forEach(collapse);
            
            // Collapse the node and all it's children
            function collapse(d) {
                
                if (d.children) {
                    console.log("enter collapse");
                    d._children = d.children;
                    d._children.forEach(collapse);
                    d.children = null;
                }
            }

            function expand(d) {
                if (d._children) {
                    d.children = d._children
                    d.children.forEach(expand)
                    d._children = null
                }
            }

            function update(source) {
                /*var levelWidth = [1];
                var childCount = function (level, n) {
                    if (n.children && n.children.length > 0) {
                        if (levelWidth.length <= level + 1) {
                            levelWidth.push(0);
                        }

                        levelWidth[level + 1] += n.children.length;
                        n.children.forEach(
                            function (d) {
                                childCount(level + 1, d);
                            }
                        );
                    }
                };
                childCount(0,root);
                var newWidth = d3.max(levelWidth) * 40;
                treemap = d3.tree().size([newWidth,height]);*/



                // Assigns the x and y position for the nodes
                var treeData = treemap(root);

                // Compute the new tree layout.
                var nodes = treeData.descendants(),
                    links = treeData.descendants().slice(1);


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
                        // TODO: different color for layer 
                        return color(d.depth);

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
                        scope.popUpCallback({ data: d.data });
                        console.log(d);
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
                    .on('click', function (d) {

                        scope.popUpAddCallback({ data: d.data });

                    });

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
                        return color(d.depth);


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
                    //centerNode(d);
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
                    console.log(d.ancestors());
                    update(d.parent);

                }
            }






        });

        scope.updateRoot = function () {
            angular.copy(scope.treedata, data);
            console.log("update?");
            console.log(scope.treedata);
            draw_data = GenerateTree(data);
            console.log("Generate");
            console.log(draw_data);
            root = d3.hierarchy(draw_data, function (d) { return d.children; });
            root.x0 = height / 2;
            root.y0 = 0;
            update(root);
            //centerNode(root);
        }
        scope.updateFn({ FnInDirective: scope.updateRoot });


    }
    return {

        restrict: 'E',
        template: "",
        scope: {
            treedata: "=",
            onClick: '&',
            popUpCallback: '&popUpFn',
            popUpAddCallback: '&addFn',
            updateFn: '&'
        },
        link: link

    }
});


app.controller("graphCtrl", function graphCtrl($scope, $http, ngDialog) {

    $scope.dataloaded = false;
    $scope.treelist = [];
    $scope.treelist[0] = new Rule("",[],[],[]);



    $scope.LoadData = function () {
        $http.get('/data/tree.json').then(
            function (response) {
                $scope.treelist = response.data;
                $scope.dataloaded = true;
                console.log(response);
            },
            function (response) {
                console.log(response);
            }
        );
    }




    $scope.selection = {};
    $scope.parent = null;
    $scope.child = null;
    $scope.onClick = function (item) {
        $scope.$apply(function () {
            $scope.selection = item;
        })
    }



    $scope.popupForm = function (data) {
        //$scope.selection = FindObjInArray($scope.objlist2,"domain",data);
        $scope.$apply(function () {
            $scope.selection = data;

        }
        );

        console.log($scope.selection);
        ngDialog.open({
            template: 'popup.html', className: 'ngdialog-theme-default', controller: 'dialogCtrl', name: 'viewform', overlay: true,
            data:
            {
                selection: data
            }
        });

    }

    $scope.popupAddForm = function (data) {
        $scope.$apply(
            function () {
                $scope.parent = data;
            }
        );

        $scope.child = new Rule("", [], [], []);

        ngDialog.open({
            template: 'popup_add.html', className: 'ngdialog-theme-default', controller: 'dialogAddCtrl', name: 'viewform', overlay: true,
            data:
            {
                parent: $scope.parent,
                child: $scope.child
            }
        });

    }

    $scope.setUpdateGraphFunction = function (FnInDirective) {
        $scope.UpdateGraphFunction = FnInDirective;
    }

    $scope.$on('child-add', function (event, obj) {
        angular.forEach($scope.treelist, function (value, key) {
            if (value["domain"] == obj.domain) {
                value.children.push(obj.child.domain);
            }
        });
        $scope.treelist.push(obj.child);
        console.log($scope.objlist);

        $scope.UpdateGraphFunction();

    })

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

}
);


app.controller("dialogCtrl", function dialogCtrl($scope) {
    $scope.selection = $scope.ngDialogData.selection;
})

app.controller("dialogAddCtrl", function dialogAddCtrl($scope, $rootScope) {
    $scope.parent = $scope.ngDialogData.parent;
    $scope.child = $scope.ngDialogData.child;


    $scope.EmitSaveEvent = function () {
        console.log("enter event");
        $rootScope.$broadcast("child-add", { domain: $scope.parent.domain, child: $scope.child });
    }


})


