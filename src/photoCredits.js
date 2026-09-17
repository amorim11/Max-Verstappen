// Every photo in the timeline and the paddock is a real, CC-licensed image from
// Wikimedia Commons. The CSS colour grading and the background cut-outs count as
// modifications under CC BY-SA, so each credit says the image was edited.
// The hero portrait is the one exception and is credited on its own, below.
export const CREDITS = {
  f3_2014: {
    author: 'Stefan Brending (2eight)',
    license: 'CC BY-SA 3.0 DE',
    url: 'https://commons.wikimedia.org/wiki/File:2014_F3_HockenheimringII_Max_Verstappen_by_2eight_DSC7625_(cropped_less).jpg',
  },
  str10_2015: {
    author: 'nhayashida',
    license: 'CC BY 2.0',
    url: 'https://commons.wikimedia.org/wiki/File:Max_Verstappen_Toro_Rosso_STR10_(22011409992).jpg',
  },
  podium2016: {
    author: 'Morio',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Podium_2016_Malaysia.jpg',
  },
  perez2021: {
    author: 'Jen Ross',
    license: 'CC BY 2.0',
    url: 'https://commons.wikimedia.org/wiki/File:Max_Verstappen_%26_Sergio_Perez,_Silverstone_2021_(51349516878).jpg',
  },
  grid2024: {
    author: 'Steffen Prossdorf',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:2024-08-25_Motorsport,_Formel_1,_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3757_by_Stepro_(Max_Verstappen).jpg',
  },
  rb21_2025: {
    author: 'Liauzh',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:2025_Japan_GP_-_Red_Bull_-_Max_Verstappen_-_Race.jpg',
  },
  rb22_2026: {
    author: 'Liauzh',
    license: 'CC BY 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:2026_Chinese_GP_-_Red_Bull_-_Max_Verstappen_-_FP1.jpg',
  },
  rb22_austria2026: {
    author: 'Lukas Raich',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:FIA_F1_Austria_2026_Nr._3_Verstappen_(1).jpg',
  },
}

// The hero. Both photographs are reworked into the depth, alpha and normal maps
// the hero samples (see tools/hero-maps.py). Neither is CC: they are used
// editorially, on an unofficial fan page.
export const HERO_CREDITS = [
  {
    label: 'retrato',
    author: 'Oracle Red Bull Racing / Formula 1',
    license: 'imagem de imprensa',
    url: 'https://www.formula1.com/en/drivers/max-verstappen',
  },
  {
    label: 'capacete',
    author: 'foto de produto do Schuberth oficial 1:2',
    license: 'GPHelmet',
    url: 'https://gphelmet.com/products/max-verstappen-2024-official-products-1-2-helmet-1',
  },
]

export function creditLabel(key) {
  const credit = CREDITS[key]
  return `Foto: ${credit.author}, ${credit.license} (editada), Wikimedia Commons`
}
