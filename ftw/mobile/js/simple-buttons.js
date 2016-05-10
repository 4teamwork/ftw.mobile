(function() {

  "use strict";

  $(function() {


    function mobileNavigationTabs(navigation){

      var firsTab = 0;
      var topleveltabs = $('.topLevelTabs', navigation);
      var links = topleveltabs.find('a');

      links.each(function(index, link){
        if (window.location.href.indexOf($(link).attr("href")) !== -1) {
          firsTab = links.index(link);
          return;
        }
      });

      topleveltabs.tabs('.tabPanes > .tabPane',
                        {"current": "selected",
                         "initialIndex": firsTab});


      $("body").on("click", "a.mobileActionNav", function(event){
        event.preventDefault();
        var self = $(this);
        var node = mobileTree.getCurrentByUrl(self.attr("href"));
        var templateSource = $("#ftw-mobile-navigation-list-template").html();
        var template = Handlebars.compile(templateSource);

        var context = node;
        if (node.url === portal_url) {
          context['maxdepth'] = 3;
        } else {
          context['maxdepth'] = node.depth;
        }

        var html = $(template(context));
        self.parents('.tabPane').find('> ul').html(html);

      });

    }

    function hideAllMenues(){
      $(".mobile-menu").hide();
    }

    $("body").on("click", ".ftw-mobile-buttons a", function(event){
      event.preventDefault();
      var link = $(event.target);
      var templateName = link.data("mobiletemplate");
      var templateSource = $("#" + templateName).html();
      var template = Handlebars.compile(templateSource);

      var name = link.parent().attr("id");
      var context;
      var depth;
      var currentURL = window.location.href;

      if (templateName !== "ftw-mobile-navigation-template") {
        context = {"items": link.data("mobiledata"), "name": name};

      } else {
        mobileTree.init(link.data("mobiledata"));

        context = {"toplevel": mobileTree.getTopLevelNodes(),
                   "nodes": [],
                   "name": name,
                   "maxdepth": []};


        var defaultDepth = 1;
        var rootDepth = 3;

        $(context['toplevel']).each(function(index, node){
          if (currentURL.indexOf(node.url) !== -1) {
            var currentNode = mobileTree.getCurrentByUrl(currentURL);
            context.nodes.push(currentNode);
            context.nodes[context.nodes.length - 1]['maxdepth'] = currentNode.depth + defaultDepth;
          } else {
            context.nodes.push(node);
            context.nodes[context.nodes.length - 1]['maxdepth'] = rootDepth;
          }

        });

        Handlebars.registerHelper('ifDepth', function(depth, maxdepth, options) {
          if(depth < maxdepth) {
            return options.fn(this);
          }
          return options.inverse(this);
        });

        Handlebars.registerPartial( "list", $( "#ftw-mobile-navigation-list-template" ).html() );
      }

      var container = link.parents(".ftw-mobile-buttons");

      var menu = $(".mobile-menu-" + name);

      if (menu.length === 0) {
        hideAllMenues();
        var html = $(template(context));
        html.insertAfter(container);

        if (templateName === "ftw-mobile-navigation-template") {
          mobileNavigationTabs($(".mobile-menu-" + name));
        }

      } else if (menu.is(":visible")) {
        menu.hide();

      } else {
        hideAllMenues();
        menu.show();
      }
    });

  });
})();
