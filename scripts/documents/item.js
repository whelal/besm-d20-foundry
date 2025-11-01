/**
 * Extend the base Item document to implement system-specific logic for BESM d20
 */
export class BESMItem extends Item {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;

    // Make separate methods for each Item type to keep things organized
    this._preparePowerData();
    this._prepareAttributeData();
    this._prepareDefectData();
  }

  /**
   * Prepare Power type specific data
   */
  _preparePowerData() {
    if (this.type !== 'power') return;
    
    const systemData = this.system;
    
    // Calculate total cost based on rank and modifiers
    if (systemData.rank && systemData.baseCost) {
      systemData.totalCost = systemData.baseCost * systemData.rank;
      
      // Apply cost modifiers
      if (systemData.modifiers) {
        for (let modifier of systemData.modifiers) {
          if (modifier.type === 'multiplier') {
            systemData.totalCost *= modifier.value;
          } else if (modifier.type === 'addition') {
            systemData.totalCost += modifier.value;
          }
        }
      }
    }
  }

  /**
   * Prepare Attribute type specific data
   */
  _prepareAttributeData() {
    if (this.type !== 'attribute') return;
    
    const systemData = this.system;
    
    // Calculate total cost for attributes
    if (systemData.rank && systemData.baseCost) {
      systemData.totalCost = systemData.baseCost * systemData.rank;
    }
  }

  /**
   * Prepare Defect type specific data  
   */
  _prepareDefectData() {
    if (this.type !== 'defect') return;
    
    const systemData = this.system;
    
    // Defects provide bonus points
    if (systemData.rank && systemData.bonusValue) {
      systemData.totalBonus = systemData.bonusValue * systemData.rank;
    }
  }

  /**
   * Activate a power
   */
  async activatePower(options = {}) {
    if (this.type !== 'power') {
      ui.notifications.warn("Only powers can be activated.");
      return;
    }

    const systemData = this.system;
    const actor = this.actor;

    // Check if actor has enough energy
    if (systemData.energyCost && actor) {
      const currentEnergy = actor.system.energy?.value || 0;
      if (currentEnergy < systemData.energyCost) {
        ui.notifications.warn(`Not enough energy! Need ${systemData.energyCost}, have ${currentEnergy}.`);
        return;
      }

      // Deduct energy cost
      await actor.update({
        "system.energy.value": currentEnergy - systemData.energyCost
      });
    }

    // Create activation message
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const content = `
      <div class="besm-power-activation">
        <h3>${this.name} Activated</h3>
        <p><strong>Effect:</strong> ${systemData.description || "No description available."}</p>
        ${systemData.energyCost ? `<p><strong>Energy Cost:</strong> ${systemData.energyCost}</p>` : ""}
      </div>
    `;

    ChatMessage.create({
      speaker: speaker,
      content: content,
      flags: {
        "besm-d20": {
          type: "power-activation",
          itemId: this.id,
          actorId: actor?.id
        }
      }
    });

    return true;
  }

  /**
   * Roll damage for a power
   */
  async rollDamage(options = {}) {
    if (this.type !== 'power') return null;

    const systemData = this.system;
    const damageFormula = systemData.damageFormula;
    
    if (!damageFormula) {
      ui.notifications.info("This power has no damage formula defined.");
      return null;
    }

    const roll = new Roll(damageFormula);
    const result = await roll.evaluate();

    // Create the chat message
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const flavor = `${this.name} Damage`;
    
    result.toMessage({
      speaker: speaker,
      flavor: flavor
    });

    return result;
  }
}