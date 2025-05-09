(function($) {
  var $main        = $('#main'),
      originalHTML = $main.html(),
      contentMap   = {
        about: '<section><h2>About Me</h2><p>Lorem ipsum dolor sit amet…</p></section>',
        work:  '<section><h2>My Work</h2><p>Lorem ipsum dolor sit amet…</p></section>'
      };

  function loadSection(key, addHistory) {
    var html = key && contentMap[key] ? contentMap[key] : originalHTML;

    // fade dla płynności
    $main.fadeOut(250, function() {
      $main.html(html).fadeIn(250);
    });

    // aktualizuj URL bez scrolla
    if (addHistory) {
      var url = key ? '?section=' + key : window.location.pathname;
      history.pushState({ section: key }, '', url);
    }
  }

  $(function() {
    // zapisz stan startowy
    history.replaceState({ section: null }, '', window.location.pathname);

    // obsługa kliknięć
    $('a.button').on('click', function(e) {
      e.preventDefault();
      var section = $(this).data('section');
      loadSection(section, true);
    });

    // back/forward
    window.addEventListener('popstate', function(e) {
      loadSection(e.state && e.state.section, false);
    });
  });
})(jQuery);
