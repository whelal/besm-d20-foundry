/**
 * Extend the base Actor document to implement system-specific logic for BESM d20
 */
export class BESMActor extends Actor {
  
  /** @override */
  prepareData() {
    super.prepareData();
    
    // Normalize classes array in prepareData (runs before derived data)
    if (this.type === 'character') {
      const systemData = this.system;
      
      // --- Normalize classes safely (no data loss) ---
      let classes = systemData.classes;

      // Coerce object-with-numeric-keys -> real array
      if (!Array.isArray(classes)) {
        const entries = classes && typeof classes === "object" ? Object.values(classes) : [];
        classes = entries.map(c => ({
          name: String(c?.name ?? ""),
          level: Number(c?.level ?? 0) || 0
        }));
      }

      // Seed a sensible default row only if truly empty
      if (classes.length === 0) {
        classes = [{ name: "", level: systemData.level || 1 }];
      }

      // (Optional UI padding — keeps storage minimal but gives users 3 rows to edit)
      const padded = [...classes];
      while (padded.length < 3) padded.push({ name: "", level: 0 });

      // Assign the real data (no blanks) back to the document
      systemData.classes = classes;

      // Provide padded rows to the sheet via a computed convenience (don't store):
      systemData._uiClasses = padded;

      // If you really want to auto-fill primary class level when unset AND actor has a level:
      if ((systemData.classes[0]?.level ?? 0) === 0 && (systemData.level ?? 0) > 0) {
        systemData.classes[0].level = systemData.level;
      }
    }
  }

  /** @override */
  _onUpdate(data, options, userId) {
    // If render: false was explicitly set, skip the parent's render behavior
    if (options.render === false) {
      // Call prepareDerivedData and other update logic without rendering sheets
      this.prepareData();
      // Emit any necessary hooks without rendering
      Hooks.callAll('updateActor', this, data, options, userId);
      return;
    }
    // Otherwise use normal behavior which will render
    super._onUpdate(data, options, userId);
  }

  /** @override */
  getRollData() {
    const data = super.getRollData();
    data.abilities = foundry.utils.deepClone(this.system.abilities || {});
    data.skills = foundry.utils.deepClone(this.system.skills || {});
    data.saves = foundry.utils.deepClone(this.system.saves || {});
    return data;
  }

