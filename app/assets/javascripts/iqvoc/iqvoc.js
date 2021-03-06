/*jslint vars: true, unparam: true, browser: true, white: true */
/*global jQuery */

var IQVOC = (function($) {

"use strict";

var createNote = function(ev) {
  var addButton = $(this);
  var container = addButton.closest("fieldset");
  var source = $("ol li:last-child", container);
  var inputSelector = "input, select, textarea";

  if(source.is(":hidden")) {
    source.show();
    return false;
  }

  var clone = source.clone();

  var count = source.find(inputSelector)[0].id
      .match(/_(\d+)_/)[1];
  count = String(parseInt(count, 10) + 1);
  var newIdCount = "_" + count + "_",
    newNameCount = "[" + count + "]";

  clone.find("label").each(function(index, element) {
    var el = $(element);
    if(el.attr("for")) {
      el.attr("for", el.attr("for").replace(/_\d+_/, newIdCount));
    }
  });

  clone.find(inputSelector).each(function(index, element) {
    var el = $(element);
    el.val("");
    if(el.attr("id")) {
      el.attr("id", el.attr("id").replace(/_\d+_/, newIdCount));
    }
    if(el.attr("name")) {
      el.attr("name", el.attr("name").replace(/\[\d+\]/, newNameCount));
    }
  });

  clone.addClass("new");
  $("ol", container).append(clone);

  return false;
};

// work around apparent capybara-webkit issue:
// https://github.com/thoughtbot/capybara-webkit/issues/43
var Storage = localStorage || null;
if(Storage === null) {
  Storage = {};
  Storage.getItem = function() { return null; };
  Storage.setItem = $.noop;
}

return {
  Storage: Storage,
  createNote: createNote
};

}(jQuery));

jQuery(document).ready(function($) {
  "use strict";

  IQVOC.quicksearch(".quicksearch");

  var locale = document.documentElement.getAttribute("lang");

  // language selection
  $("#language_selection .dropdown-toggle").click(function(ev) { // use Bootstrap's Dropwdown, but without the side-effects
    $(this).closest(".dropdown").toggleClass("open");
  });
  var langWidget = $("ul.lang-widget")[0];
  // primary language (converting links to radio buttons)
  $("a", langWidget).each(function(i, node) {
    var link = $(node),
      el = link.closest("li"),
      btn = $('<input type="radio" name="primary_language">');
    if(link.hasClass("current")) {
      btn[0].checked = true;
    }
    var label = $("<label />").append(btn).append(link);
    el.append(label);
    return label[0];
  });
  $("input:radio", langWidget).live("change", function(ev) {
    window.location = $(this).closest("label").find("a").attr("href");
  });
  // secondary language
  var toggleSections = function(langSelected) {
    $(".translation[lang]").each(function(i, node) {
      var el = $(node),
        lang = el.attr("lang");
      if(lang && lang !== locale && $.inArray(lang, langSelected) === -1) {
        el.addClass("hidden");
      } else {
        el.removeClass("hidden");
      }
    });
  };
  var updateNoteLangs = function(langSelected) {
    $(".inline_note.new select").each(function(i, sel) { // NB: new notes only!
      $(sel).find("option").each(function(i, opt) {
        var el = $(opt),
          lang = el.val();
        if(lang !== locale && $.inArray(lang, langSelected) === -1) {
          el.remove();
        }
      });
    });
  };
  $(document).bind("lang_selected", function(ev, data) {
    toggleSections(data.langs);
    updateNoteLangs(data.langs);
  });
  var langSelector = new IQVOC.LanguageSelector(langWidget, "lang_selected");
  if($("#new_concept, #edit_concept").length) { // edit mode
    // disable secondary language selection to avoid excessive state complexity
    $(":checkbox", langSelector.container).prop("disabled", true);
  }

  // entity selection (edit mode)
  $("input.entity_select").each(function(i, node) {
    new IQVOC.QualifiedEntitySelector(node);
  });

  // hide broader relations for top+ terms (mutually exclusive in mono hierarchies)
  var topTerm = $("#concept_top_term.exclusive");
  var onTopTermToggle = function(ev) {
    var broader = topTerm.closest(".control-group").next(); // XXX: brittle
    broader[topTerm.prop("checked") ? "slideUp" : "slideDown"]();
  };
  topTerm.on("change", onTopTermToggle);
  onTopTermToggle();

  // Label editing (inline notes)
  $("fieldset.note_relation ol li.inline_note.new").hide();
  $("fieldset.note_relation input[type=button]").click(function(ev) {
    IQVOC.createNote.apply(this, arguments);
    langSelector.notify(); // trigger updateNoteLangs -- XXX: hacky!?
  });
  $("li.inline_note input:checkbox").change(function(ev) {
    var action = this.checked ? "addClass" : "removeClass";
    $(this).closest("li")[action]("deleted");
  });

  // Datepicker
  $.datepicker.setDefaults($.datepicker.regional[locale]);
  $("input.datepicker").datepicker({ dateFormat: "yy-mm-dd" });

  // Dashboard table row highlighting and click handling
  $("tr.highlightable")
    .hover(function(ev) {
      var action = ev.type === "mouseenter" ? "addClass" : "removeClass";
      $(this)[action]("hover");
    })
    .click(function(ev) {
      window.location = $(this).attr("data-url");
    });

  // Search
  $("button#language_select_all").click(function() {
    $("input[type=checkbox].lang_check").attr("checked", true);
  });
  $("button#language_select_none").click(function() {
    $("input[type=checkbox].lang_check").attr("checked", false);
  });
  $("select.search_type").change(function() {
    var result_type_filter = $(".result_type_filter");
    if($(this).val().match(/labeling/)) {
      result_type_filter.show();
    }
    else {
      result_type_filter.hide();
    }
  });
  $("select.search_type").change();

  // hierarchical tree view
  $("ul.hybrid-treeview").each(function() {
    var url = $(this).attr("data-url"),
      container = this;
    $(this).treeview({
      collapsed: true,
      toggle: function() {
        var el = $(this);
        if(el.hasClass("hasChildren")) {
          var childList = el.removeClass("hasChildren").find("ul");
          $.fn.treeviewLoad({ url: url }, this.id, childList, container);
        }
      }
    });
  });

  IQVOC.onebox(".onebox");
});
