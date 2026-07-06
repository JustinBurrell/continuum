// Generates Android VectorDrawable XMLs for integration provider logos.
//
// Source of truth: simple-icons (installed under web/node_modules/simple-icons),
// which ships each brand's official SVG path data and hex color. simple-icons
// uses a 24x24 viewBox, which lines up with the 24dp viewport used elsewhere
// in android/app/src/main/res/drawable (see ic_google.xml).
//
// Run with: node android/scripts/generate-integration-logos.mjs
//
// NOTE: Microsoft OneDrive is not present in the installed simple-icons
// version (Microsoft's trademarked product icons, including OneDrive, Edge,
// Teams, and Xbox, were pulled from simple-icons). There is no siMicrosoftonedrive
// export to import. ic_logo_onedrive.xml below is generated from the official
// "Microsoft OneDrive" path data vendored from simple-icons@9.21.0, the last
// major release line before the Microsoft icons were removed upstream.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import * as simpleIcons from '../../web/node_modules/simple-icons/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const drawableDir = resolve(__dirname, '../app/src/main/res/drawable');

// Official "Microsoft OneDrive" brandmark, vendored from simple-icons@9.21.0
// (title: "Microsoft OneDrive", hex: 0078D4). Newer simple-icons releases no
// longer ship Microsoft icons, so this path is inlined here verbatim.
const ONEDRIVE_VENDORED_PATH =
  'M19.453 9.95q.961.058 1.787.468.826.41 1.442 1.066.615.657.966 1.512.352.856.352 1.816 0 1.008-.387 1.893-.386.885-1.049 1.547-.662.662-1.546 1.049-.885.387-1.893.387H6q-1.242 0-2.332-.475-1.09-.475-1.904-1.29-.815-.814-1.29-1.903Q0 14.93 0 13.688q0-.985.31-1.887.311-.903.862-1.658.55-.756 1.324-1.325.774-.568 1.711-.861.434-.129.85-.187.416-.06.861-.082h.012q.515-.786 1.207-1.413.691-.627 1.5-1.066.808-.44 1.705-.668.896-.229 1.845-.229 1.278 0 2.456.417 1.177.416 2.144 1.16.967.744 1.658 1.78.692 1.038 1.008 2.28zm-7.265-4.137q-1.325 0-2.52.544-1.195.545-2.04 1.565.446.117.85.299.405.181.792.416l4.78 2.86 2.731-1.15q.27-.117.545-.204.276-.088.58-.147-.293-.937-.855-1.705-.563-.768-1.319-1.318-.755-.551-1.658-.856-.902-.304-1.886-.304zM2.414 16.395l9.914-4.184-3.832-2.297q-.586-.351-1.23-.539-.645-.188-1.325-.188-.914 0-1.722.364-.809.363-1.412.978-.604.616-.955 1.436-.352.82-.352 1.723 0 .703.234 1.423.235.721.68 1.284zm16.711 1.793q.563 0 1.078-.176.516-.176.961-.516l-7.23-4.324-10.301 4.336q.527.328 1.13.504.604.175 1.237.175zm3.012-1.852q.363-.727.363-1.523 0-.774-.293-1.407t-.791-1.072q-.498-.44-1.166-.68-.668-.24-1.406-.24-.422 0-.838.1t-.815.252q-.398.152-.785.334-.386.181-.761.345Z';
const ONEDRIVE_VENDORED_HEX = '0078D4';

const LOGOS = [
  { fileName: 'ic_logo_googledrive', iconKey: 'siGoogledrive' },
  { fileName: 'ic_logo_dropbox', iconKey: 'siDropbox' },
  { fileName: 'ic_logo_notion', iconKey: 'siNotion', darkVariant: true },
  {
    fileName: 'ic_logo_onedrive',
    iconKey: null,
    vendored: { pathData: ONEDRIVE_VENDORED_PATH, hex: ONEDRIVE_VENDORED_HEX },
  },
  { fileName: 'ic_logo_anki', iconKey: 'siAnki' },
  { fileName: 'ic_logo_googlecalendar', iconKey: 'siGooglecalendar' },
  { fileName: 'ic_logo_apple', iconKey: 'siApple', darkVariant: true },
  { fileName: 'ic_logo_quizlet', iconKey: 'siQuizlet' },
  { fileName: 'ic_logo_youtube', iconKey: 'siYoutube' },
];

function vectorDrawableXml(pathData, hexColor) {
  return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#${hexColor}"
        android:pathData="${pathData}" />
</vector>
`;
}

async function writeDrawable(fileName, pathData, hexColor) {
  const outPath = resolve(drawableDir, `${fileName}.xml`);
  await writeFile(outPath, vectorDrawableXml(pathData, hexColor), 'utf8');
  console.log(`wrote ${outPath}`);
}

async function main() {
  for (const logo of LOGOS) {
    let pathData;
    let hex;

    if (logo.vendored) {
      pathData = logo.vendored.pathData;
      hex = logo.vendored.hex;
      console.log(
        `note: ${logo.fileName} uses path data vendored from simple-icons@9.21.0 (icon removed from newer releases)`
      );
    } else {
      const icon = simpleIcons[logo.iconKey];
      if (!icon) {
        throw new Error(`simple-icons export "${logo.iconKey}" not found for ${logo.fileName}`);
      }
      pathData = icon.path;
      hex = icon.hex;
    }

    await writeDrawable(logo.fileName, pathData, hex);

    if (logo.darkVariant) {
      await writeDrawable(`${logo.fileName}_dark`, pathData, 'FFFFFF');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
