(function() {

  "use strict";

  $(function() {

    $("body").on("click", ".ftw-mobile-buttons a", function(event){
      event.preventDefault();
      var link = $(event.target);
      var templateSource = $("#" + link.data("mobiletemplate")).html();
      var template = Handlebars.compile(templateSource);

      var name = link.parent().attr("id");
      var context = {"items": link.data("mobiledata"), "name": name};
      var container = link.parents(".ftw-mobile-buttons");

      var menu = $(".mobile-menu-" + name);

      if (menu.length === 0) {
        var html = $(template(context));
        html.insertAfter(container);

      } else if (menu.is(":visible")) {
        menu.hide();

      } else {
        $("[class^=mobile-menu-]").hide();
        menu.show();
      }
    });

  });
})();

