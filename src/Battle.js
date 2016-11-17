'use strict';

var EventEmitter = require('events').EventEmitter;
var CharactersView = require('./CharactersView');
var OptionsStack = require('./OptionsStack');
var TurnList = require('./TurnList');
var Effect = require('./items').Effect;

var utils = require('./utils');
var listToMap = utils.listToMap;
var mapValues = utils.mapValues;

function Battle() {
  EventEmitter.call(this);
  this._grimoires = {};
  this._charactersById = {};
  this._turns = new TurnList();

  this.options = new OptionsStack();
  this.characters = new CharactersView();
}
Battle.prototype = Object.create(EventEmitter.prototype);
Battle.prototype.constructor = Battle;

Object.defineProperty(Battle.prototype, 'turnList', {
  get: function () {
    return this._turns ? this._turns.list : null;
  }
});

Battle.prototype.setup = function (parties) {
  this._grimoires = this._extractGrimoiresByParty(parties);
  this._charactersById = this._extractCharactersById(parties);
  this._states = this._resetStates(this._charactersById);
  this._turns.reset(this._charactersById);

  this.characters.set(this._charactersById);
  this.options.clear();
};

Battle.prototype.start = function () {
  this._inProgressAction = null;
  this._stopped = false;
  this.emit('start', this._getCharIdsByParty());
  this._nextTurn();
};

Battle.prototype.stop = function () {
  this._stopped = true;
};

Object.defineProperty(Battle.prototype, '_activeCharacter', {
  get: function () {
    return this._charactersById[this._turns.activeCharacterId];
  }
});

Battle.prototype._extractGrimoiresByParty = function (parties) {
  var grimoires = {};
  var partyIds = Object.keys(parties);
  partyIds.forEach(function (partyId) {
    var partyGrimoire = parties[partyId].grimoire || [];
    grimoires[partyId] = listToMap(partyGrimoire, useName);
  });
  return grimoires;

  function useName(scroll) {
    return scroll.name;
  }
};

Battle.prototype._extractCharactersById = function (parties) {
  var idCounters = {};
  var characters = [];
  var partyIds = Object.keys(parties);
  partyIds.forEach(function (partyId) {
    var members = parties[partyId].members;
    assignParty(members, partyId);
    characters = characters.concat(members);
  });
  return listToMap(characters, useUniqueName);

  function assignParty(characters, party) {
    characters.forEach(function(character){
      character.party = party;
    });
  }

  function useUniqueName(character) {
    var name = character.name;
    if(idCounters[name] === undefined){
      idCounters[name] = 0;
      idCounters[name]++;
    }else{
      idCounters[name]++;
      name += ' ' + idCounters[name];
    }
    return name;
  }
};

Battle.prototype._resetStates = function (charactersById) {
  return Object.keys(charactersById).reduce(function (map, charId) {
    map[charId] = {};
    return map;
  }, {});
};

Battle.prototype._getCharIdsByParty = function () {
  var charIdsByParty = {};
  var charactersById = this._charactersById;
  Object.keys(charactersById).forEach(function (charId) {
    var party = charactersById[charId].party;
    if (!charIdsByParty[party]) {
      charIdsByParty[party] = [];
    }
    charIdsByParty[party].push(charId);
  });
  return charIdsByParty;
};

Battle.prototype._nextTurn = function () {
  if (this._stopped) { return; }
  setTimeout(function () {
    var endOfBattle = this._checkEndOfBattle();
    if (endOfBattle) {
      this.emit('end', endOfBattle);
    } else {
      var turn = this._turns.next();
      this._showActions();
      this.emit('turn', turn);
    }
  }.bind(this), 0);
};

