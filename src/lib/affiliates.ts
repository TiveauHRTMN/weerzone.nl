// ===========================================
// Affiliate configuratie
// Vul hier je partner-ID's in zodra je accounts hebt
// ===========================================

export const AFFILIATE_CONFIG = {
  bol: {
    // Bol.com partnerprogramma: https://partnerprogramma.bol.com
    // Na aanmelding krijg je een partner-id en site-id
    partnerId: "", // bijv. "WeerZone-21"
    enabled: false, // zet op true zodra je ID hebt
  },
  booking: {
    // Booking.com via CJ Affiliate (members.cj.com)
    // Publisher ID: je CJ account CID (NIET de property ID!)
    // → Vind je op: Account > Network Profile, of in de URL, of via Link Generator
    // Advertiser CID: Booking.com BENELUX = 4347407
    // STATUS: Pending approval — zodra "Joined" werken de links
    cjPublisherId: "7923380", // WeerZone CJ Publisher ID
    cjAdvertiserCid: "4347407", // Booking.com BENELUX
    enabled: false, // zet op true zodra Booking.com je goedkeurt (status: Pending)
  },
  amazon: {
    // Amazon Associates NL: https://partnernet.amazon.nl
    // Na aanmelding krijg je een tracking-tag (bijv. "weerzone-21")
    tag: "tiveaubusines-21", // WeerZone Amazon Associates tag
    enabled: true, // LIVE — commissie actief na 3 bestellingen
  },
  thuisbezorgd: {
    // Thuisbezorgd via Awin: https://www.awin.com
    publisherId: "",
    awinMerchantId: "14376",
    enabled: false,
  },
} as const;

// ===========================================
// URL builders — genereren tracking-URLs
// ===========================================

export function bolUrl(path: string): string {
  if (!AFFILIATE_CONFIG.bol.enabled || !AFFILIATE_CONFIG.bol.partnerId) {
    return `https://www.bol.com${path}`;
  }
  return `https://partner.bol.com/click/click?p=1&t=url&s=${AFFILIATE_CONFIG.bol.partnerId}&url=${encodeURIComponent(`https://www.bol.com${path}`)}&f=API`;
}

export function bookingUrl(destination: string): string {
  const bookingTarget = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&label=weerzone`;

  if (!AFFILIATE_CONFIG.booking.enabled || !AFFILIATE_CONFIG.booking.cjPublisherId) {
    return bookingTarget;
  }

  // CJ Affiliate deep link format
  return `https://www.anrdoezrs.net/click-${AFFILIATE_CONFIG.booking.cjPublisherId}-${AFFILIATE_CONFIG.booking.cjAdvertiserCid}?url=${encodeURIComponent(bookingTarget)}`;
}

export function amazonUrl(keywords: string): string {
  if (!AFFILIATE_CONFIG.amazon.enabled || !AFFILIATE_CONFIG.amazon.tag) {
    return `https://www.amazon.nl/s?k=${encodeURIComponent(keywords)}`;
  }
  return `https://www.amazon.nl/s?k=${encodeURIComponent(keywords)}&tag=${AFFILIATE_CONFIG.amazon.tag}`;
}

export function thuisbezorgdUrl(): string {
  if (!AFFILIATE_CONFIG.thuisbezorgd.enabled || !AFFILIATE_CONFIG.thuisbezorgd.publisherId) {
    return "https://www.thuisbezorgd.nl";
  }
  return `https://www.awin1.com/cread.php?awinmid=${AFFILIATE_CONFIG.thuisbezorgd.awinMerchantId}&awinaffid=${AFFILIATE_CONFIG.thuisbezorgd.publisherId}&ued=${encodeURIComponent("https://www.thuisbezorgd.nl")}`;
}
