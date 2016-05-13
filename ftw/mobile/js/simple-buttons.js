(function() {
  "use strict";


  function initialize() {
    Handlebars.registerPartial("list", $("#ftw-mobile-navigation-list-template").html());

    $('.ftw-mobile-buttons a').each(function() {
      var link = $(this);
      var template = link.data('mobiletemplate');
      if (template === 'ftw-mobile-navigation-template') {
        initialize_mobile_navigation(link);
      } else {
        console.log('unsupported templated: ' + template);
      }
    });
  }

  function initialize_mobile_navigation(link) {
    var current_url = location.href.split('?')[0].split('#')[0];

    function open() {
      var current_path = mobileTree.getPhysicalPath(current_url);
      while( current_path && !mobileTree.isLoaded(current_path, 1)) {
        // the current context is not visible in the navigation;
        // lets try the parent
        current_path = mobileTree.getParentPath(current_path);
      }

      if(current_path === '') {
        mobileTree.query({path: '/', depth: 2}, function(toplevel) {
          render_path(toplevel[0].path);
        });
      } else {
        render_path(current_path);
      }
    }

    function render_path(path) {
      var parent_path = mobileTree.getParentPath(path);
      var depth = path.indexOf('/') === -1 ? 3 : 2;
      var queries = {toplevel: {path: '/', depth: 2},
                     parent: {path: parent_path, depth: 1},
                     nodes: {path: path, depth: depth}};
      mobileTree.queries(queries,
                         render,
                         showSpinner);
    }

    function render(items) {
      hideSpinner();
      var templateName = link.data('mobiletemplate');
      var templateSource = $('#' + templateName).html();
      var template = Handlebars.compile(templateSource);
      var currentItem = items.nodes[0];
      $(items.toplevel).each(function() {
        if(currentItem.path.indexOf(this.path) > -1) {
          this.cssclass = 'selected';
        }
      });

      $('#mobile-menu-wrapper').html(template({
        toplevel: items.toplevel,
        currentNode: currentItem,
        nodes: currentItem.nodes,
        parentNode: items.parent ? items.parent[0] : null,
        name: link.parent().attr('id')
      }));
    }

    function showSpinner() {
      $('#mobile-menu-wrapper').addClass('spinner');
    }
    function hideSpinner() {
      $('#mobile-menu-wrapper').removeClass('spinner');
    }


    mobileTree.init(current_url, link.data("mobileendpoint"), function() {
      $(link).click(function(event) {
        event.preventDefault();
        if($('.mobile-menu').is(':visible')) {
          $('.mobile-menu').remove();
        } else {
          open();
        }
      });

      $(document).on('click', '.topLevelTabs a, a.mobileActionNav', function(event) {
        event.preventDefault();
        render_path(mobileTree.getPhysicalPath($(this).attr('href')));
      });
    });
  }


  $(document).ready(initialize);

})();





// (function() {

//   "use strict";

//   $(function() {


//     function mobileNavigationTabs(navigation){

//       var firsTab = 0;
//       var topleveltabs = $('.topLevelTabs', navigation);
//       var links = topleveltabs.find('a');

//       links.each(function(index, link){
//         if (window.location.href.indexOf($(link).attr("href")) !== -1) {
//           firsTab = links.index(link);
//           return;
//         }
//       });

//       topleveltabs.tabs('.tabPanes > .tabPane',
//                         {"current": "selected",
//                          "initialIndex": firsTab});


//       $("body").on("click", "a.mobileActionNav", function(event){
//         event.preventDefault();
//         var self = $(this);
//         var node = mobileTree.getNodeByUrl(self.attr("href"));
//         var node = mobileTree.getNodeByUrl(self.attr("href"));
//         var templateSource = $("#ftw-mobile-navigation-list-template").html();
//         var template = Handlebars.compile(templateSource);

//         var context = node;
//         var parentNode = mobileTree.getParentNodeByUrl(self.attr("href"));

//         if (parentNode === null) {
//           context['maxdepth'] = 3;
//         } else {
//           context['maxdepth'] = node.depth;
//           context['parentNode'] = parentNode;
//         }

//         var html = $(template(context));
//         self.parents('.tabPane').find('> ul').html(html);

//         // Do no persist
//         delete context['parentNode'];

//       });

//     }

//     function hideAllMenues(){
//       $(".mobile-menu").hide();
//     }

//     $("body").on("click", ".ftw-mobile-buttons a", function(event){
//       event.preventDefault();
//       var link = $(event.target);
//       var templateName = link.data("mobiletemplate");
//       var templateSource = $("#" + templateName).html();
//       var template = Handlebars.compile(templateSource);

//       var name = link.parent().attr("id");
//       var context;
//       var depth;
//       var currentURL = window.location.href;
//       var menu = $(".mobile-menu-" + name);


//       if (templateName !== "ftw-mobile-navigation-template") {
//         context = {"items": link.data("mobiledata"), "name": name};

//         var container = link.parents(".ftw-mobile-buttons");

//         if (menu.length === 0) {
//           hideAllMenues();
//           var html = $(template(context));
//           html.insertAfter(container);

//           if (templateName === "ftw-mobile-navigation-template") {
//             mobileNavigationTabs($(".mobile-menu-" + name));
//           }

//         } else if (menu.is(":visible")) {
//           menu.hide();

//         } else {
//           hideAllMenues();
//           menu.show();
//         }




//       } else {
//         if (menu.is(":visible")) {
//           menu.hide();
//           return;
//         }

//         mobileTree.init(window.location.href, link.data("mobileendpoint"), function() {
//           context = {"toplevel": mobileTree.getTopLevelNodes(),
//                      "nodes": [],
//                      "name": name,
//                      "maxdepth": []};

//           var defaultDepth = 1;
//           var rootDepth = 3;

//           $(context['toplevel']).each(function(index, node){
//             if (currentURL.indexOf(node.url) !== -1) {
//               var currentNode = mobileTree.getNodeByUrl(currentURL);
//               context.nodes.push(currentNode);
//               context.nodes[context.nodes.length - 1]['maxdepth'] = currentNode.depth + defaultDepth;
//               context.nodes[context.nodes.length - 1]['parentNode'] = mobileTree.getParentNodeByUrl(currentURL);

//             } else {
//               context.nodes.push(node);
//               context.nodes[context.nodes.length - 1]['maxdepth'] = rootDepth;
//             }

//           });

//           Handlebars.registerHelper('ifDepth', function(depth, maxdepth, options) {
//             if(depth < maxdepth) {
//               return options.fn(this);
//             }
//             return options.inverse(this);
//           });

//           Handlebars.registerPartial( "list", $( "#ftw-mobile-navigation-list-template" ).html() );


//           var container = link.parents(".ftw-mobile-buttons");

//           if (menu.length === 0) {
//             hideAllMenues();
//             var html = $(template(context));
//             html.insertAfter(container);

//             if (templateName === "ftw-mobile-navigation-template") {
//               mobileNavigationTabs($(".mobile-menu-" + name));
//             }

//           } else {
//             hideAllMenues();
//             menu.show();
//           }

//         });
//       }
//     });

//   });
// })();
