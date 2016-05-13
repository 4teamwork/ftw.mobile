
(function() {

  "use strict";

    var mobileTree = (function () {

      var storage;
      var endpoint;

      function init(current_url, endpoint_viewname, ready_callback){
        storage = {node_by_path: {},
                   nodes_by_parent_path: {},
                   top_level_nodes: []};
        endpoint = endpoint_viewname;
        $.get(current_url + '/' + endpoint + '/startup',
              function(data) {
                data.map(storeNode);
                ready_callback();
              },
              'json');
      }

      // mobileTree.query(
      //       {'path': '/', 'depth': 1},
      //       function(items) {spinner.hide();},
      //       function(){spinner.show();}
      // );
      function query(q, success, onRequest) {
        q['path'] = q['path'].replace(/^\//, '');
        load(q['path'], q['depth'],
             function(items) { success(items); },
             onRequest);
      }

      // mobileTree.queries(
      //       {toplevel: {'path': '/', 'depth': 1},
      //        nodes: {'path': '/hans', 'depth': 3}},
      //       function(result) {spinner.hide();},
      //       function(){spinner.show();}
      // );
      function queries(queries, success, onRequest) {
        if (!queries) {
          throw 'mobileTree.query requrires "queries" argument.';
        }

        var result = {};
        var pending = Object.keys(queries).length;
        for(var name in queries) {
          query(queries[name], function(items) {
            pending--;
            result[name] = items;
            if(pending === 0) {
              success(result);
            }
          }, onRequest);
        }
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
        var parent_path = getParentPath(node.path) || '';
        if (!(parent_path in storage.nodes_by_parent_path)) {
          storage.nodes_by_parent_path[parent_path] = [];
        }
        storage.nodes_by_parent_path[parent_path].push(node);

        // Initialize children storage when children assumed to be loaded in the
        // same response in order to avoid unnecessary children loading of empty
        // containers.
        if (node.children_loaded && !(node.path in storage.nodes_by_parent_path)) {
          storage.nodes_by_parent_path[node.path] = [];
        }

        // storage top_level_nodes
        if (node.path.indexOf('/') === -1) {
          storage.top_level_nodes.push(node);
        }

        // register node methods
        node.nodes = function() { return getChildrenByNode(node); };
        node.depth = function() { return (node.path.match(/\//g) || []).length; };
      }

      function load(path, depth, callback, onRequest) {
        var success = function() { callback(queryResults(path, depth)); };
        if (isLoaded(path, depth)) {
          success();
        } else {
          if (typeof onRequest === 'function') {
            onRequest();
          }
          $.get(portal_url + '/' + path + '/' + endpoint + '/children',
                {'depth:int': depth},
                function(data) {
                  data.map(storeNode);
                  success();
                },
                'json');
        }
      }

      function queryResults(path, depth) {
        if (!isLoaded(path, depth)) {
          throw 'content not loaded: use load()';
        }
        if (depth < 1) {
          throw 'mobileTree.queryResults: Unsupported depth < 1';
        }
        if (depth === 1) {
          return path ? [storage.node_by_path[path]] : [];
        }
        if (depth > 1) {
          var results = path ? [storage.node_by_path[path]] : [];
          $(storage.nodes_by_parent_path[path]).each(function() {
            Array.prototype.push.apply(results, queryResults(this.path, depth-1));
          });
          return results;
        }
      }

      function isLoaded(path, depth) {
        if (depth < 1) {
          throw 'mobileTree.isLoaded: Unsupported depth < 1';
        }

        if (depth === 1) {
          return path in storage.node_by_path;
        }

        if (depth > 1 && !(path in storage.nodes_by_parent_path)) {
          return false;
        }

        var children = storage.nodes_by_parent_path[path];
        var child;
        for (var i=0; i<children.length; i++) {
          child = children[i];
          if (!isLoaded(child.path, depth - 1)) {
            return false;
          }
        }
        return true;
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
              query: query,
              queries: queries,

              getChildrenByNode: getChildrenByNode,
              getNodeByUrl: getNodeByUrl,
              getTopLevelNodes: getTopLevelNodes,
              isLoaded: isLoaded, // XXX remove
              storage: function() {return storage;}, // XXX remove
              getParentNodeByUrl: getParentNodeByUrl
             };

    })();

    window.mobileTree = mobileTree;

})();
