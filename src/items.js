'use strict';

function Item(name, effect) {
  this.name = name;
  this.effect = effect;
}

function Weapon(name, damage, extraEffect) {
  extraEffect = extraEffect || new Effect({});

  Item.call(this, name, extraEffect);
  this.effect.hp = -damage;
  for (var name in extraEffect){
  	this.effect[name] = extraEffect[name];
  }
}
Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;

function Scroll(name, cost, effect) {
  Item.call(this, name, effect);
  this.cost = cost;
}
Scroll.prototype = Object.create(Item.prototype);
Scroll.prototype.constructor = Scroll;

Scroll.prototype.canBeUsed = function (mp) {
  return (mp >= this.cost);
};

function Effect(variations) {
  for(var name in variations) {
  	this[name] = variations[name];
  }
}

module.exports = {
  Item: Item,
  Weapon: Weapon,
  Scroll: Scroll,
  Effect: Effect
};
