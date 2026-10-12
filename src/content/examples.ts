// Authentic input — surfacing the sourced example sentences (from Tatoeba) that
// are safe + simple enough for young children. The raw examples are a mix: some
// are perfect ("Pidän kissoista." — I like cats.), others are archaic, garbled,
// off-topic, or touch grown-up themes. This is a CONSERVATIVE automated filter,
// not a substitute for a human pass — it errs heavily toward excluding.
//
// A caregiver-review workflow can later promote borderline cases; for now we
// only ever show sentences that clear every gate below.

import type { Example, LexicalItem } from './types';

const MAX_WORDS = 6;

// Only plain modern Finnish letters + basic punctuation (rejects archaic/garbled
// spellings like "Cauattacat teitenne Coirilda", which carry stray letters).
const FINNISH_ONLY = /^[a-zàäöåA-ZÄÖÅ0-9 ,.!?'’-]+$/;

// Grown-up / scary / unkind themes, matched as stems so inflections are caught.
// Deliberately broad — a false exclude just means one fewer sentence.
const DENY =
  /\b(kuol|kuole|kuoli|tapp|veri|verta|ase|aseen|sota|sodan|metsäst|humal|viina|olut|kalja|alkohol|huume|seks|alaston|paha|pahan|ilke|väkival|paska|vittu|perkele|helvet|saatan|kusi|perse|pelk|pelo|kammo|itke|kyyne|sairas|kipu|vihaa|inhoa|tyhmä|typerä|kirot)/i;
// English-side deny too, so an off-theme translation is caught even if the
// Finnish stem slips through.
const DENY_EN = /\b(die|dead|death|kill|blood|gun|weapon|war|hunt|drunk|alcohol|beer|wine|drug|sex|naked|hate|evil|stupid|scary|afraid|cry|sick|hurt)/i;

// The automated gates above still let through a word used in another sense
// ("Taidat luulla…" for luu, bone; "Missä kuussa…", in which MONTH, for kuu),
// spoken Finnish a learner can't parse yet ("Mä haluun jäätelön"), slang
// translations ("Kiva peli!" — "Nice wheels!") and sayings ("Silmä silmästä").
// So a sentence is shown only once a person has read it: these were picked in
// a QA pass for meaning, child-suitability and standard written Finnish. New
// source data adds nothing until someone adds its good sentences here.
const APPROVED = new Set([
  'Sinä näytät vihaiselta.',
  'Tom näyttää vihaiselta.',
  'Pidän omenoista.',
  'Tykkään omenoista.',
  'Kuu on syksyllä kaunis.',
  'Kuka pitää huolta vauvasta?',
  'Vauvoilla on herkkä iho.',
  'Hänellä on reppu selässä.',
  'Yannilla on pieni reppu.',
  'Mikä painava laukku!',
  'Se on Ginan laukku.',
  'Hän löysi pihalta pallon.',
  'Mayuko tiputti pallon.',
  'Ilmapallo tyhjentyi äkisti.',
  'Tom täyttää ilmapalloa.',
  'Pidätkö enemmän omenoista vai banaaneista?',
  'Tomi ei syönyt muuta kuin banaaneita.',
  'Korissa on joitakin omenoita.',
  'Hän on kylpyhuoneessa.',
  'Tom meni kylpyhuoneeseen.',
  'Pidän karhuista.',
  'Tykkään karhuista.',
  'Hän tuli makuuhuoneeseen.',
  'Tomin asunnossa on kolme makuuhuonetta.',
  'Kuljen kouluun pyörällä.',
  'Tomi unohtaa aina Marin syntymäpäivän.',
  'Pidän mustasta väristä.',
  'Mari osti hameen ja puseron.',
  'Mary oli pukeutunut silkkiseen puseroon.',
  'Pidän sinisestä väristä.',
  'Nukuin veneessä.',
  'Olen veneessä.',
  'Puhumme kirjoista.',
  'Tarvitsen uudet saappaat.',
  'Tom tahtoi ostaa uudet saappaat.',
  'Mitä laatikossa oli?',
  'No, mitä laatikossa on?',
  'Hänellä on ruskeat silmät.',
  'Tomilla on ruskeat silmät.',
  'Tämä talo rakennettiin vuonna 1870.',
  'Tämä hotelli rakennettiin viime vuonna.',
  'Tom on bussissa.',
  'Tomi ei saanut unta bussissa.',
  'Katso, perhonen!',
  'Pidän perhosista.',
  'Mitä pitikään ostaa kaupasta?',
  'Tavataan kahvilassa.',
  'Pidimme hauskaa kahvilassa.',
  'Leivon kakkuja melkein joka päivä.',
  'Hän on hyväntuulinen ja rauhallinen.',
  'Suomi on rauhallinen maa.',
  'Sytytin kynttilät.',
  'Sytytä kynttilät.',
  'Pidän myös karkista.',
  'Ota karkkeja, jos maistuu.',
  'Veljeni tykkää autoista.',
  'Tom tietää kaiken autoista.',
  'Jänikset tykkäävät porkkanoista.',
  'Pidän kissoista.',
  'Pidätkö kissoista?',
  'Koira on tuolilla.',
  'Tuolilla istui kissa.',
  'Pidän juustosta.',
  'Tomi ei pidä kanasta.',
  'En pidä suklaasta.',
  'Pidän suklaasta.',
  'Valitse yksi vaihtoehdoista.',
  'En pidä isoista kaupungeista.',
  'Talo pitää siivota.',
  'Siivotaan ullakko.',
  'Kello on kahdeksan.',
  'Hän ompeli napin takkiin.',
  'Leivoin keksejä.',
  'Tom teki keksejä.',
  'Lehmistä saadaan maitoa.',
  'Missä on tulli?',
  'Koalat ovat söpöjä.',
  'Pöllöt ovat söpöjä.',
  'He tanssivat.',
  'Tanssitaan.',
  'Erotatko sutta koirasta?',
  'Ankka katosi.',
  'Hän virnisti korvasta korvaa.',
  'Norsulla on pitkä kärsä.',
  'Norsut juovat vettä.',
  'Kuinka sanotaan ’rotta’ englanniksi?',
  'Puhutteko englantia?',
  'Sain sen isältä.',
  'Herra Wood tuli kentälle.',
  'Tom ei saa sormustaan pois sormesta.',
  'Hauki on kala.',
  'Tässä järvessä on paljon kalaa.',
  'Lintu lentää siipiään räpytellen.',
  'Hän on hyvä jalkapallossa.',
  'Olen hyvä jalkapallossa.',
  'Näetkö sinä sitä kettua?',
  'Sammakko kaivossa ei tiedä mitään merestä.',
  'Kuulostaa hauskalta.',
  'Eikö sinun kannattaisi käyttää käsineitä?',
  'Hän osti uudet käsineet.',
  'Hei, isoisä.',
  'Tom on Marin isoisä.',
  'Mari on Tomin isoäiti.',
  'Tomin isoäiti näyttää terveeltä.',
  'Lammas syö ruohoa.',
  'Minä pidän vihreästä teestä.',
  'Pidän vihreästä.',
  'Se ei vanhene koskaan.',
  'Vanhenemme päivä päivältä.',
  'Katkaisin kielen kitarasta.',
  'Ostin uuden kitaran tänään.',
  'Harrastan liikuntaa.',
  'Se tarvitsee liikuntaa.',
  'Hän on iloinen uudesta työpaikastaan.',
  'Näytät iloiselta.',
  'Hän auttaa naapuria remontissa.',
  'Onko sinulla paljon läksyjä?',
  'Minä pidän hevosista.',
  'Hän on sairaalassa.',
  'Olen sairaalassa.',
  'Halasin Tomia.',
  'He halasivat.',
  'Olen nälkäinen.',
  'Olin nälkäinen.',
  'Haluan jäätelön.',
  'Tomi asuu saaressa.',
  'Ostitko mehua?',
  'Tommi juo mehua.',
  'Olkaa kilttejä toisille.',
  'Olkaa kilttejä.',
  'Saanko uida tässä järvessä?',
  'Uimme järvessä.',
  'Haluan oppia hiihtämään.',
  'Haluan oppia tuntemaan sinut.',
  'Olen ollut kirjastossa.',
  'Oletko kirjastossa?',
  'Leijonat nukkuvat.',
  'Näen leijonan.',
  'Kuuntele minua!',
  'Oletko jo kuunnellut uusimman jakson?',
  'Muista lukita ovi lähtiessäsi.',
  'Katsoin elokuvaa.',
  'Katsoin sitä.',
  'Minä rakastan sinua.',
  'Xavier myy kurpitsaleipää torilla.',
  'Hän loistaa matematiikassa.',
  'Hän on ässä matematiikassa.',
  'On satanut aamusta lähtien.',
  'Japani on tunnettu Fuji-vuoresta.',
  'Kohtasin joitakin vaeltajia vuorella.',
  'Älä puhu ruoka suussa.',
  'Haluatko näytellä elokuvassa?',
  'Mennään tänään elokuviin!',
  'Venäytin lihaksen.',
  'Käyn hyvin harvoin museoissa.',
  'Maalari maalasi taloa valkoiseksi.',
  'Hän teki paperista lumihiutaleen.',
  'Pidän kiiltävästä paperista.',
  'Näin hänet puistossa.',
  'Tom on puistossa.',
  'Kynästä on loppunut muste.',
  'Tom soitti pianolla kappaleen.',
  'Tomi lauloi ja Mari säesti pianolla.',
  'Tunnetko poikaa kuvassa?',
  'Jääkaapissa on pitsan jämät.',
  'Tilasin pitsan.',
  'Me jopa kuulimme lentokoneiden äänet.',
  'Tom on lentokoneessa.',
  'Ruoalla ei saa leikkiä!',
  'Oletko koskenut tähän puuroon?',
  'Puuro on yleinen aamiaisruoka Suomessa.',
  'Olemme ylpeitä sinusta.',
  'Olen ylpeä hänestä.',
  'Hän käski oppilaiden olla hiljaa.',
  'Voitko lukea minulle sadun?',
  'Pidän punaisesta enemmän.',
  'Pysähdyitkö punaisissa valoissa?',
  'Bostonissa on monia hyviä ravintoloita.',
  'En halua sormusta.',
  'He pitävät kalliita sormuksia.',
  'Jätin avaimen huoneeseen.',
  'Tom käveli huoneeseen.',
  'Näytät surulliselta.',
  'Vaikutat surulliselta.',
  'Tomi tekee parhaat vegaaniset makkarat.',
  'Sanoiko hän sen?',
  'Sanoiko hän siitä mitään sinulle?',
  'Tom tahtoi ostaa Marille uuden huivin.',
  'Onko Tom koulussa?',
  'Tom on koulussa.',
  'Etsimme sinua.',
  'Löysitkö etsimäsi?',
  'Hän on laivassa.',
  'Tomi on laivassa.',
  'Hän lauloi minulle laulun.',
  'Lauletaan vielä yksi laulu.',
  'Minulla ei ole siskoja.',
  'Oletteko te siskoja?',
  'Linnut lentävät taivaalla.',
  'He hymyilevät.',
  'En tykkää hämähäkeistä ja käärmeistä.',
  'Istun sohvalla.',
  'Se on sohvalla.',
  'Me puhuimme ainakin tunnin.',
  'Nuorin lapseni opettelee vasta puhumaan.',
  'Hän hämmensi kahvia lusikalla.',
  'Pidän keväästä eniten.',
  'Pidän keväästä.',
  'Seiso tässä.',
  'Seisoin laiturilla odottamassa junaa.',
  'Hänestä tuli tähti.',
  'Mansikoista tehdään hilloa.',
  'Pidän enemmän kirsikoista kuin mansikoista.',
  'Pahinta kesässä on lämpö.',
  'Pidän talvesta enemmän kuin kesästä.',
  'Kissa makaa auringossa.',
  'Lumi suli auringossa.',
  'Mennään taksilla.',
  'Synnyin taksissa.',
  'Hän opettaa englantia koulussa.',
  'Voisitko opettaa sen laulun minulle?',
  'Hän näyttää opettajalta.',
  'Hän pitää opettajasta.',
  'Käytätkö koskaan solmiota?',
  'Pidätkö tästä solmiosta?',
  'Kuulostat väsyneeltä.',
  'Näytät väsyneeltä.',
  'Tykkääkö Tom tomaateista?',
  'Hän on junassa.',
  'Tomilla on heikko vatsa.',
  'Hänellä on yllään keltainen liivi.',
  'Heräsin taas naapurin meteliin.',
  'Kävelen aina portaat ylös.',
  'Kävellään.',
  'Hyvää viikonloppua!',
  'Mitä teit viime viikonloppuna?',
  'Naoko asuu tuossa valkoisessa talossa.',
  'Tomi pitää valkoisesta riisistä.',
  'Minä pidän talvesta.',
  'Pidän talvesta.',
  'Koira ei ole pihalla.',
  'Auto on keltainen.',
  'Se auto on keltainen.',
  'Kävin eilen eläintarhassa.',
  'Näin seepran eläintarhassa.',
]);

/** Does a sentence look like a clean, kid-appropriate one-liner featuring the word? */
function isKidSafe(fi: string, en: string, stem: string): boolean {
  const f = fi.trim();
  if (!f || !en.trim()) return false;
  if (f.split(/\s+/).length > MAX_WORDS) return false; // short only
  if (!FINNISH_ONLY.test(f)) return false; // modern Finnish only
  if (!/[.?!]$/.test(f)) return false; // a complete sentence
  if (!f.toLowerCase().includes(stem)) return false; // actually features the word
  if (DENY.test(f) || DENY_EN.test(en)) return false; // no grown-up/scary/unkind themes
  return APPROVED.has(f); // and a person has checked it
}

/** The word's stem for a "features the word" check (first few letters). */
function stemOf(item: LexicalItem): string {
  return item.fi.slice(0, Math.min(4, item.fi.length)).toLowerCase();
}

/** The subset of an item's sourced examples that pass every kid-safety gate. */
export function kidSafeExamples(item: LexicalItem): Example[] {
  const stem = stemOf(item);
  const seen = new Set<string>();
  const out: Example[] = [];
  for (const e of item.examples ?? []) {
    if (!isKidSafe(e.fi, e.en, stem)) continue;
    const key = e.fi.trim().toLowerCase();
    if (seen.has(key)) continue; // drop duplicate translations
    seen.add(key);
    out.push({ fi: e.fi.trim(), en: e.en.trim() });
  }
  return out;
}

/** Items (from the given pools) that have at least one kid-safe example. */
export function itemsWithExamples(items: readonly LexicalItem[]): LexicalItem[] {
  return items.filter((i) => i.emoji && kidSafeExamples(i).length > 0);
}
