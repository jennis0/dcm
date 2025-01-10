# DnD Content Manager
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjennis0%2Fdcm%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange)
![Dynamic Json Bade](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjennis0%2Fdcm%2Fmain%2Fmodule.json&query=$.relationships.systems%5B%3A1%5D.compatibility.minimum&label=DnD%205e%20Minimum%20Version&color=orange)
![Dynamic Json Bade](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjennis0%2Fdcm%2Fmain%2Fmodule.json&query=$.relationships.systems%5B%3A1%5D.compatibility.verified&label=DnD%205e%20Verified%20Version&color=orange)

![Repository License](https://img.shields.io/github/license/jennis0/dcm)

A content manager for D&amp;D 5e in FoundryVTT. Supports 5e v3.3.1 and v4+

Have you ever wanted to:
- Replace a core subclass, spell, or feat with a homebrew version?
- Use some options from a source book without including them all?
- Use the Foundry Tasha's module with the new PHB, but hiding the Tasha's features which have been replaced?
- Combine premium modules with other sources, such as the DDB Importer, without duplicates?
- Add new spell lists without having to create a module?
  
Or even just have more control over exactly what your players can pick from to better suit the tone or setting of a campaign? And don't want to give you players a long list of which options to avoid or have to spend time figuring out which versions of identically named items to pick?

If so, this module is for you.

The goal of the DCM is to give DMs full control over what options are available to players. It allows you to choose exactly which classes, subclasses, species, feats, backgrounds, items and spells show up in the built-in Compendium Browser, turning it into a single source of available options for you and your players.

## Key Features
- Manage exactly what classes, subclasses, backgrounds, feats, spells, and items appear within the compendium browser
- Create and register new class and subclass spell lists without writing a new module (requires reloading)
- Quickly identify duplicate items coming from multiple sources
- Integrates with the [Quick Insert](https://foundryvtt.com/packages/quick-insert) and [Spotlight Omnisearch] modules so only your chosen items are available within their search windows

![image](https://github.com/user-attachments/assets/712473d8-6576-4130-83ae-43f100e68cf5)

## Usage
Once installed it is simple to configure which options are available via the module settings or the Compendium Directory:
1. (Optional) Set which types of item you want to filter using the "Select Filtered Types" setting
2. Set the base sources for each type of item via the 'Compendium Sources' setting
3. Select the available items from each source via the 'Approved Content' setting (accessible from the Compendium tab or Setting Browser)
4. To enable Spotlight Omnisearch or Quick Insert integration make sure you select this in the main settings menu

Once you've done this, any unselected content is hidden within the Compendium Browser. You can add or remove new options at any time, and unlike with creating compendium specifically for a particular game - there's no deletion, duplication or copying involved so no need to manage updates or changes!

[DCM-demo.webm](https://github.com/user-attachments/assets/5599f62d-e2ae-4390-91f6-2115491de756)

### Adding Spell Lists
Adding new spell lists is easy with the DCM. Simply go to the Spell List tab in the content selector window, and select the lists you want to be used. All selected lists will be loaded the next time you reload the window.

## Limitations/Known Issues

#### Module Spell Lists
Right now there isn't a way to unload spell lists from modules so it's not possible to remove spells loaded by the PHB or Tashas modules (though the Tasha's spells can be hidden by ensuring the SRD spell compendium is not set as a source in the main Compendium Browser settings).

#### Adding New Content
If new content is added it won't be available in the Compendium Browser until you've added it via the 'Approved Content' menu.

#### World Content
Currently we filter out items which are only in the world but not in a Compendium. 

## Future Improvements

#### Improved Filtering
DCM currently only supports grouping items and a basic text search so its not the best user experience for types where there are hundreds/thousands of items (e.g. Equipment). I'd like to improve this and give users better ways to quickly navigate and approve/deny content.

#### Auto-Add Content
Ideally it should be possible to flag some compendiums as being auto-approving, including any content from these by default rather than having to manually approve new items (World items might be a good example of these). 

## License
This package is under an MIT license and the Foundry Virtual Tabletop Limited License Agreement for module development.

## Acknowledgements
This module wouldn't be possible without the core D&D 5E system, the UI heavily borrows from the excellent dev work on the Compendium Browser makes extensive re-use of it's styling, so a big thank you to the developers!
Additional thanks to folks from the League of Extraordinary FoundryVTT Developers discord for answer some no-doubt silly questions
