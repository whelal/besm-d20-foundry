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
    "systems/besm-d20/templates/item/equipment.hbs"
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
    const data = foundry.utils.expandObject(formData);

    // Walk skills and drop empty specs
    const skills = data.system?.skills ?? {};
    for (const [k, v] of Object.entries(skills)) {
      const specs = v?.specializations;
      if (Array.isArray(specs)) {
        skills[k].specializations = specs.filter(s => (s?.name ?? "").trim().length);
      }
    }

    // Collapse back and submit
    const collapsed = foundry.utils.flattenObject(data);
    await super._updateObject(event, collapsed);
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
    const skillKey = event.currentTarget.dataset.skill;
    if (!skillKey) return;
    const path = `system.skills.${skillKey}.specializations`;
    const specs = foundry.utils.duplicate(foundry.utils.getProperty(this.actor, path) ?? []);
    specs.push({ name: "", bonus: 0 });
    await this.actor.update({ [path]: specs });
  }

  /**
   * Remove a specialization from a skill
   */
  async _onSpecRemove(event) {
    event.preventDefault();
    const { skill, index } = event.currentTarget.dataset;
    const i = Number(index);
    if (!skill || i < 0) return;
    const path = `system.skills.${skill}.specializations`;
    const specs = foundry.utils.duplicate(foundry.utils.getProperty(this.actor, path) ?? []);
    if (i >= specs.length) return;
    specs.splice(i, 1);
    await this.actor.update({ [path]: specs });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

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

    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));

    // Skill Specializations
    html.find('.spec-add').on('click', this._onSpecAdd.bind(this));
    html.find('.spec-remove').on('click', this._onSpecRemove.bind(this));

    // Persist skill fields on blur (rank, raceFeat, misc)
    html.find('input[name*="system.skills"][name*=".rank"], input[name*="system.skills"][name*=".raceFeat"], input[name*="system.skills"][name*=".misc"]').on('blur', async ev => {
      const el = ev.currentTarget;
      const path = el.name;
      if (!path) return;
      const value = Number(el.value);
      // Update without re-rendering
      await this.actor.update({ [path]: isNaN(value) ? 0 : value }, { render: false });
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
      ev.currentTarget.setAttribute('aria-expanded', String(!isOpen));
    });

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

  /** @override */
  async _updateObject(event, formData) {
    // Let the parent class handle the update
    return super._updateObject(event, formData);
  }
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

