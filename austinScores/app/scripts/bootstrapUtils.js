
export var initDropdown = function (dropdownElementId, callback) {
  $('#'+dropdownElementId+' .dropdown-menu li a').click(function () {
    let $dropdownButton = $(this).parents(".dropdown").find('.btn');
    let text = $(this).text();
    let value = $(this).data('value');
    $dropdownButton.html(text + ' <span class="caret"></span>');
    $dropdownButton.val(value);

    if (typeof(callback) === 'function') {
      callback(text, value);
    }
  });
};
