
$(document).ready(function () {
  _.each(PINBALL_PLAYERS, function (playerInfo, i) {
    playerInfo.austinRank = i + 1;
    var template = '<div class="row">'
      +  '<div class="col-md-1"><%= austinRank %></div>'
      +  '<div class="col-md-1"><%= texasRank %></div>'
      +  '<div class="col-md-1"><%= worldRank %></div>'
      +  '<div class="col-md-3"><%= playerName %></div>'
      +  '<div class="col-md-1"><%= points %></div>'
      +  '<div class="col-md-1"><%= events %></div>'
      +'</>';
    var htmlRow = _.template(template)(playerInfo);
    $('.container').append(htmlRow);
  });
});
