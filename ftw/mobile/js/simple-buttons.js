(function(Handlebars, mobileTree) {

  "use strict";

  var offcanvasWrapper = Handlebars.compile('<div id="offcanvas-wrapper"><div id="offcanvas-content"></div></div>');

  var root = $(":root");

  var vendorTransitionEnd = [
    "webkitTransitionEnd",
    "transitionEnd"
  ];

  // Here we need to wrap the whole content in the body
  // with the offcanvas wrapper to make the slide in navigation
  // working on Safari and on iOS devices
  function prepareHTML() {
    var scripts = $("body script").detach();
    $("body").wrapInner(offcanvasWrapper());

    scripts.each(function(script) {
      $(script).parent().append(script);
    });

    // Prepare initial closed state
    root.addClass("menu-closed");
  }

  function openMenu() { $('#ftw-mobile-menu').addClass("open"); }

  function closeMenu() {
    closeLinks();
    $('#ftw-mobile-menu').removeClass("open");
  }

  function slideOut() {
    root.removeClass("menu-open");
    root.on(vendorTransitionEnd.join(" "), function() {
      root.removeClass("menu-opened");
      root.addClass("menu-closed");
      root.off(vendorTransitionEnd.join(" "));
    });
  }

  function slideIn() {
    root.addClass("menu-open");
    root.on(vendorTransitionEnd.join(" "), function() {
      root.addClass("menu-opened");
      root.removeClass("menu-closed");
      root.off(vendorTransitionEnd.join(" "));
    });
  }

  function toggleNavigation() {
    if(root.hasClass("menu-open")) {
      slideOut();
    } else {
      slideIn();
    }
  }

  function closeLinks() { $("#ftw-mobile-menu-buttons .selected").removeClass("selected"); }

  function toggleLink(link) {
    $("#ftw-mobile-menu-buttons .selected").not(link).removeClass("selected");
    link.toggleClass("selected");
    if(link.hasClass("selected")) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  function initialize_list_button() {
    var link = $(this);
    link.click(function(event){
      event.preventDefault();
      event.stopPropagation();
      var templateName = link.data('mobile_template');
      var templateSource = $('#' + templateName).html();
      var template = Handlebars.compile(templateSource);

      var menu = $('#ftw-mobile-menu');
      menu.html(template({
        items: link.data('mobile_data'),
        name: link.parent().attr('id')
      }));
      toggleLink(link);
    });
  }

  window.begun_mobile_initialization = false;
  function initialize_navigation_button() {
    /* This function may be called a lot when resizing, but it should only
       work the very first time. */
    if(window.begun_mobile_initialization) {
      return;
    } else {
      window.begun_mobile_initialization = true;
    }

    var link = $(this);
    var current_url = link.parents("#ftw-mobile-menu-buttons").data('currenturl');
    var active_path;

    function open() {
      var current_path = mobileTree.getPhysicalPath(current_url);
      active_path = current_path;
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
        mobileTree.query({path: current_path, depth: 1}, function(toplevel) {
          if (!toplevel[0].has_children) {
            current_path = mobileTree.getParentPath(current_path);
          }
          render_path(current_path);
        });
      }
    }

    function render_path(path) {
      var parent_path = mobileTree.getParentPath(path);
      var depth = path.indexOf('/') === -1 ? 3 : 2;
      var queries = {toplevel: {path: '/', depth: 2},
                     parent: {path: parent_path, depth: 1},
                     nodes: {path: path, depth: depth}};
      mobileTree.queries(
            queries,
            function(items) {
              $.each(items, function() { mark_active_node(this); });
              render(items);
              // prefetch grand children
              mobileTree.query({path: path, depth: depth + 1});
            },
            showSpinner);
    }

    function render(items) {
      var templateName = link.data('mobile_template');
      var templateSource = $('#' + templateName).html();
      var template = Handlebars.compile(templateSource);
      var currentItem = items.nodes[0];
      $(items.toplevel).each(function() {
        if((currentItem.path + "/").indexOf(this.path + "/") > -1) {
          this.cssclass = 'selected';
        }
      });

      currentItem.visible = currentItem.path != currentItem.id;

      var tabs_scroll_left = $('.topLevelTabs').scrollLeft();
      $('#ftw-mobile-menu').html(template({
        navRootUrl: $("#ftw-mobile-menu-buttons").data('navrooturl'),
        toplevel: items.toplevel,
        currentNode: currentItem,
        nodes: currentItem.nodes,
        parentNode: items.parent ? items.parent[0] : null,
        name: link.parent().attr('id')
      }));
      $('.topLevelTabs').scrollLeft(tabs_scroll_left);
      hideSpinner();
    }

    function mark_active_node(nodes) {
      $.each(nodes, function() {
        if(typeof(this.active) !== 'undefined') {
          // Already processed.
          return;
        }
        this.active = active_path == this.path;
        mark_active_node(this.nodes);
      });
    }

    function showSpinner() {
      $('#ftw-mobile-menu').addClass('spinner');
    }
    function hideSpinner() {
      $('#ftw-mobile-menu').removeClass('spinner');
    }


    mobileTree.init(current_url, link.data("mobile_endpoint"), function() {
      $(link).click(function(event) {
        event.preventDefault();
        open();
        closeMenu();
        toggleNavigation();
      });

      $(document).on('click', '.topLevelTabs a', function(event) {
        var path = mobileTree.getPhysicalPath($(this).attr('href'));
        mobileTree.query(
          {path: path, depth: 2},
          function(items) {
            var has_children = (items[0].nodes.length > 0);
            if (!has_children) {
              // When clicking on a top level node without children
              // the browser must open this node. We do not "preventDefault()"
              // for the link target to be opened.
              return;
            } else {
              event.preventDefault();
              render_path(path);
            }
          },
          showSpinner);
      });

      $(document).on('click', 'a.mobileActionNav', function(event) {
        event.preventDefault();
        render_path(mobileTree.getPhysicalPath($(this).attr('href')));
      });
    }, link.data('mobile_startup_cachekey'));
  }

  $(document)
  .on("click", "#ftw-mobile-menu-overlay", function(){
    slideOut();
  })
  .on("click", closeMenu)
  .ready(function() {
    Handlebars.registerPartial("list", $("#ftw-mobile-navigation-list-template").html());

    var translations = $("#ftw-mobile-menu-buttons").data('i18n');
    Handlebars.registerHelper('i18n', function(msgid){
      return translations[msgid];
    });

    $('#ftw-mobile-menu-buttons a[data-mobile_template="ftw-mobile-navigation-template"]:visible').each(initialize_navigation_button);

    $('#ftw-mobile-menu-buttons a[data-mobile_template="ftw-mobile-list-template"]').each(initialize_list_button);

    prepareHTML();
  });

  $(window).resize(function() {
    /* initialize_navigation_button will only work once and then disable itself */
    $('#ftw-mobile-menu-buttons a[data-mobile_template="ftw-mobile-navigation-template"]:visible').each(initialize_navigation_button);
  });

  window.mobileMenu = {
    slideIn: slideIn,
    slideOut: slideOut
  };

})(window.Handlebars, window.mobileTree);
