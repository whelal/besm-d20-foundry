
# BESM d20 System for Foundry VTT

A comprehensive system for playing **Big Eyes Small Mouth d20** in Foundry Virtual Tabletop.

## Features

### Character Management
- **Full Character Sheets**: Complete character sheets with abilities, skills, health, energy, and defense
- **NPC Support**: Dedicated NPC sheets with challenge ratings and type classification
- **Automated Calculations**: Automatic calculation of ability modifiers, health, energy, and defense values
- **Character Points Tracking**: Built-in character point cost calculation for powers, attributes, and defects

### Powers & Abilities System
- **Powers**: Full power system with ranks, costs, energy usage, and activation mechanics
- **Attributes**: Character attributes with rank-based cost calculation
- **Defects**: Character defects that provide bonus character points
- **Equipment**: Basic equipment tracking with weight, cost, and equipped status

### Game Mechanics
- **d20 Rolls**: Built-in d20 rolling for abilities and skills
- **Power Activation**: One-click power activation with energy cost deduction
- **Damage Rolls**: Configurable damage formulas for powers
- **Defense Types**: Support for Physical, Mental, and Soul defense types

### Skills System
Complete skill list including:
- Acrobatics, Athletics, Awareness
- Computers, Craft, Demolitions
- Diplomacy, Disguise, Drive
- Electronics, Investigation, Knowledge
- Languages, Law, Mechanics
- Medicine, Occult, Performing Arts
- Pilot, Psychology, Science
- Sleight of Hand, Stealth, Streetwise
- Survival, Swimming

### User Interface
- **Modern Design**: Clean, responsive interface optimized for Foundry v13
- **Tabbed Layout**: Organized tabs for different character aspects
- **Drag & Drop**: Full drag and drop support for items
- **Hotbar Integration**: Create macros for quick power activation
- **Localization**: Full English localization with expandable language support

## Installation

### Manual Installation
1. Download the system files
2. Extract to your Foundry VTT Data/systems directory as `besm-d20`
3. Restart Foundry VTT
4. Create a new world using the "BESM d20 System"

### Requirements
- Foundry Virtual Tabletop version 13.330 or later

## Usage

### Creating Characters
1. Create a new Actor and select "Character" type
2. Fill in abilities, skills, and other character details
3. Add powers, attributes, and defects as needed
4. The system automatically calculates derived values

### Powers
- Create powers with ranks, costs, and effects
- Set energy costs for activation
- Configure damage formulas for attack powers
- Specify range, area, duration, and defense type

### Rolling Dice
- Click on ability names to roll ability checks
- Click on skill names to roll skill checks (ability + rank)
- Use power activation buttons for powers
- Damage rolls available for powers with damage formulas

### Character Points
The system tracks character point expenditure:
- Powers and attributes cost character points
- Defects provide bonus character points
- Total cost is calculated automatically

## Customization

### Adding New Skills
Edit the template.json file to add new skills to the character sheet.

### Power Types
The system supports various power types:
- Attack, Defense, Movement
- Mental, Body, Exotic, Special

### Localization
To add new languages:
1. Copy `lang/en.json` to your language code (e.g., `lang/es.json`)
2. Translate the strings
3. Add the language to `system.json`

## Development

### File Structure
```
besm-d20/
├── lang/
│   └── en.json                 # English localization
├── scripts/
│   ├── documents/
│   │   ├── actor.js           # Actor document class
│   │   └── item.js            # Item document class
│   └── system.js              # Main system file
├── styles/
│   └── system.css             # System styling
├── templates/
│   ├── actor/
│   │   ├── character.hbs      # Character sheet
│   │   └── npc.hbs           # NPC sheet
│   └── item/
│       ├── power.hbs          # Power sheet
│       ├── attribute.hbs      # Attribute sheet
│       ├── defect.hbs         # Defect sheet
│       └── equipment.hbs      # Equipment sheet
├── system.json                # System manifest
├── template.json              # Data templates
└── README.md                  # This file
```

### Document Classes
- `BESMActor`: Extends Actor with BESM-specific logic
- `BESMItem`: Extends Item with power/attribute mechanics

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This system is licensed under the MIT License. See LICENSE file for details.

## Credits

- **System Development**: Nova & Contributors
- **Original Game**: Big Eyes Small Mouth d20 by Guardians of Order
- **Platform**: Built for Foundry Virtual Tabletop

## Support

For bug reports and feature requests, please use the GitHub issue tracker.

## Changelog

### v1.0.0
- Initial release for Foundry v13
- Complete character and NPC sheets
- Full powers, attributes, and defects system
- Automated calculations and dice rolling
- Modern responsive UI
- Comprehensive localization
