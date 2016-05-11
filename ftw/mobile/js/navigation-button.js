
(function() {

  "use strict";

    var mobileTree = (function () {

      var storage = [];

      function getPhysicalPath(url) {
        var relativePath = url.replace(portal_url, "");
        return relativePath.split("/");
      }

      function init(nodes){
        storage = nodes;
      }

      function getNode(physicalPath, items){
        var pathElement = physicalPath.shift();
        if (pathElement === "") {
          // root path, take next one
          pathElement = physicalPath.shift();
        }

        var pos = items.childrenIds.indexOf(pathElement);
        if ( pos !== -1){

          if (physicalPath.length > 0) {
            return getNode(physicalPath, items.nodes[pos]);
          } else {

            return items.nodes[pos];
          }
        } else {

          return null;
        }
      }

      function getChildrenByUrl(url) {
        var physicalPath = getPhysicalPath(url);
        return getNode(physicalPath, storage).nodes;
      }

      function getNodeByUrl(url) {
        var physicalPath = getPhysicalPath(url);
        return getNode(physicalPath, storage);
      }

      function getParentNodeByUrl(url) {
        var physicalPath = getPhysicalPath(url);
        var parentPhysicalPath = physicalPath.slice(0, physicalPath.length -1);
        return getNode(parentPhysicalPath, storage);
      }

      function getAllParentNodesByUrl(url) {
        //XXX: Implement this in getNode, or a parent pointer
        var parentNodes = [];

        var node = getNodeByUrl(url);

        function getParent(node) {
          node = getParentNodeByUrl(node.url);

          if (node === null) {
            return;
          }

          parentNodes.push(node);
          getParent(node);
        }
        getParent(node);

        return parentNodes;

      }

      function getTopLevelNodes(){
        return storage.nodes;
      }

      return {init: init,
              getNode: getNode,
              getChildrenByUrl: getChildrenByUrl,
              getNodeByUrl: getNodeByUrl,
              getTopLevelNodes: getTopLevelNodes,
              getParentNodeByUrl: getParentNodeByUrl,
              getAllParentNodesByUrl: getAllParentNodesByUrl
            };

    })();

    window.mobileTree = mobileTree;

})();
