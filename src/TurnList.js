  'use strict';

function TurnList() {}

TurnList.prototype.reset = function (charactersById) {
  this._charactersById = charactersById;

  this._turnIndex = -1;
  this.turnNumber = 0;
  this.activeCharacterId = null;
  this.list = this._sortByInitiative();
};

TurnList.prototype.next = function () {

  var firstTurn = this.turnNumber;
  var characterDead = false;
  this.turnNumber++;

  while(!characterDead){
    firstTurn = firstTurn % this.list.length;
    if(!this._charactersById[this.list[firstTurn]].isDead()) {
      this.activeCharacterId = this.list[firstTurn];
      characterDead = true;
    }
    firstTurn++;
  }

  var next = {
    number: this.turnNumber,
    party: this._charactersById[this.activeCharacterId].party,
    activeCharacterId: this.activeCharacterId
  };

  return next;
};

TurnList.prototype._sortByInitiative = function () {
  var array = [];
  var aux = [];
  for (var i in this._charactersById){
    aux.push({ name: i,
      initiative: this._charactersById[i].initiative
    });
  }

  aux.sort(function(a, b) {
    if(a.initiative > b.initiative) return -1;
    else if (a.initiative < b.initiative) return 1;
    else return 0;
  });

  array = aux.map(function(character){
    return character.name;
  });
  return array;
};

module.exports = TurnList;
