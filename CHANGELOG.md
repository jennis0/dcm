### 1.4.2
New Features:
- Improvement of how duplicate filtering works and addition of an inverse filter to find unique
- Button to collapse/expand tables of items for easier working with large sets of items
Bug Fixes
- "Make Spells journal" option in Create Player Handbook now actually creates a journal
- Fixed QuickInsert integration bug which caused it not to function until changes we made
- Feat handbook no longer contains non-feat features if when not being managed by DCM

### 1.4.1
- Fix for Quick Insert integration broken by latest QI update
- Retain settings when generating player handbooks
- Hide/Unhide items directly from the 5e Item Sheet
- Fix for labels of custom feat types

### 1.4.0
- Introduce Player Option Journal creation - on-demand generation of journals containing approved player options
- Fix items still showing after a source has been removed
- Fix checkbox and slider behaviour in D&D v3.3.1

### 1.3.1
- Add Spotlight Omnisearch integration
- Fixed bug where using the toggle all button in source selector would cause source from other modules to become unselected

### v1.3.0
- Add QuickInsert integration
- Visible lock on module-loaded spelllists which can't be disabled
- Import and export of module settings
- Introduced "Find Duplicate" view mode which filters down to items with identical names

### v1.2.0
- Fix breaking bug in migrations script
- Add Item and Spell filtering
- Add button to open content selector from the compendium sidebar
- Add button to open compendium config from the content selector
- Add button to enable/disable filtering of a particular item type from the compendium selector (currently buggy in D&D5e v3.3.1)

### v1.1.2
- Fix breaking bug in v1.1.1 that caused loss of config
- Improve logging and fix errors when run by non GM users

### v1.1.1
- Fix bug in persisting settings to non-GM users
- Add text search to compendium source setup

### v1.1.0
- Add basic text filter to content browser

### v1.0.0
- First public release
- Implements filtering for Classes, subclasses, feats, backgrounds, species/races, and (to a limited degree) spell lists
- Pimarily v4-focused but compatible with v3 with slightly reduced visual prettyness
