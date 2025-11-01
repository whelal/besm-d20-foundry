/**
 * BESM d20 Utility Functions
 * Helper functions for common BESM d20 calculations and mechanics
 */

export class BESMUtility {
  
  /**
   * Calculate ability modifier from ability score
   * @param {number} score - The ability score
   * @returns {number} The ability modifier
   */
  static getAbilityModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Calculate character point cost for powers/attributes
   * @param {number} baseCost - Base cost per rank
   * @param {number} rank - Current rank
   * @param {Array} modifiers - Array of cost modifiers
   * @returns {number} Total cost
   */
  static calculateCost(baseCost, rank, modifiers = []) {
    let totalCost = baseCost * rank;
    
    for (let modifier of modifiers) {
      if (modifier.type === 'multiplier') {
        totalCost *= modifier.value;
      } else if (modifier.type === 'addition') {
        totalCost += modifier.value;
      }
    }
    
    return Math.max(0, Math.round(totalCost));
  }

  /**
   * Calculate health points
   * @param {number} conMod - Constitution modifier
   * @param {number} level - Character level
   * @param {number} baseHealth - Base health points
   * @returns {number} Maximum health points
   */
  static calculateHealth(conMod = 0, level = 1, baseHealth = 10) {
    return baseHealth + (conMod * level);
  }

  /**
   * Calculate energy points
   * @param {number} wisMod - Wisdom modifier
   * @param {number} chaScore - Charisma score
   * @param {number} baseEnergy - Base energy points
   * @returns {number} Maximum energy points
   */
  static calculateEnergy(wisMod = 0, chaScore = 10, baseEnergy = 20) {
    return baseEnergy + wisMod + Math.floor(chaScore / 2);
  }

  /**
   * Calculate defense value
   * @param {number} dexMod - Dexterity modifier
   * @param {number} armorBonus - Armor bonus
   * @param {number} baseDefense - Base defense value
   * @returns {number} Total defense value
   */
  static calculateDefense(dexMod = 0, armorBonus = 0, baseDefense = 10) {
    return baseDefense + dexMod + armorBonus;
  }

  /**
   * Get power types configuration
   * @returns {Object} Power types with localization keys
   */
  static getPowerTypes() {
    return {
      attack: "BESMD20.PowerTypes.Attack",
      defense: "BESMD20.PowerTypes.Defense", 
      movement: "BESMD20.PowerTypes.Movement",
      mental: "BESMD20.PowerTypes.Mental",
      body: "BESMD20.PowerTypes.Body",
      exotic: "BESMD20.PowerTypes.Exotic",
      special: "BESMD20.PowerTypes.Special"
    };
  }

  /**
   * Get defense types configuration
   * @returns {Object} Defense types with localization keys
   */
  static getDefenseTypes() {
    return {
      physical: "BESMD20.DefenseTypes.Physical",
      mental: "BESMD20.DefenseTypes.Mental",
      soul: "BESMD20.DefenseTypes.Soul"
    };
  }

  /**
   * Roll a d20 with modifier
   * @param {number} modifier - Modifier to add to roll
   * @param {string} label - Label for the roll
   * @param {Actor} actor - Actor making the roll
   * @returns {Promise<Roll>} The roll result
   */
  static async rollD20(modifier = 0, label = "", actor = null) {
    const roll = new Roll(`1d20 + ${modifier}`);
    const result = await roll.evaluate();
    
    const speaker = actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker();
    
    result.toMessage({
      speaker: speaker,
      flavor: label || "d20 Roll"
    });
    
    return result;
  }

  /**
   * Create a chat message for power activation
   * @param {Item} power - The power being activated
   * @param {Actor} actor - The actor activating the power
   */
  static async createPowerMessage(power, actor) {
    const systemData = power.system;
    const speaker = ChatMessage.getSpeaker({ actor });
    
    const content = `
      <div class="besm-power-activation">
        <h3>${power.name}</h3>
        <p><strong>Type:</strong> ${game.i18n.localize(CONFIG.BESM.powerTypes[systemData.powerType] || "Unknown")}</p>
        <p><strong>Rank:</strong> ${systemData.rank}</p>
        ${systemData.energyCost ? `<p><strong>Energy Cost:</strong> ${systemData.energyCost}</p>` : ""}
        ${systemData.range ? `<p><strong>Range:</strong> ${systemData.range}</p>` : ""}
        ${systemData.duration ? `<p><strong>Duration:</strong> ${systemData.duration}</p>` : ""}
        ${systemData.area ? `<p><strong>Area:</strong> ${systemData.area}</p>` : ""}
        <hr>
        <p>${systemData.description || "No description available."}</p>
      </div>
    `;

    await ChatMessage.create({
      speaker: speaker,
      content: content,
      flags: {
        "besm-d20": {
          type: "power-activation",
          itemId: power.id,
          actorId: actor?.id
        }
      }
    });
  }

  /**
   * Apply damage to an actor
   * @param {Actor} actor - The target actor
   * @param {number} damage - Amount of damage to apply
   * @param {string} type - Type of damage (health/energy)
   */
  static async applyDamage(actor, damage, type = "health") {
    if (!actor) return;
    
    const currentValue = actor.system[type]?.value || 0;
    const newValue = Math.max(0, currentValue - damage);
    
    await actor.update({
      [`system.${type}.value`]: newValue
    });
    
    // Create damage message
    const speaker = ChatMessage.getSpeaker({ actor });
    const content = `
      <div class="besm-damage">
        <h3>Damage Applied</h3>
        <p><strong>Target:</strong> ${actor.name}</p>
        <p><strong>Damage:</strong> ${damage} ${type}</p>
        <p><strong>Remaining ${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${newValue}</p>
      </div>
    `;
    
    await ChatMessage.create({
      speaker: speaker,
      content: content
    });
  }

  /**
   * Validate character point expenditure
   * @param {Actor} actor - The character to validate
   * @returns {Object} Validation result with totals and warnings
   */
  static validateCharacterPoints(actor) {
    if (actor.type !== 'character') return null;
    
    const items = actor.items;
    let powerCost = 0;
    let attributeCost = 0;
    let defectBonus = 0;
    const warnings = [];
    
    // Calculate costs
    items.forEach(item => {
      if (item.type === 'power') {
        powerCost += item.system.totalCost || 0;
      } else if (item.type === 'attribute') {
        attributeCost += item.system.totalCost || 0;
      } else if (item.type === 'defect') {
        defectBonus += item.system.totalBonus || 0;
      }
    });
    
    const totalCost = powerCost + attributeCost - defectBonus;
    
    // Add warnings for common issues
    if (powerCost > 100) {
      warnings.push("Power costs exceed 100 points - this may be excessive for most campaigns");
    }
    
    if (defectBonus > totalCost) {
      warnings.push("Defect bonuses exceed total costs - character gains points");
    }
    
    return {
      powerCost,
      attributeCost,
      defectBonus,
      totalCost,
      warnings
    };
  }
}