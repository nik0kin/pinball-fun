
$(document).ready(function () {
  _.each(PINBALL_PLAYERS, function (playerInfo, i) {
    playerInfo.austinRank = i + 1;
    var template = '<div class="row ' + (i % 2 === 1 ? 'active' : '') + '">'
      +  '<div class="col-xs-1"><b><%= austinRank %></b></div>'
      +  '<div class="col-xs-1"><%= texasRank %></div>'
      +  '<div class="col-xs-1"><%= worldRank %></div>'
      +  '<div class="col-xs-3"><%= playerName %></div>'
      +  '<div class="col-xs-1"><%= points %></div>'
      +  '<div class="col-xs-1"><%= events %></div>'
      +'</>';
    var htmlRow = _.template(template)(playerInfo);
    $('.container').append(htmlRow);
  });
});
