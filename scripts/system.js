/**
 * BESM d20 System for Foundry VTT v13+
 * A comprehensive system for playing Big Eyes Small Mouth d20
 */

// Import document classes
import { BESMActor } from "./documents/actor.js";
import { BESMItem } from "./documents/item.js";

// Initialize the system
Hooks.once("init", async function() {
  // Register Handlebars helpers
  Handlebars.registerHelper("numberValue", (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  });
  Handlebars.registerHelper("signedNumber", (v) => {
    const n = Number(v) || 0;
    return n >= 0 ? `+${n}` : `${n}`;
  });
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("lt", (a, b) => Number(a) < Number(b));
  Handlebars.registerHelper("gt", (a, b) => Number(a) > Number(b));
  Handlebars.registerHelper("sub", (a, b) => Number(a) - Number(b));
  console.log("BESM d20 | Initializing the BESM d20 System");

  // Configure initiative
  CONFIG.Combat.initiative = {
    formula: "1d20 + @abilities.dex.mod + @combat.initiativeMisc",
    decimals: 0
  };

  // Configure Actor type labels
  CONFIG.Actor.typeLabels = {
    character: "Character",
    npc: "NPC"
  };

  // Configure Item type labels
  CONFIG.Item.typeLabels = {
    power: "Power",
    attribute: "Attribute",
    defect: "Defect",
    skill: "Skill",
    equipment: "Equipment"
  };

  // Create a namespace within the game object
  game.besm = {
    BESMActor,
    BESMItem,
    rollItemMacro
  };

  // Define system configuration
  CONFIG.BESM = {
    // Abilities configuration (plain labels for readability)
    abilities: {
      str: "Strength",
      dex: "Dexterity", 
      con: "Constitution",
      int: "Intelligence",
      wis: "Wisdom",
      cha: "Charisma"
    },

    // Skills configuration (plain labels for readability)
    skills: {
      balance: "Balance",
      bluff: "Bluff",
      climb: "Climb",
      concentration: "Concentration",
      computerUse: "Computer Use",
      craft: "Craft",
      decipherScript: "Decipher Script",
      diplomacy: "Diplomacy",
      disableDevice: "Disable Device",
      disguise: "Disguise",
      drive: "Drive",
      escapeArtist: "Escape Artist",
      forgery: "Forgery",
      gamble: "Gamble",
      gatherInformation: "Gather Information",
      handleAnimal: "Handle Animal",
      hide: "Hide",
      intimidate: "Intimidate",
      investigate: "Investigate",
      jump: "Jump",
      knowledge: "Knowledge",
      listen: "Listen",
      moveSilently: "Move Silently",
      perform: "Perform",
      pilot: "Pilot",
      poisons: "Poisons",
      powerUsage: "Power Usage",
      powerlifting: "Powerlifting",
      profession: "Profession",
      readLips: "Read Lips",
      repair: "Repair",
      research: "Research",
      ride: "Ride",
      search: "Search",
      seduction: "Seduction",
      senseMotive: "Sense Motive",
      spot: "Spot",
      survival: "Survival",
      swim: "Swim",
      tumble: "Tumble",
      useRope: "Use Rope",
      wildernessTracking: "Wilderness Tracking"
    },

    // Power types
    powerTypes: {
      attack: "BESMD20.PowerTypeAttack",
      defense: "BESMD20.PowerTypeDefense",
      movement: "BESMD20.PowerTypeMovement",
      mental: "BESMD20.PowerTypeMental",
      body: "BESMD20.PowerTypeBody",
      exotic: "BESMD20.PowerTypeExotic",
      special: "BESMD20.PowerTypeSpecial"
    }
  };

  // Set up Document classes
  CONFIG.Actor.documentClass = BESMActor;
  CONFIG.Item.documentClass = BESMItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("besm-d20", BESMActorSheet, { 
    types: ["character", "npc"], 
    makeDefault: true,
    label: "BESMD20.SheetLabels.Actor"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("besm-d20", BESMItemSheet, { 
    types: ["power", "attribute", "defect", "skill", "equipment"], 
    makeDefault: true,
    label: "BESMD20.SheetLabels.Item"
  });

  // Preload template files
  const templatePaths = [
    "systems/besm-d20/templates/actor/character-modern.hbs",
    "systems/besm-d20/templates/actor/npc.hbs",
    "systems/besm-d20/templates/item/power.hbs",
    "systems/besm-d20/templates/item/attribute.hbs",
    "systems/besm-d20/templates/item/defect.hbs",
    "systems/besm-d20/templates/item/equipment.hbs",
    "systems/besm-d20/templates/partials/spec-pill.hbs"
  ];
  
  loadTemplates(templatePaths);

  // Register Handlebars helpers
  Handlebars.registerHelper("times", function(n, block) {
    let accum = '';
    for(let i = 0; i < n; ++i) {
      block.data.index = i;
      block.data.first = i === 0;
      block.data.last = i === (n - 1);
      accum += block.fn(this);
    }
    return accum;
  });

  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper("gt", function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper("lt", function(a, b) {
    return a < b;
  });

  // Simple subtraction helper
  Handlebars.registerHelper("sub", function(a, b) {
    const na = Number(a) || 0;
    const nb = Number(b) || 0;
    return na - nb;
  });

  Handlebars.registerHelper("capitalize", function(str) {
    if (typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  Handlebars.registerHelper("localizeKey", function(key) {
    return game.i18n.localize(key);
  });

  // Build a specialization input path reliably from key and index
  Handlebars.registerHelper("let", function(varName, value, options) {
    if (typeof varName !== "string" || !options) return "";
    let context = {};
    context[varName] = value;
    return options.fn(context);
  });

  Handlebars.registerHelper("specPath", function(key, i, field) {
    const k = String(key ?? "").trim();
    const idx = Number(i) || 0;
    const f = String(field ?? "name");
    if (!k) return `system.skills.__invalid__.specializations.${idx}.${f}`;
    return `system.skills.${k}.specializations.${idx}.${f}`;
  });
});

/**
 * Ready hook - executes after game initialization
 */
Hooks.once("ready", async function() {
  console.log("BESM d20 | System ready");
  
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  
  if (!("uuid" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  
  const item = await Item.fromDropData(data);
  
  // Create the macro command
  const command = `game.besm.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "besm-d20.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a macro to roll an item by name
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  
  if (!actor) {
    return ui.notifications.warn(`No actor selected to roll item '${itemName}'`);
  }
  
  const item = actor.items.find(i => i.name === itemName);
  if (!item) {
    return ui.notifications.warn(`Item '${itemName}' not found on actor '${actor.name}'`);
  }

  // Trigger the item roll
  if (item.type === "power") {
    return item.activatePower();
  } else {
    return item.roll();
  }
}

/* -------------------------------------------- */
/*  Actor Sheet Classes                         */
/* -------------------------------------------- */

/**
 * BESM Character Actor Sheet
 */
class BESMActorSheet extends ActorSheet {
  constructor(...args) {
    super(...args);
    // Track a pending focus target after re-render: { skillKey, index }
    this._pendingSpecFocus = null;
    // Debounce timers for live-saving inputs (keyed by input name)
    this._debounceTimers = {};
  }
  /**
   * Try hard to resolve the skill key for a click target.
   * Order:
   * 1) element.dataset.skill / dataset.skillKey
   * 2) walk up ancestors looking for non-empty data-skill
   * 3) find enclosing tr.skill-spec-row, then look at previous tr.skill-row's data-skill
   * 4) extract from any input/select name like system.skills.<key>.* within the skill-row
   */
  _resolveSkillKey(target) {
    if (!target) return '';
    // 1) direct dataset
    let skillKey = target.dataset?.skill || target.dataset?.skillKey || '';
    // 2) ancestor with non-empty data-skill
    if (!skillKey) {
      let node = target;
      while (node && !skillKey) {
        const v = node.dataset?.skill || node.getAttribute?.('data-skill') || '';
        if (v) skillKey = v;
        node = node.parentElement;
      }
    }
    // 3) sibling skill-row
    if (!skillKey) {
      const specRow = target.closest?.('tr.skill-spec-row');
      const skillRow = specRow?.previousElementSibling;
      if (skillRow && skillRow.classList?.contains('skill-row')) {
        skillKey = skillRow.dataset?.skill || skillRow.getAttribute?.('data-skill') || '';
        if (!skillKey) {
          // 4) try to infer from any input/select name path inside the skill-row
          const el = skillRow.querySelector?.('[name^="system.skills."]');
          const name = el?.getAttribute?.('name') || '';
          const m = name.match(/^system\.skills\.([^\.]+)\./);
          if (m) skillKey = m[1];
        }
      }
    }
    return skillKey || '';
  }
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["besm", "sheet", "actor"],
      width: 720,
      height: 680,
      tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "main" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    if (this.actor.type === "character") {
      return "systems/besm-d20/templates/actor/character-modern.hbs";
    }
    return `systems/besm-d20/templates/actor/${this.actor.type}.hbs`;
  }

  /** @override */
  render(force = false, options = {}) {
    return super.render(force, options);
  }

  /** @override */
  async getData() {
    const context = super.getData();
    
    // Add the actor's data to context for easier access
    context.system = this.actor.system;
    // Ensure every configured ability has a default object so the template's
    // `{{#with (lookup ../system.abilities abilityKey) as |ability|}}` blocks
    // evaluate even if the actor is missing an ability bucket. This prevents
    // the Abilities table from rendering blank when the actor data is incomplete.
    context.system.abilities = context.system.abilities || {};
    for (const abKey of Object.keys(CONFIG.BESM?.abilities || {})) {
      if (!Object.prototype.hasOwnProperty.call(context.system.abilities, abKey) || !context.system.abilities[abKey]) {
        context.system.abilities[abKey] = { value: 0, mod: 0 };
      } else {
        // Ensure expected fields exist
        context.system.abilities[abKey].value = Number(context.system.abilities[abKey].value) || 0;
        context.system.abilities[abKey].mod = Number(context.system.abilities[abKey].mod) || 0;
      }
    }
    context.flags = this.actor.flags;

    // Prepare character data
    this._prepareItems(context);
    this._prepareCharacterData(context);

    // Add configuration data
    context.config = CONFIG.BESM;
    
    // Add ability labels for templates
    context.abilityLabels = {
      str: "BESMD20.AbilityStr",
      dex: "BESMD20.AbilityDex", 
      con: "BESMD20.AbilityCon",
      int: "BESMD20.AbilityInt",
      wis: "BESMD20.AbilityWis",
      cha: "BESMD20.AbilityCha"
    };

    return context;
  }

  /** @override */
  async _updateObject(event, formData) {
    // See what the browser is actually posting
    console.debug("BESM | ActorSheet _updateObject (flat)", formData);

    const expanded = foundry.utils.expandObject(formData);
    console.debug("BESM | ActorSheet _updateObject (expanded skills)", expanded?.system?.skills);

    const data = foundry.utils.expandObject(formData);

    // Walk skills: normalize and clean stray empty-key buckets created by bad name paths
    const skills = data.system?.skills ?? {};
    // If the form produced an __invalid__ bucket for specializations, attempt to recover them
    // using the most recently interacted skill key captured on the sheet instance.
    if (skills.__invalid__?.specializations) {
      const invalidSpecs = skills.__invalid__.specializations;
      // Coerce object-like to array
      const raw = Array.isArray(invalidSpecs) ? invalidSpecs : Object.values(invalidSpecs);
      // Filter meaningful entries (has a name or non-zero bonus)
      const meaningful = raw
        .map(s => ({ name: String(s?.name ?? ''), bonus: Number(s?.bonus ?? 0) || 0 }))
        .filter(s => s.name.trim().length > 0 || s.bonus !== 0);
      if (meaningful.length && this._lastSpecSkillKey) {
        const tgtKey = this._lastSpecSkillKey;
        skills[tgtKey] = skills[tgtKey] || {};
        const existing = skills[tgtKey].specializations;
        const asArray = Array.isArray(existing) ? existing : (existing && typeof existing === 'object' ? Object.values(existing) : []);
        skills[tgtKey].specializations = [...asArray, ...meaningful];
        // Clear invalid bucket to avoid clobber
        delete skills.__invalid__;
      }
    }
    if (Object.prototype.hasOwnProperty.call(skills, "")) {
      delete skills[""]; // remove empty-key bucket
    }
    if (Object.prototype.hasOwnProperty.call(skills, "__invalid__")) {
      delete skills["__invalid__"]; // drop any invalid bucket created by template helper fallback
    }
    const validKeys = Object.keys(CONFIG.BESM?.skills || {});
    // Helper to coerce object-with-numeric-keys into an array
    const toArray = (val) => {
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object') return Object.values(val);
      return [];
    };

    for (const [k, v] of Object.entries(skills)) {
      // If this key isn't recognized, keep it (future-proof) unless it's obviously empty string
      if (k === "") { delete skills[""]; continue; }
      // Preserve existing specializations if the form didn't submit any for this skill
      const existingSpecs = toArray(foundry.utils.getProperty(this.actor, `system.skills.${k}.specializations`) || []);
      const hasSubmittedSpecs = Object.prototype.hasOwnProperty.call(v || {}, 'specializations');
      const rawSpecs = hasSubmittedSpecs ? toArray(v?.specializations) : existingSpecs;
      // Normalize spec objects, tolerating array-valued fields from duplicate inputs
      const pickName = (val) => {
        if (Array.isArray(val)) {
          const arr = val;
          const found = [...arr].reverse().find(x => String(x ?? '').trim() !== '');
          return String(found ?? arr[arr.length - 1] ?? '');
        }
        return String(val ?? '');
      };
      const pickBonus = (val) => {
        if (Array.isArray(val)) {
          const arr = val;
          const found = [...arr].reverse().map(x => Number(x)).find(n => !isNaN(n));
          return isNaN(found) ? 0 : found;
        }
        const n = Number(val);
        return isNaN(n) ? 0 : n;
      };
      // Normalize spec objects without discarding empty rows (so users can add then type)
      skills[k].specializations = rawSpecs.map(s => ({
        name: pickName(s?.name),
        bonus: pickBonus(s?.bonus)
      }));
    }

    // Collapse back and submit
    const collapsed = foundry.utils.flattenObject(data);
    return super._updateObject(event, collapsed);
  }

  /**
   * Organize and classify Items for Character sheets
   */
  _prepareItems(context) {
    const powers = [];
    const attributes = [];
    const defects = [];
    const equipment = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === 'power') {
        powers.push(i);
      } else if (i.type === 'attribute') {
        attributes.push(i);
      } else if (i.type === 'defect') {
        defects.push(i);
      } else if (i.type === 'equipment') {
        equipment.push(i);
      }
    }

    context.powers = powers;
    context.attributes = attributes;
    context.defects = defects;
    context.equipment = equipment;
  }

  /**
   * Prepare character sheet specific data
   */
  _prepareCharacterData(context) {
    // Calculate total point costs
    let totalPowerCost = 0;
    let totalAttributeCost = 0;
    let totalDefectBonus = 0;

    context.powers.forEach(power => {
      totalPowerCost += power.system.totalCost || 0;
    });

    context.attributes.forEach(attr => {
      totalAttributeCost += attr.system.totalCost || 0;
    });

    context.defects.forEach(defect => {
      totalDefectBonus += defect.system.totalBonus || 0;
    });

    context.characterPoints = {
      powers: totalPowerCost,
      attributes: totalAttributeCost,
      defects: totalDefectBonus,
      total: totalPowerCost + totalAttributeCost - totalDefectBonus
    };
  }

  /**
   * Add a blank specialization to a skill
   */
  async _onSpecAdd(event) {
    event.preventDefault();
    const ds = event.currentTarget?.dataset || {};
    let skillKey = this._resolveSkillKey(event.currentTarget);
    if (!skillKey) {
      console.warn("BESM | _onSpecAdd: Missing skill key on target", ds, event.currentTarget);
      ui.notifications?.warn?.("Couldn't determine which skill to add a specialization to.");
      return;
    }
    const path = `system.skills.${skillKey}.specializations`;
    const specs = foundry.utils.duplicate(foundry.utils.getProperty(this.actor, path) ?? []);
    console.debug("BESM | _onSpecAdd before", skillKey, specs);
    specs.push({ name: "", bonus: 0 });
    // Update without forcing an automatic render; we will render once and preserve state
    await this.actor.update({ [path]: specs }, { render: false });
    // After render, open the drawer for this skill and focus the new spec name input
    this._pendingSpecFocus = { skillKey, index: specs.length - 1 };
    await this.render(false);
    try {
      const $root = this.element;
      const $row = $root.find(`tr.skill-row[data-skill='${skillKey}']`);
      const $drawer = $row.next('tr.skill-spec-row');
      if ($row.length && $drawer.length) {
        $row.addClass('open');
        $drawer.addClass('open');
        $row.find('.skill-spec-toggle').attr('aria-expanded', 'true');
      }
    } catch (e) {
      console.warn('BESM | Failed to open specialization drawer after add', e);
    }
    console.debug("BESM | _onSpecAdd after", skillKey, specs);
  }  /**
   * Remove a specialization from a skill
   */
  async _onSpecRemove(event) {
    event.preventDefault();
    const ds = event.currentTarget?.dataset || {};
    let skillKey = this._resolveSkillKey(event.currentTarget);
    const i = Number(ds.index ?? ds.idx ?? -1);
    if (!skillKey || i < 0) {
      console.warn("BESM | _onSpecRemove: Missing skill key or index", ds, event.currentTarget);
      ui.notifications?.warn?.("Couldn't remove specialization (missing key or index).");
      return;
    }
    const path = `system.skills.${skillKey}.specializations`;
    const specs = foundry.utils.duplicate(foundry.utils.getProperty(this.actor, path) ?? []);
    if (i >= specs.length) return;
    specs.splice(i, 1);
    await this.actor.update({ [path]: specs }, { render: false });
    await this.render(false);
    console.debug("BESM | _onSpecRemove after", skillKey, specs);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Rollable abilities (delegated so it survives re-renders) — always active, even on read-only sheets
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).closest('li.item');
      const itemId = li && (li.data('itemId') || li.attr('data-item-id'));
      const item = itemId ? this.actor.items.get(itemId) : undefined;
      if (!item) return ui.notifications?.warn?.('Item not found.');
      item.sheet?.render?.(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(async ev => {
      const li = $(ev.currentTarget).closest('li.item');
      const itemId = li && (li.data('itemId') || li.attr('data-item-id'));
      const item = itemId ? this.actor.items.get(itemId) : undefined;
      if (!item) return ui.notifications?.warn?.('Item not found.');
      await item.delete();
      li?.slideUp?.(200, () => this.render(false));
    });

    // Activate item
    html.find('.item-activate').click(ev => {
      const li = $(ev.currentTarget).closest('li.item');
      const itemId = li && (li.data('itemId') || li.attr('data-item-id'));
      const item = itemId ? this.actor.items.get(itemId) : undefined;
      if (!item) return ui.notifications?.warn?.('Item not found.');
      if (item.type === 'power') item.activatePower();
    });

  // (Binding moved above to work on read-only sheets too)

  // Skill Specializations
  // Use delegated events so clicks fire even after re-renders
  html.on('click', '.spec-add', this._onSpecAdd.bind(this));
  html.on('click', '.spec-remove', this._onSpecRemove.bind(this));
  // Also support inline pill UI and chip add in summary
  html.on('click', '.pill-add', this._onSpecAdd.bind(this));
  html.on('click', '.pill-remove', this._onSpecRemove.bind(this));
  html.on('click', '.spec-chip-add', this._onSpecAdd.bind(this));

  // Track the most recently interacted specialization's skill key for recovery on submit
  html.on('focusin', 'input[name^="system.skills."][name*=".specializations."]', ev => {
    const key = this._resolveSkillKey(ev.currentTarget);
    if (key) this._lastSpecSkillKey = key;
  });

    // Persist skill fields on blur (rank, raceFeat, misc)
    html.find('input[name*="system.skills"][name*=".rank"], input[name*="system.skills"][name*=".raceFeat"], input[name*="system.skills"][name*=".misc"]').on('blur', async ev => {
      const el = ev.currentTarget;
      const path = el.name;
      if (!path) return;
      const value = Number(el.value);
      // Update without re-rendering
      await this.actor.update({ [path]: isNaN(value) ? 0 : value }, { render: false });
    });

    // Update ability modifier immediately from the input so the UI reflects live typing
    // and debounce autosave the ability value to actor data to persist changes.
    html.on('input', 'input[name^="system.abilities."][name$=".value"]', ev => {
      try {
        const el = ev.currentTarget;
        const name = el.name || '';
        const m = name.match(/^system\.abilities\.([^\.]+)\.value$/);
        if (!m) return;
        const abilityKey = m[1];
        const raw = el.value;
        const val = Number(raw);
        const score = isNaN(val) ? 0 : val;
        const mod = Math.floor((score - 10) / 2);
        // Update the modifier cell in the same row
        const $row = $(el).closest('tr');
        const modCell = $row.find('.ability-mod');
        if (modCell.length) {
          const text = (mod >= 0) ? `+${mod}` : `${mod}`;
          modCell.text(text);
        }
        // Update any roll link in the row that depends on this modifier
        const rollLink = $row.find('.ability-roll a.rollable[data-roll]');
        if (rollLink.length) {
          rollLink.get(0).dataset.roll = `1d20+${mod}`;
        }

        // Debounced save: persist the ability value to actor after a short idle period
        const path = `system.abilities.${abilityKey}.value`;
        if (this._debounceTimers?.[path]) clearTimeout(this._debounceTimers[path]);
        this._debounceTimers[path] = setTimeout(async () => {
          try {
            await this.actor.update({ [path]: score }, { render: false });
          } catch (err) {
            console.warn('BESM | Failed to persist ability value', path, err);
          }
          delete this._debounceTimers[path];
        }, 300);
      } catch (err) {
        console.debug('BESM | Live ability mod update failed', err);
      }
    });

    // Persist specialization fields on blur (name, bonus) and re-render sheet for immediate UI update
    html.on('blur', "input[name^='system.skills.'][name*='.specializations.'][name$='.name']", async ev => {
      const el = ev.currentTarget;
      const path = el.name;
      if (!path) return;
      // If there's a pending debounce for this input, flush it
      if (this._debounceTimers?.[path]) {
        clearTimeout(this._debounceTimers[path]);
        delete this._debounceTimers[path];
      }
      const value = String(el.value ?? "");
      await this.actor.update({ [path]: value }, { render: false });
    });
    html.on('blur', "input[name^='system.skills.'][name*='.specializations.'][name$='.bonus']", async ev => {
      const el = ev.currentTarget;
      const path = el.name;
      if (!path) return;
      if (this._debounceTimers?.[path]) {
        clearTimeout(this._debounceTimers[path]);
        delete this._debounceTimers[path];
      }
      const value = Number(el.value);
      await this.actor.update({ [path]: isNaN(value) ? 0 : value }, { render: false });
    });

    // Debounced live-save for specialization inputs so typing updates actor after a short pause
    html.on('input', "input[name^='system.skills.'][name*='.specializations.']", ev => {
      const el = ev.currentTarget;
      const path = el.name;
      if (!path) return;
      const isBonus = path.endsWith('.bonus');
      const raw = el.value;
      const value = isBonus ? (isNaN(Number(raw)) ? 0 : Number(raw)) : String(raw ?? '');
      // Key by input path
      const key = path;
      if (this._debounceTimers?.[key]) clearTimeout(this._debounceTimers[key]);
      this._debounceTimers[key] = setTimeout(async () => {
        try {
          await this.actor.update({ [path]: value }, { render: false });
        } catch (err) {
          console.warn('BESM | Failed to save specialization input', path, err);
        }
        delete this._debounceTimers[key];
      }, 450);
    });

    // Prevent Enter from submitting the sheet while editing specialization fields
    html.on('keydown', 'input[name^="system.skills."][name*=".specializations."]', ev => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        ev.stopPropagation();
        // Commit current field via blur without forcing a re-render
        ev.currentTarget?.blur?.();
      }
    });

    // Persist class fields on blur and change (name and level)
    html.find('input[name*="system.classes"]').on('blur change', async ev => {
      const el = ev.currentTarget;
      const path = el.name;
      if (!path) return;
      // Check if it's a level field (number) or name field (text)
      const isLevel = path.includes('.level');
      const value = isLevel ? Number(el.value) : String(el.value ?? '');
      // Update without re-rendering
      await this.actor.update({ [path]: isLevel ? (isNaN(value) ? 0 : value) : value }, { render: false });
    });

    // Skill Specializations: toggle open/closed to save space
    html.find('.skill-spec-toggle').click(async ev => {
      ev.preventDefault();
      const $target = $(ev.currentTarget);
      const $skillRow = $target.closest('tr.skill-row');
      const $drawerRow = $skillRow.next('tr.skill-spec-row');
      if (!$skillRow.length || !$drawerRow.length) return;
      const isOpen = $drawerRow.hasClass('open');
      $drawerRow.toggleClass('open', !isOpen);
      $skillRow.toggleClass('open', !isOpen);
      // Update aria state and rotate chevron via CSS
      $skillRow.find('.skill-spec-toggle').attr('aria-expanded', String(!isOpen));
    });

    // If we have a pending focus target (after add), focus its name input
    if (this._pendingSpecFocus) {
      const { skillKey, index } = this._pendingSpecFocus;
      const selector = `input[name='system.skills.${skillKey}.specializations.${index}.name']`;
      const $input = html.find(selector);
      if ($input.length) {
        const el = $input.get(0);
        el.focus();
        el.select?.();
      }
      this._pendingSpecFocus = null;
    }

    // Compact mode toggle
    html.find('input[name="flags.besm-d20.compactMode"]').change(async (ev) => {
      const isCompact = ev.currentTarget.checked;
      await this.actor.setFlag('besm-d20', 'compactMode', isCompact);
    });

    // Drag events for macros
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /** @override */
  async _onChangeInput(event) {
    // Intercept specialization fields so we update without re-rendering the sheet
    const name = event?.target?.name || '';
    if (name.startsWith('system.skills.') && name.includes('.specializations.')) {
      event.preventDefault();
      event.stopPropagation();
      const el = event.target;
      let value;
      if (name.endsWith('.bonus')) {
        const n = Number(el.value);
        value = isNaN(n) ? 0 : n;
      } else {
        value = String(el.value ?? '');
      }
      // If this was accidentally named with __invalid__, try to reroute to the correct skill using DOM context
      let path = name;
      if (name.includes('system.skills.__invalid__.specializations.')) {
        const skillKey = this._resolveSkillKey(el);
        if (skillKey) {
          path = name.replace('system.skills.__invalid__', `system.skills.${skillKey}`);
        }
      }
      await this.actor.update({ [path]: value }, { render: false });
      return;
    }
    // Fallback to default handling for other inputs
    return super._onChangeInput(event);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header?.dataset?.type;
    if (!type) {
      ui.notifications?.warn?.("No item type specified for creation.");
      return;
    }
    const rawData = header.dataset ?? {};
    const data = (foundry?.utils?.duplicate) ? foundry.utils.duplicate(rawData) : { ...rawData };
    const niceType = String(type).charAt(0).toUpperCase() + String(type).slice(1);
    const name = `New ${niceType}`;
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    delete itemData.system["type"];
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset || {};

    // Ensure this is an actor sheet (guard against stray item sheet delegated hit)
    if (!(this instanceof ActorSheet)) {
      console.warn("BESM | _onRoll invoked outside ActorSheet context", this);
    }

    // Hard trace click origin for specialization debugging
    console.debug("BESM | _onRoll click", {classes: element.className, dataset});

    // Specialization roll first (no data-roll attribute on link now)
    if (!dataset.roll && (dataset.skill || dataset.skillkey) && (dataset.index !== undefined)) {
      let skillKey = String(dataset.skill || dataset.skillkey || '');
      const i = Number(dataset.index);
      if (!skillKey) {
        // Try multiple fallbacks: dataset, getAttribute, or walking up the DOM
        const tryResolve = () => {
          // direct dataset
          const ds = element.dataset?.skill || element.getAttribute?.('data-skill');
          if (ds) return ds;
          // walk up parents
          let node = element;
          for (let depth = 0; node && depth < 6; depth++) {
            try {
              const a = node.dataset?.skill || node.getAttribute?.('data-skill');
              if (a) return a;
            } catch (e) {}
            node = node.parentElement;
          }
          return '';
        };
        const nodeKey = tryResolve();
        skillKey = nodeKey || '';
      }
      if (!skillKey) {
        // Extra debug: print the clicked element HTML so we can inspect missing attributes
        try { console.debug('BESM | _onRoll clicked element outerHTML', element.outerHTML); } catch (e) {}
      }
      if (!skillKey) skillKey = this._resolveSkillKey(element) || '';
      // If an input is currently focused inside this sheet (spec name/bonus), blur it to force a save
      try {
        const doc = (this.element && this.element[0] && this.element[0].ownerDocument) ? this.element[0].ownerDocument : document;
        const active = doc.activeElement;
        if (active) {
          const isSpecInput = (active.matches && (active.matches('input.spec-name') || active.matches('input.spec-bonus')))
            || !!active.closest?.('.spec-pill');
          if (isSpecInput) {
            active.blur();
            // give small time for blur handler / debounce flush to run and update actor
            await new Promise(resolve => setTimeout(resolve, 80));
          }
        }
      } catch (err) {
        console.debug('BESM | Could not blur active element before roll', err);
      }
      if (!skillKey) {
        console.warn('BESM | Specialization roll aborted: could not resolve skill key', {dataset});
        ui.notifications?.warn?.('Could not determine which skill this specialization belongs to.');
        return;
      }
      // If there are pending debounce timers for this spec's inputs, flush them to actor data
      try {
        const namePath = `system.skills.${skillKey}.specializations.${i}.name`;
        const bonusPath = `system.skills.${skillKey}.specializations.${i}.bonus`;
        const pending = [];
        const updates = {};
        if (this._debounceTimers?.[namePath]) {
          clearTimeout(this._debounceTimers[namePath]);
          delete this._debounceTimers[namePath];
          // read from DOM
          const pill = element.closest?.('.spec-pill');
          const domName = pill?.querySelector?.('input.spec-name')?.value;
          if (domName !== undefined) updates[namePath] = String(domName ?? '');
        }
        if (this._debounceTimers?.[bonusPath]) {
          clearTimeout(this._debounceTimers[bonusPath]);
          delete this._debounceTimers[bonusPath];
          const pill = element.closest?.('.spec-pill');
          const domBonus = pill?.querySelector?.('input.spec-bonus')?.value;
          if (domBonus !== undefined) {
            const nb = Number(domBonus);
            updates[bonusPath] = isNaN(nb) ? 0 : nb;
          }
        }
        if (Object.keys(updates).length) {
          pending.push(this.actor.update(updates, { render: false }));
        }
        if (pending.length) await Promise.all(pending);
      } catch (err) {
        console.debug('BESM | Error flushing debounced spec inputs before roll', err);
      }
      const skill = this.actor.system?.skills?.[skillKey] || {};
      const baseTotal = Number(skill.total);
      const baseRobust = [skill.rank, skill.abilityMod, skill.raceFeat, skill.misc]
        .map(v => Number(v) || 0)
        .reduce((a, b) => a + b, 0);
      const base = Number.isFinite(baseTotal) ? baseTotal : baseRobust;
      const spec = skill.specializations?.[i] || { name: '', bonus: 0 };
      let specName = String(spec.name || 'Specialization').trim();
      let specBonus = Number(spec.bonus) || 0;
      // If the user has just edited the inputs but they haven't been synced to actor data yet,
      // read the values directly from the DOM relative to the clicked element as a fallback.
      try {
        const pillNode = element.closest?.('.spec-pill');
        console.debug('BESM | DOM fallback: pillNode', pillNode);
        if (pillNode) {
          console.debug('BESM | spec-name value (DOM)', pillNode.querySelector?.('input.spec-name')?.value);
          console.debug('BESM | spec-bonus value (DOM)', pillNode.querySelector?.('input.spec-bonus')?.value);
        }
        if (pillNode) {
          const domName = pillNode.querySelector?.('input.spec-name')?.value;
          const domBonus = pillNode.querySelector?.('input.spec-bonus')?.value;
          if (domName && String(domName).trim() !== '') specName = String(domName).trim();
          if (domBonus !== undefined && domBonus !== null && String(domBonus).trim() !== '') {
            const db = Number(domBonus);
            if (!isNaN(db)) specBonus = db;
          }
        } else {
          const drawer = element.closest?.('tr.skill-spec-row');
          const container = drawer?.querySelector?.(`.skill-specs[data-skill='${skillKey}']`);
          if (container) {
            const pills = container.querySelectorAll('.spec-pill');
            const pill2 = pills?.[i];
            if (pill2) {
              const domName = pill2.querySelector?.('input.spec-name')?.value;
              const domBonus = pill2.querySelector?.('input.spec-bonus')?.value;
              if (domName && String(domName).trim() !== '') specName = String(domName).trim();
              if (domBonus !== undefined && domBonus !== null && String(domBonus).trim() !== '') {
                const db = Number(domBonus);
                if (!isNaN(db)) specBonus = db;
              }
            }
          }
        }
      } catch (err) {
        console.debug('BESM | Could not read spec values from DOM', err);
      }
      let totalMod = (Number(base) || 0) + specBonus;
      console.debug("BESM | Specialization roll", {skillKey, index: i, baseTotal, baseRobust, chosenBase: base, specName, specBonus, totalMod, skill});
      const opts = await this._promptRollOptions();
      if (!opts) return; // cancelled
      const extra = Number(opts.bonus) || 0;
      if (extra) totalMod += extra;
      const note = opts.note ? ` — ${opts.note}` : '';
      // Build label from current actor data, not stale template attribute
      const skillLabel = CONFIG.BESM?.skills?.[skillKey] || skillKey;
      const label = `[ability] ${skillLabel} (${specName}) Check${note}`;
      let formula = `1d20+${totalMod}`;
      formula = String(formula)
        .replace(/,/g, '')
        .replace(/\s+/g, '')
        .replace(/\+\+/g, '+')
        .replace(/\+-/g, '-')
        .replace(/-\+/g, '-')
        .replace(/--/g, '+')
        .replace(/\+$|^-\+/, '');
      const roll = new Roll(formula, this.actor.getRollData());
      await roll.evaluate();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle item rolls
    if (dataset.rollType) {
      if (dataset.rollType === 'item') {
        const li = element.closest('.item');
        const itemId = li && (li.dataset?.itemId || li.getAttribute('data-item-id'));
        const item = itemId ? this.actor.items.get(itemId) : undefined;
        if (item) return item.roll();
        return ui.notifications?.warn?.('Item not found.');
      }
    }

    // Handle formula-based rolls (e.g., skills, ability checks)
    if (dataset.roll) {
      let formula = dataset.roll;
      let label = dataset.label ? `[ability] ${dataset.label}` : '';

      // (No specialization-specific handling here — specialization rolls are handled
      // by the dedicated specialization path above which runs when a link does not
      // include a `data-roll` attribute and has `data-skill` + `data-index`.)

      // For all 1d20 rolls, prompt for an extra modifier and a note
      if (/^\s*1d20/i.test(formula)) {
        const opts = await this._promptRollOptions();
        if (!opts) return; // cancelled
        const bonus = Number(opts.bonus) || 0;
        if (bonus) formula = `${formula}${bonus >= 0 ? '+' : ''}${bonus}`;
        if (opts.note) label = label ? `${label} — ${opts.note}` : opts.note;
      }

      // Sanitize formula to avoid parser errors (e.g., thousands separators, duplicate operators)
      formula = String(formula)
        .replace(/,/g, '')
        .replace(/\s+/g, '');
      // Normalize operator repeats
      formula = formula
        .replace(/\+\+/g, '+')
        .replace(/\+-/g, '-')
        .replace(/-\+/g, '-')
        .replace(/--/g, '+')
        .replace(/\+$|^-\+/, '');

    const roll = new Roll(formula, this.actor.getRollData());
      // Foundry V13+: evaluate() is async by default; the {async} option is removed
      await roll.evaluate();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Prompt user for optional modifier and note to add to a 1d20 roll
   * @returns {Promise<{bonus:number, note:string}|null>} Null if cancelled
   */
  async _promptRollOptions() {
    return new Promise(resolve => {
      const content = `
        <form class="besm roll-options">
          <div class="form-group">
            <label>Additional Modifier</label>
            <input type="number" name="bonus" value="0"/>
          </div>
          <div class="form-group">
            <label>Note</label>
            <input type="text" name="note" placeholder="Optional description"/>
          </div>
        </form>`;
      new Dialog({
        title: 'Roll Options',
        content,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: 'Roll',
            callback: html => {
              const bonus = Number(html.find('input[name="bonus"]').val()) || 0;
              const note = String(html.find('input[name="note"]').val() || '');
              resolve({ bonus, note });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'roll',
        render: html => html.find('input[name="bonus"]').focus()
      }).render(true);
    });
  }

  // Note: _updateObject override is defined earlier to filter blank specializations.
}

/* -------------------------------------------- */
/*  Item Sheet Classes                          */
/* -------------------------------------------- */

/**
 * BESM Item Sheet
 */
class BESMItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["besm", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/besm-d20/templates/item";
    return `${path}/${this.item.type}.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    
    // Add the item's data to context for easier access
    context.system = this.item.system;
    context.flags = this.item.flags;

    // Add configuration data
    context.config = CONFIG.BESM;

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll item
    html.find('.rollable').click(this._onRoll.bind(this));
  }

  /**
   * Handle clickable rolls
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.rollType) {
      if (dataset.rollType === 'damage') {
        this.item.rollDamage();
      } else if (dataset.rollType === 'activate') {
        this.item.activatePower();
      }
    }
  }
}

/*  Actor Creation Hook                         */
/************************************************/

// Set sensible token bar defaults when a new Actor is created
Hooks.on("createActor", async (actor) => {
  if (actor.type !== "character") return;
  await actor.update({
    "prototypeToken.bar1.attribute": "health",
    "prototypeToken.bar2.attribute": "energy"
  });
});
