
(function() {

  "use strict";

    var mobileTree = (function () {

      var storage;
      var endpoint;
      var root_url;

      function init(current_url, endpoint_viewname, ready_callback, startup_cachekey){
        root_url = $("#ftw-mobile-menu-buttons").data("navrooturl");
        var root_node = {url: root_url};
        storage = {node_by_path: {'': root_node},
                   nodes_by_parent_path: {}};
        endpoint = endpoint_viewname;
        var startup_url = current_url + '/' + endpoint + '/startup';
        if(startup_cachekey) {
          startup_url += '?cachekey=' + startup_cachekey;
        }

        $.get(startup_url,
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
             function(items) {
               if (typeof success === 'function') {
                 success(items);
               }
             },
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
              if (typeof success === 'function') {
                success(result);
              }
            }
          }, onRequest);
        }
      }

      function getPhysicalPath(url) {
        return url.replace(root_url, "").replace(/^\//, '').replace(/\/$/, '');
      }

      function getParentPath(path) {
        var parts = path.split('/');
        parts.pop();
        return parts.join('/');
      }

      function isPathInQueryOrParent(path, queryPath, queryDepth) {
        if(queryPath.indexOf(path) === 0) {
          /* path is a parent of queryPath */
          return true;
        }

        if(path.indexOf(queryPath) !== 0) {
          /* path is not in queryPath */
          return false;
        }

        var relPath = path.slice(queryPath.length).replace(/^\//, '');
        var wasQueried = relPath.split('/').length < queryDepth;
        return wasQueried;
      }

      function storeNode(node) {
        node.path = getPhysicalPath(node.url);
        if (!(node.path in storage.node_by_path)) {
          // storage nodes_by_parent_path
          var parent_path = getParentPath(node.path) || '';
          if (!(parent_path in storage.nodes_by_parent_path)) {
            storage.nodes_by_parent_path[parent_path] = [];
          }
          storage.nodes_by_parent_path[parent_path].push(node);
        }

        // storage node_by_path
        storage.node_by_path[node.path] = node;

        // Initialize children storage when children assumed to be loaded in the
        // same response in order to avoid unnecessary children loading of empty
        // containers.
        if (node.children_loaded && !(node.path in storage.nodes_by_parent_path)) {
          storage.nodes_by_parent_path[node.path] = [];
        }
      }

      function load(path, depth, callback, onRequest) {
        /** We will need to know whether there are children for each
            requested node.
            In order to do that, we need to make sure that we have loaded one
            level deeper than requested.
        **/
        var queryDepth = depth;
        var requestDepth = depth + 1;
        var success = function() { callback(treeify(queryResults(path, requestDepth),
                                             path, queryDepth)); };
        if (isLoaded(path, requestDepth)) {
          success();
        } else {
          if (typeof onRequest === 'function') {
            onRequest();
          }
          $.get(portal_url + '/' + path + '/' + endpoint + '/children',
                {'depth:int': requestDepth},
                function(data) {
                  data.map(storeNode);
                  success();
                },
                'json');
        }
      }

      function treeify(items, queryPath, queryDepth) {
        /** The items will contain items which are deeper than "depth",
            so that we can decide whether nodes have children.
            We need to make sure that those items will not end up in the
            ".nodes"-list of their parents.
        **/

        items = copyItems(items);
        var tree = [];
        var by_path = {};

        $(items).each(function() {
          by_path[this.path] = this;
          this.nodes = [];
          this.has_children = false;
        });

        $(items).each(function() {
          var parentPath = getParentPath(this.path);

          if(isPathInQueryOrParent(this.path, queryPath, queryDepth)) {
            if(!(parentPath in by_path)) {
              tree.push(this);
            } else {
              by_path[parentPath].nodes.push(this);
            }
          }

          if(parentPath in by_path) {
            by_path[parentPath].has_children = true;
          }
        });
        return tree;
      }

      function copyItems(items) {
        return $.map(items, function(item) {
          return $.extend({}, item);
        });
      }

      function queryResults(path, depth) {
        if (depth < 1) {
          throw 'mobileTree.queryResults: Unsupported depth < 1';
        }

        var results = [];
        if (path && path in storage.node_by_path) {
          results.push(storage.node_by_path[path]);
        }

        if (depth === 1) {
          return results;
        }

        $(storage.nodes_by_parent_path[path]).each(function() {
          Array.prototype.push.apply(results, queryResults(this.path, depth-1));
        });
        return results;
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

      return {init: init,
              query: query,
              queries: queries,
              getPhysicalPath: getPhysicalPath,
              getParentPath: getParentPath,
              isLoaded: isLoaded,

              storage: function() {return storage;} // XXX remove
             };

    })();

    window.mobileTree = mobileTree;

})();
