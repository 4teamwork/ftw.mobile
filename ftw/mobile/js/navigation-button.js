
(function() {

  "use strict";

    var mobileTree = (function () {

      var storage;

      function init(nodes){
        storage = {node_by_path: {},
                   nodes_by_parent_path: {},
                   top_level_nodes: []};
        nodes.map(storeNode);
      }

      function getPhysicalPath(url) {
        return url.replace(portal_url + '/', "");
      }

      function getParentPath(path) {
        var parts = path.split('/');
        parts.pop();
        return parts.join('/');
      }

      function storeNode(node) {
        node.path = getPhysicalPath(node.url);
        // storage node_by_path
        storage.node_by_path[node.path] = node;

        // storage nodes_by_parent_path
        var parent_path = getParentPath(node.path);
        if (parent_path) {
          if (!(parent_path in storage.nodes_by_parent_path)) {
            storage.nodes_by_parent_path[parent_path] = [];
          }
          storage.nodes_by_parent_path[parent_path].push(node);
        }

        // storage top_level_nodes
        if (node.path.indexOf('/') === -1) {
          storage.top_level_nodes.push(node);
        }

        // register node methods
        node.nodes = function() { return getChildrenByNode(node); };
        node.depth = function() { return (node.path.match(/\//g) || []).length; };
      }

      function getChildrenByNode(node) {
        return storage.nodes_by_parent_path[node.path] || [];
      }

      function getNodeByUrl(url) {
        return storage.node_by_path[getPhysicalPath(url)];
      }

      function getParentNodeByUrl(url) {
        return storage.node_by_path[getParentPath(getPhysicalPath(url))];
      }

      function getTopLevelNodes(){
        return storage.top_level_nodes;
      }

      return {init: init,
              getChildrenByNode: getChildrenByNode,
              getNodeByUrl: getNodeByUrl,
              getTopLevelNodes: getTopLevelNodes,
              getParentNodeByUrl: getParentNodeByUrl
             };

    })();

    window.mobileTree = mobileTree;

})();
