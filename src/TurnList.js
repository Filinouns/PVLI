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

  this._sortByInitiative();

  for (var i in this._charactersById){
    if(this._charactersById[i]._isDead)
      this.list.splice(i, 1);
  }

  this.activeCharacterId = this.list[0];
  this.party = this._charactersById[this.activeCharacterId].party;

  ++this.turnNumber;
  this.number = this.turnNumber;

  return this;
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

  for(var j in aux) {
    array.push(aux[j].name);
  }
  return array; 

  /*
  return array.sort(function(a, b){
    var First;
    aux.sort (function (c, d){
      if(c < d){
        First = 1;
        return -1;
      } else if (c > d){
        First = -1;
        return 1;
      } else{
        First = 0;
        return 0;
      }
    });
    return First;
  });*/
};

module.exports = TurnList;
