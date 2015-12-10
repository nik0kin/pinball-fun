
export var initDropdown = function (dropdownElementId, callback, initialValue) {
  let getHtml = function (text) { return text + ' <span class="caret"></span>'}; 

  if (initialValue) {
    $('#'+dropdownElementId + ' .btn').html(getHtml(initialValue));
  }

  $('#'+dropdownElementId+' .dropdown-menu li a').click(function () {
    let $dropdownButton = $(this).parents(".dropdown").find('.btn');
    let value = $(this).text();
    $dropdownButton.html(getHtml(value));

    if (typeof(callback) === 'function') {
      callback(value);
    }
  });
};
