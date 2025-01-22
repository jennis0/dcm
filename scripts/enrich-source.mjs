//Custom code for enriching source - very heavily based on the version in DND5E core. Will remove this once v3.3.1 support no longer needed

// Get book from module metadata
function getModuleBook(pkg) {
    if ( !pkg ) return null;
    const sourceBooks = pkg.flags?.dnd5e?.sourceBooks;
    const keys = Object.keys(sourceBooks ?? {});
    if ( keys.length !== 1 ) return null;
    return keys[0];
  }

// Get package name
function getPackage(uuid) {
  const pack = foundry.utils.parseUuid(uuid)?.collection?.metadata;
  switch ( pack?.packageType ) {
    case "module": return game.modules.get(pack.packageName);
    case "system": return game.system;
    case "world": return game.world;
  }
  return null;
}

/**
 * Prepare the source label.
 * @this {SourceData}
 * @param {string} uuid  Compendium source or document UUID.
 */
export function enrichSource(source, uuid) {

    const pkg = getPackage(uuid);
    if ( !source.book ) {
        source.book = getModuleBook(pkg) ?? "";
    }

    if ( source.custom ) {
        source.label = source.custom;
    }
    else {
        source.label = source.book;
    }

    source.value = source.book || (pkg?.title ?? "");
    source.slug = source.value.slugify({ strict: true });
    return source
}
