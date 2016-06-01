(function() {
  "use strict";

  var root = $(":root");

  function toggle_mobile_menu(link, callback) {
    var wrapper = $('#mobile-menu-wrapper');
    if(wrapper.is(':visible')) {
      close();
      if(!link.is('.selected')) {
        link.addClass('selected');
        callback();
      } else {
        $('.ftw-mobile-buttons a').removeClass('selected');
      }
    } else {
      link.addClass('selected');
      callback();
    }
  }

  function close() {
    $('#mobile-menu-wrapper').removeClass("open");
    root.removeClass("menu-open");
  }


  function initialize_list_button() {
    var link = $(this);
    link.click(function(event){
      event.preventDefault();
      toggle_mobile_menu(link, function() {
        var templateName = link.data('mobile_template');
        var templateSource = $('#' + templateName).html();
        var template = Handlebars.compile(templateSource);

        var menu = $('#mobile-menu-wrapper');
        menu.html(template({
          items: link.data('mobile_data'),
          name: link.parent().attr('id')
        }));
        menu.addClass("open");

      });
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
    var current_url = link.parents(".ftw-mobile-buttons").data('currenturl');

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
      /* Scroll to the top of the menu wrapper when scrolled down */
      if($('body').scrollTop() > $('#mobile-menu-wrapper').offset().top) {
        $('html, body').animate({
          scrollTop: $('#mobile-menu-wrapper').offset().top
        }, 100);
      }
      var parent_path = mobileTree.getParentPath(path);
      var depth = path.indexOf('/') === -1 ? 3 : 2;
      var queries = {toplevel: {path: '/', depth: 2},
                     parent: {path: parent_path, depth: 1},
                     nodes: {path: path, depth: depth}};
      mobileTree.queries(
            queries,
            function(items) {
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
      })).addClass("open");
      root.addClass("menu-open");
      hideSpinner();
    }

    function showSpinner() {
      $('#mobile-menu-wrapper').addClass('spinner');
    }
    function hideSpinner() {
      $('#mobile-menu-wrapper').removeClass('spinner');
    }


    mobileTree.init(current_url, link.data("mobile_endpoint"), function() {
      $(link).click(function(event) {
        event.preventDefault();
        toggle_mobile_menu(link, function() {
          open();
        });
      });

      $(document).on('click', '.topLevelTabs a, a.mobileActionNav', function(event) {
        event.preventDefault();
        render_path(mobileTree.getPhysicalPath($(this).attr('href')));
      });
    }, link.data('mobile_startup_cachekey'));
  }

  $(document).on("click", "#ftw-mobile-overlay", function(){
    close();
    $('.ftw-mobile-buttons a').removeClass('selected');
  });


  $(document).ready(function() {
    Handlebars.registerPartial("list", $("#ftw-mobile-navigation-list-template").html());
    $('.ftw-mobile-buttons a[data-mobile_template="ftw-mobile-navigation-template"]:visible').each(initialize_navigation_button);

    $('.ftw-mobile-buttons a[data-mobile_template="ftw-mobile-list-template"]').each(initialize_list_button);
  });

  $(window).resize(function() {
    /* initialize_navigation_button will only work once and then disable itself */
    $('.ftw-mobile-buttons a[data-mobile_template="ftw-mobile-navigation-template"]:visible').each(initialize_navigation_button);
  });

})();
