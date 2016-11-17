'use strict';
var dice = require('./dice');

function Character(name, features) {
  features = features || {};
  this.name = name;
  this.party = null;
  this.initiative = features.initiative || 0;
  this._defense = features.defense || 0;
  this.weapon = features.weapon || null;
  this._hp = features.hp || 0;
  this.maxHp = features.maxHp || this._hp || 15;
  this._mp = features.mp || 0;
  this.maxMp = features.maxMp || this._mp;
}

Character.prototype._immuneToEffect = ['name', 'weapon'];

Character.prototype.isDead = function () {
  if (this._hp >= 1) return false;
  else return true;
};

Character.prototype.applyEffect = function (effect, isAlly) {
  var apply = true;
  if(!isAlly) {
    apply = dice.d100() > this.defense;
  }

  if (apply){
    for (var name in effect){
      this[name] += effect[name] || this[name];
    }
  }
  return apply;
};

Object.defineProperty(Character.prototype, 'mp', {
  get: function () {
    return this._mp;
  },
  set: function (newValue) {
    this._mp = Math.max(0, Math.min(newValue, this.maxMp));
  }
});

Object.defineProperty(Character.prototype, 'hp', {
  get: function () {
    return this._hp;
  },
  set: function (newValue) {
    this._hp = Math.max(0, Math.min(newValue, this.maxHp));
  }
});

Object.defineProperty(Character.prototype, 'defense', {
  get: function () {
    return this._defense;
  },
  set: function (newValue) {
    this._defense = Math.max(0, Math.min(newValue, 100));
  }
});

module.exports = Character;
