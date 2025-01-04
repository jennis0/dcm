# DnD Content Manager
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjennis0%2Fdcm%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange)
![Dynamic Json Bade](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjennis0%2Fdcm%2Fmain%2Fmodule.json&query=$.relationships.systems%5B%3A1%5D.compatibility.minimum&label=DnD%205e%20Core%20Version&color=orange)
![Repository License](https://img.shields.io/github/license/jennis0/dcm)

A content manager for D&amp;D 5e in FoundryVTT. Supports v3.3.1 and v4+


Have you ever wanted to:
- Replace a core subclass, spell, or feat with a homebrew version?
- Use some options from a source book without including them all?
- Use the Foundry Tasha's module with the new PHB, but hiding the Tasha's features which have been replaced?
- Combine premium modules with other sources, such as the DDB Importer, without duplicates?
  
Or even just have more control over exactly what your players can pick from to better suit the tone or setting of a campaign? And don't want to give you players a long list of which options to avoid or have to spend time figuring out which versions of identically named items to pick?

If so, this module is for you.

The goal of the DCM is to give DMs full control over what options are available to players. It allows you to choose exactly which classes, subclasses, species, feats, backgrounds, and spells show up in the built-in Compendium Browser, turning it into a single source of available options for you and your players.

![image](https://github.com/user-attachments/assets/1260a17d-0241-4dd3-a7b4-4cf73f512c7a)

## Usage
Once installed it is simple to configure which options are available via the module settings:
1. (Optional) Set which types of item you want to filter using the "Select Filtered Types" setting
2. Set the base sources for each type of item via the 'Compendium Sources' setting
3. Select the available items from each source via the 'Approved Content' setting

Once you've done this, any unselected content is hidden within the Compendium Browser. You can add or remove new options at any time, and unlike with creating compendium specifically for a particular game - there's no deletion, duplication or copying involved so no need to manage updates or changes!

### Spell Lists
The module currently manages spells based on spell lists rather than individual spells, so the filters are only applied when you select a class filter in the spell list browser. 

## Limitations/Known Issues

#### Module Spell Lists
Right now there isn't a way to unload spell lists from modules so it's not possible to remove spells loaded by the PHB or Tashas modules (though the Tasha's spells can be hidden by ensuring the SRD spell compendium is not set as a source in the main Compendium Browser settings).

#### Adding New Content
If new content is added it won't be available in the Compendium Browser until you've added it via the 'Approved Content' menu.

#### World Content
Currently we filter out items which are only in the world but not in a Compendium. 

## Future Improvements

#### Filter
DCM currently only supports grouping items, not filtering them so its not the best user experience for types where there and hundreds/thousands of items (e.g. Equipment). I'd like to improve this and give users better ways to quickly navigate and approve/deny content.

#### Items and Spells
Once the interface works better for large collections I'd like to include the same functionality for all the remaining item types.

#### Auto-Add Content
Ideally it should be possible to flag some compendiums as being auto-approving, including any content from these by default rather than having to manually approve new items (World items might be a good example of these). 

## License
This package is under an MIT license and the Foundry Virtual Tabletop Limited License Agreement for module development.

## Acknowledgements
This module wouldn't be possible without the core D&D 5E system (and makes extensive re-use of it's styling) so thanks to the developers!
Additional thanks to folks from the League of Extraordinary FoundryVTT Developers discord for answer some no-doubt silly questions