Battle.prototype._checkEndOfBattle = function () {
  var allCharacters = mapValues(this._charactersById);
  var aliveCharacters = allCharacters.filter(isAlive);
  var commonParty = getCommonParty(aliveCharacters);
  return commonParty ? { winner: commonParty } : null;

  function isAlive(character) {
    return !character.isDead();
  }

  function getCommonParty(characters) {
    var uParty = true;
    var primeParty = characters[0].party;
    var x = 1;
    while(x<= characters.length && uParty){
      if(characters[x].party !== primeParty) uParty = false;
      x++;
    }
    if(uParty) return primeParty;
    else return null;
  }
};

Battle.prototype._showActions = function () {
  this.options.current = {
    'attack': true,
    'defend': true,
    'cast': true
  };
  this.options.current.on('chose', this._onAction.bind(this));
};

Battle.prototype._onAction = function (action) {
  this._action = {
    action: action,
    activeCharacterId: this._turns.activeCharacterId
  };

  if(action === 'attack')
    this.emit(this._action, this.attack)
  else if (action === 'defend')
    this.emit(this._action, this._defend)
  else if (action === 'cast')
    this.emit(this._action, this._cast)
};

Battle.prototype._defend = function () {
  var activeCharacterId = this._action.activeCharacterId;
  var newDefense = this._improveDefense(activeCharacterId);
  this._action.targetId = this._action.activeCharacterId;
  this._action.newDefense = newDefense;
  this._executeAction();
};

Battle.prototype._improveDefense = function (targetId) {
  var states = this._states[targetId].defense;
  if(states === undefined) {
    states = this._charactersById[targetId].defense || 0;
  }
  var target = this._charactersById[targetId];
  var improveDefense = Math.ceil(target.defense * 1.1);
  target.defense = improveDefense;
  return target.defense;
};

Battle.prototype._restoreDefense = function (targetId) {
  this._charactersById[targetId]._defense = this._states[targetId].defense;
};

Battle.prototype._attack = function () {
  var self = this;
  self._showTargets(function onTarget(targetId) {
    self._action.targetId = targetId;
    self._action.effect = self._charactersById[self._action.activeCharacterId].weapon.effect;
    self._executeAction();
    self._restoreDefense(targetId);
  });
};

Battle.prototype._cast = function () {
  var self = this;
  self._showScrolls(function onScroll(scrollId, scroll) {
    var aux = self._charactersById[self._turns.activeCharacterId].party;
    scroll = self._grimoires[aux][scrollId];
    self._charactersById[self._turns.activeCharacterId].mp -= scroll.cost;
    
    self._showTargets(function onTarget(targetId){
      self._action.targetId = targetId;
      self._action.effect = scroll.effect
      self._action.scrollName = scrollId;
      self._executeAction();
      self._restoreDefense(targetId);
    });
  });
};

Battle.prototype._executeAction = function () {
  var action = this._action;
  var effect = this._action.effect || new Effect({});
  var activeCharacter = this._charactersById[action.activeCharacterId];
  var targetCharacter = this._charactersById[action.targetId];
  var areAllies = activeCharacter.party === targetCharacter.party;

  var wasSuccessful = targetCharacter.applyEffect(effect, areAllies);
  this._action.success = wasSuccessful;

  this._informAction();
  this._nextTurn();
};

Battle.prototype._informAction = function () {
  this.emit('info', this._action);
};

Battle.prototype._showTargets = function (onSelection) {
  var objetives = {};
  for(var x in this._charactersById){
    if(this._charactersById[x].hp >= 1){
      objetives[x] = x;
    }
  }
  this.options.current = objetives;
  this.options.current.on('chose', onSelection);
};

Battle.prototype._showScrolls = function (onSelection) {
  var party = this._charactersById[this._action.activeCharacterId].party;
  var scrolls = {};

  for (var id in this._grimoires[party]){
    if (this._charactersById[this._action.activeCharacterId].mp >= this._grimoires[party][id].cost)
    {
     scrolls[id] = this._grimoires[party][id];
    }
  }
  this.options.current = scrolls;
  this.options.current.on('chose', onSelection);
};

module.exports = Battle;