  /** @override */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, NPC, etc.) to keep things organized
    this._prepareCharacterData();
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData() {
    if (this.type !== 'character') return;

    const systemData = this.system;

    // Ensure expected structures exist for legacy actors
    systemData.details = systemData.details || {};
    if (systemData.details.startingLevel === undefined) {
      systemData.details.startingLevel = systemData.level || 1;
    }
    if (systemData.details.discretionaryPoints === undefined) {
      systemData.details.discretionaryPoints = 0;
    }

    systemData.movement = foundry.utils.mergeObject({ base: 30, misc: 0, total: 30 }, systemData.movement || {}, { inplace: false });

    // Ensure skills structure exists with all required properties
    systemData.skills = systemData.skills || {};
    // Clean up any accidental undefined-key bucket created by mis-scoped handlers
    if (systemData.skills.hasOwnProperty('undefined')) {
      delete systemData.skills.undefined;
    }
    const defaultAbilities = {
      balance: "dex", bluff: "cha", climb: "str", concentration: "con",
      computerUse: "int", craft: "int", decipherScript: "int", diplomacy: "cha",
      disableDevice: "int", disguise: "cha", drive: "dex", escapeArtist: "dex",
      forgery: "int", gamble: "wis", gatherInformation: "cha", handleAnimal: "cha",
      hide: "dex", intimidate: "cha", investigate: "int", jump: "str",
      knowledge: "int", listen: "wis", moveSilently: "dex", perform: "cha",
      pilot: "dex", poisons: "int", powerUsage: "int", powerlifting: "str",
      profession: "wis", readLips: "int", repair: "int", research: "int",
      ride: "dex", search: "int", seduction: "cha", senseMotive: "wis",
      spot: "wis", survival: "wis", swim: "str", tumble: "dex",
      useRope: "dex", wildernessTracking: "int"
    };
    
    for (const [skillId, defaultAbility] of Object.entries(defaultAbilities)) {
      if (!systemData.skills[skillId]) {
        systemData.skills[skillId] = {
          rank: 0,
          ability: defaultAbility,
          abilityMod: 0,
          raceFeat: 0,
          misc: 0,
          total: 0
        };
      } else {
        // Only add missing properties, don't overwrite existing ones
        const skill = systemData.skills[skillId];
        if (skill.rank === undefined) skill.rank = 0;
        if (!skill.ability) skill.ability = defaultAbility;
        if (skill.abilityMod === undefined) skill.abilityMod = 0;
        if (skill.raceFeat === undefined) skill.raceFeat = 0;
        if (skill.misc === undefined) skill.misc = 0;
        if (skill.total === undefined) skill.total = 0;
      }
    }

    systemData.saves = systemData.saves || {};
    systemData.saves.fortitude = foundry.utils.mergeObject({ base: 0, misc: 0, abilityMod: 0, total: 0 }, systemData.saves.fortitude || {}, { inplace: false });
    systemData.saves.reflex = foundry.utils.mergeObject({ base: 0, misc: 0, abilityMod: 0, total: 0 }, systemData.saves.reflex || {}, { inplace: false });
    systemData.saves.will = foundry.utils.mergeObject({ base: 0, misc: 0, abilityMod: 0, total: 0 }, systemData.saves.will || {}, { inplace: false });

    systemData.combat = foundry.utils.mergeObject({
      baseAttackBonus: 0,
      meleeMisc: 0,
      rangedMisc: 0,
      initiativeMisc: 0,
      defenseMisc: 0,
      meleeTotal: 0,
      rangedTotal: 0,
      initiativeTotal: 0,
      shockValue: 0,
      armorClass: 10
    }, systemData.combat || {}, { inplace: false });

    // Calculate ability score modifiers
    for (let [key, ability] of Object.entries(systemData.abilities || {})) {
      ability.mod = Math.floor((ability.value - 10) / 2);
    }

    const getAbilityMod = (abilityKey) => systemData.abilities?.[abilityKey]?.mod || 0;

    // Calculate derived stats
    if (systemData.health) {
      systemData.health.max = this._calculateHealthMax();
    }

    if (systemData.energy) {
      systemData.energy.max = this._calculateEnergyMax();
    }

    // Calculate defense values
    if (systemData.defense) {
      systemData.defense.value = this._calculateDefense();
    }

    // Update saving throws
    if (systemData.saves) {
      const saveAbilityMap = {
        fortitude: "con",
        reflex: "dex",
        will: "wis"
      };

      for (const [saveId, abilityKey] of Object.entries(saveAbilityMap)) {
        const save = systemData.saves[saveId];
        if (!save) continue;

        const abilityMod = getAbilityMod(abilityKey);
        save.abilityMod = abilityMod;
        save.total = (save.base || 0) + abilityMod + (save.misc || 0);
      }
    }

    // Update skill totals and normalize specialization arrays
    if (systemData.skills) {
      for (const [skillId, skill] of Object.entries(systemData.skills)) {
        const abilityMod = getAbilityMod(skill.ability);
        skill.abilityMod = abilityMod;
        // Ensure optional bonuses exist
        if (skill.raceFeat === undefined) skill.raceFeat = 0;
        if (skill.misc === undefined) skill.misc = 0;
        // Normalize specializations
        if (!Array.isArray(skill.specializations)) skill.specializations = [];
        skill.specializations = skill.specializations.map(s => ({
          name: String((s && s.name) ?? ""),
          bonus: Number((s && s.bonus) ?? 0) || 0
        }));
        // Total includes rank + ability mod + race/feat + misc
        skill.total = (skill.rank || 0) + abilityMod + (skill.raceFeat || 0) + (skill.misc || 0);
      }
    }

    // Update combat data
    if (systemData.combat) {
      const baseAttack = systemData.combat.baseAttackBonus || 0;
      systemData.combat.meleeTotal = baseAttack + getAbilityMod("str") + (systemData.combat.meleeMisc || 0);
      systemData.combat.rangedTotal = baseAttack + getAbilityMod("dex") + (systemData.combat.rangedMisc || 0);
      systemData.combat.initiativeTotal = getAbilityMod("dex") + (systemData.combat.initiativeMisc || 0);
      systemData.combat.armorClass = systemData.defense?.value || 10;
    }

    if (systemData.movement) {
      systemData.movement.total = (systemData.movement.base || 0) + (systemData.movement.misc || 0);
    }

    // Calculate initiative modifier for core usage
    systemData.initiative = systemData.combat?.initiativeTotal ?? getAbilityMod("dex");
  }

  /**
   * Calculate maximum health points
   */
  _calculateHealthMax() {
    const systemData = this.system;
    const conMod = systemData.abilities?.con?.mod || 0;
    const baseHealth = 10;
    const levelMultiplier = systemData.level || 1;
    
    return baseHealth + (conMod * levelMultiplier);
  }

  /**
   * Calculate maximum energy points
   */
  _calculateEnergyMax() {
    const systemData = this.system;
    const wisMod = systemData.abilities?.wis?.mod || 0;
    const charisma = systemData.abilities?.cha?.value || 10;
    const baseEnergy = 20;
    
    return baseEnergy + wisMod + Math.floor(charisma / 2);
  }

  /**
   * Calculate defense value
   */
  _calculateDefense() {
    const systemData = this.system;
    const dexMod = systemData.abilities?.dex?.mod || 0;
    const baseDefense = 10;
    const armorBonus = systemData.armor?.value || 0;
    const defenseMisc = systemData.combat?.defenseMisc || 0;
    
    return baseDefense + dexMod + armorBonus + defenseMisc;
  }

  /**
   * Roll an ability check
   */
  async rollAbilityCheck(abilityId, options = {}) {
    const ability = this.system.abilities?.[abilityId];
    if (!ability) return null;

    const roll = new Roll("1d20 + @mod", { mod: ability.mod });
    const result = await roll.evaluate();

    // Create the chat message
    const speaker = ChatMessage.getSpeaker({ actor: this });
    const flavor = `${CONFIG.BESM.abilities[abilityId]} Check`;
    
    result.toMessage({
      speaker: speaker,
      flavor: flavor
    });

    return result;
  }

  /**
   * Roll a skill check
   */
  async rollSkillCheck(skillId, options = {}) {
    const skill = this.system.skills?.[skillId];
    if (!skill) return null;

    const ability = this.system.abilities?.[skill.ability];
    const abilityMod = ability?.mod || 0;
    const skillRank = skill.rank || 0;
    const raceFeat = skill.raceFeat || 0;
    const misc = skill.misc || 0;
    const totalMod = abilityMod + skillRank + raceFeat + misc;

    const roll = new Roll("1d20 + @mod", { mod: totalMod });
    const result = await roll.evaluate();

    // Create the chat message
    const speaker = ChatMessage.getSpeaker({ actor: this });
    const abilityName = CONFIG.BESM.abilities[skill.ability];
    const skillName = CONFIG.BESM.skills[skillId];
    const flavor = `${skillName} (${abilityName}) Check`;
    
    result.toMessage({
      speaker: speaker,
      flavor: flavor
    });

    return result;
  }
}