
(function() {

  "use strict";

    var mobileTree = (function () {

      var storage = [];

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
        var relativePath = url.replace(portal_url, "");
        var physicalPath = relativePath.split("/");
        return getNode(physicalPath, storage).nodes;
      }

      function getCurrentByUrl(url) {
        var relativePath = url.replace(portal_url, "");
        var physicalPath = relativePath.split("/");
        return getNode(physicalPath, storage);
      }

      function getTopLevelNodes(){
        return storage.nodes;
      }

      return {init: init,
              getNode: getNode,
              getChildrenByUrl: getChildrenByUrl,
              getCurrentByUrl: getCurrentByUrl,
              getTopLevelNodes: getTopLevelNodes
            };

    })();

    window.mobileTree = mobileTree;

})();
