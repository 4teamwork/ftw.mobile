(function(Handlebars, mobileTree, Hammer, $) {

  "use strict";

  var offcanvasWrapper = Handlebars.compile('<div id="offcanvas-wrapper"><div id="offcanvas-content"></div></div>');

  var root = $(":root");

  var vendorTransitionEnd = [
    "webkitTransitionEnd",
    "transitionend"
  ];

  var arrowScrollController = {
    active: false,
    init: function(offset) {
      this.offset = offset;
      this.container = $('#ftw-mobile-menu');
      this.content = $('.topLevelTabs')
      this.content.scroll(this.trackScroll.bind(this));
      this.active = false;
    },
    scrollTo: function(offset) {
      this.active = false;
      this.content.scrollLeft(offset);
      this.check();
      this.active = true;
    },
    trackScroll: function(event) {
      if(this.active) {
        this.scrollPosition = $(event.target).scrollLeft();
        this.check(this.scrollPosition);
      }
    },
    activateLeft: function() {
      this.container.removeClass("scroll-right");
      this.container.addClass("scroll-left");
    },
    activateRight: function() {
      this.container.removeClass("scroll-left");
      this.container.addClass("scroll-right");
    },
    reset: function() {
      this.container.removeClass("scroll-left scroll-right");
    },
    fixScroll: function() {
      this.scrollTo(this.scrollPosition);
    },
    selectCurrent: function() {
      var current = this.content.children('.selected');
      this.scrollTo((current.offset() || { left: 0 }).left);
      current.children('a').first().focus();
    },
    check: function(scrollPosition) {
      scrollPosition = scrollPosition || 0;
      var scrollWidth = this.content[0].scrollWidth;
      if(this.content.width() >= scrollWidth - this.offset) {
        this.reset();
      } else if(scrollPosition <= this.offset) {
        this.activateRight();
      } else if(scrollPosition + this.container.width() >= scrollWidth - this.offset) {
        this.activateLeft();
      } else {
        this.reset();
      }
    }
  }

  // Here we need to wrap the whole content in the body
  // with the offcanvas wrapper to make the slide in navigation
  // working on Safari and on iOS devices
  function prepareHTML() {
    var scripts = $("body script").not("[type='text/x-handlebars-template']").detach();
    $("body").wrapInner(offcanvasWrapper());
    scripts.each(function(script) {
      $(script).parent().append(script);
    });

    // Prepare initial closed state
    root.addClass("menu-closed");
  }

  function openMenu() {
    var mobileMenu = $('#ftw-mobile-menu');
    mobileMenu.addClass("open");
    mobileMenu.attr('aria-hidden', 'false');
    mobileMenu.trigger('mobilenav:menu:opened');
  }

  function closeMenu() {
    closeLinks();
    var mobileMenu = $('#ftw-mobile-menu');
    mobileMenu.removeClass("open");
    mobileMenu.attr('aria-hidden', 'true');
    mobileMenu.trigger('mobilenav:menu:closed');
  }

  function slideOut() {
    root.removeClass("menu-open");
    root.on(vendorTransitionEnd.join(" "), function() {
      root.removeClass("menu-opened");
      root.addClass("menu-closed");
      root.off(vendorTransitionEnd.join(" "));
      $('#ftw-mobile-menu').attr('aria-hidden', 'true');
      $('#ftw-mobile-menu').trigger('mobilenav:nav:closed');
      // !!! This implementation of focusing the button is a workaround !!!
      // The implementation will not work if the button is being renamed.
      // The origin of the click event should be passed by the caller
      $("#navigation-mobile-button > a").focus();
    });
  }

  function slideIn() {
    root.addClass("menu-open");
    root.on(vendorTransitionEnd.join(" "), function() {
      root.addClass("menu-opened");
      root.removeClass("menu-closed");
      root.off(vendorTransitionEnd.join(" "));
      $('#ftw-mobile-menu').attr('aria-hidden', 'false');
      $('#ftw-mobile-menu').trigger('mobilenav:nav:opened');
      arrowScrollController.selectCurrent();
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
      $('#ftw-mobile-menu').trigger('mobilenav:listbutton:clicked');
    });
    $('#ftw-mobile-menu').trigger('mobilenav:listbutton:initialized');
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
    var settings = link.data('mobile_settings');
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
        if(settings.show_tabs) {
          mobileTree.query({path: '/', depth: 2, exclude_root: true}, function(toplevel) {
            render_path(toplevel[0].path);
          });
        } else {
          render_path(current_path);
        }
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
      var depth = 2;
      if (settings.show_two_levels_on_root && path.indexOf('/') === -1) {
        depth = 3;
      }

      var classes = [];
      if (depth === 2) {
        classes.push('mobile-layout-one-level');
      } else if (depth === 3) {
        classes.push('mobile-layout-two-levels');
      }

      var show_parent = true;
      if (path === '') {
        show_parent = false;
      } else if (settings.show_tabs && path.indexOf('/') === -1) {
        show_parent = false;
      }

      var queries = {toplevel: {path: '/', depth: 2,
                                exclude_root: settings.show_tabs},
                     parent: {path: parent_path, depth: 1,
                              exclude_root: !show_parent},
                     nodes: {path: path, depth: depth}};
      mobileTree.queries(
            queries,
            function(items) {
              $.each(items, function() { mark_active_node(this); });
              render(items, classes);
              // prefetch grand children
              mobileTree.query({path: path, depth: depth + 1});
            },
            showSpinner);
    }

    function render(items, classes) {
      var templateName = link.data('mobile_template');
      var templateSource = $('#' + templateName).html();
      var template = Handlebars.compile(templateSource);
      var currentItem = items.nodes[0];
      $(items.toplevel).each(function() {
        if((currentItem.path + "/").indexOf(this.path + "/") > -1) {
          this.cssclass = 'selected';
        }
      });

      if (settings.show_two_levels_on_root) {
        currentItem.visible = currentItem.path != currentItem.id;
      } else {
        currentItem.visible = currentItem.path !== '';
      }

      $('#ftw-mobile-menu').trigger('mobilenav:beforerender');
      $('#ftw-mobile-menu').html(template({
        navRootUrl: $("#ftw-mobile-menu-buttons").data('navrooturl'),
        toplevel: items.toplevel,
        currentNode: currentItem,
        nodes: currentItem.nodes,
        parentNode: items.parent ? items.parent[0] : null,
        name: link.parent().attr('id'),
        classes: classes.join(' '),
        settings: settings
      }));
      $('#ftw-mobile-menu').trigger('mobilenav:rendered');
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
      $('#ftw-mobile-menu').trigger('mobilenav:spinner:show');
    }
    function hideSpinner() {
      $('#ftw-mobile-menu').removeClass('spinner');
      $('#ftw-mobile-menu').trigger('mobilenav:spinner:hide');
    }


    mobileTree.init(current_url, link.data("mobile_endpoint"), function() {
      $(link).click(function(event) {
        event.preventDefault();
        open();
        closeMenu();
        toggleNavigation(link);
        arrowScrollController.init(60);
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
            arrowScrollController.init(60);
            arrowScrollController.fixScroll();
          },
          showSpinner);
      });

      $(document).on('click', 'a.mobileActionNav', function(event) {
        event.preventDefault();
        render_path(mobileTree.getPhysicalPath($(this).attr('href')));
      });
    }, link.data('mobile_startup_cachekey'));
    $('#ftw-mobile-menu').trigger('mobilenav:initialized');
  }

  $(document)
  .on("click", "#ftw-mobile-menu-overlay", function(){
    slideOut();
  })
  .on("click", closeMenu)
  .on("keyup", function(event) {
    if(event.which === $.ui.keyCode.ESCAPE) {
      slideOut();
    }
  })
  .ready(function() {
    Handlebars.registerPartial("list", $("#ftw-mobile-navigation-list-template").html());

    var translations = $("#ftw-mobile-menu-buttons").data('i18n');
    Handlebars.registerHelper('i18n', function(msgid){
      return translations[msgid];
    });

    $('#ftw-mobile-menu-buttons a[data-mobile_template="ftw-mobile-navigation-template"]:visible').each(initialize_navigation_button);

    $('#ftw-mobile-menu-buttons a[data-mobile_template="ftw-mobile-list-template"]').each(initialize_list_button);

    prepareHTML();

    var mc = new Hammer(document.querySelector('#ftw-mobile-menu-overlay'), {
      dragLockToAxis: true,
      dragBlockHorizontal: true,
      threshold: 50
    });
    mc.on("swipeleft", slideOut);
  });

  $(window).resize(function() {
    /* initialize_navigation_button will only work once and then disable itself */
    $('#ftw-mobile-menu-buttons a[data-mobile_template="ftw-mobile-navigation-template"]:visible').each(initialize_navigation_button);
  });

  window.mobileMenu = {
    slideIn: slideIn,
    slideOut: slideOut
  };

})(window.Handlebars, window.mobileTree, window.Hammer, window.jQuery);
