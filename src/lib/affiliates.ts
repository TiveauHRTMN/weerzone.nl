// ===========================================
// Affiliate configuratie
// Vul hier je partner-ID's in zodra je accounts hebt
// ===========================================

export const AFFILIATE_CONFIG = {
  bol: {
    // Bol.com partnerprogramma: https://partnerprogramma.bol.com
    // Na aanmelding krijg je een partner-id en site-id
    partnerId: "", // bijv. "KutWeer-21"
    enabled: false, // zet op true zodra je ID hebt
  },
  booking: {
    // Booking.com affiliate: https://www.booking.com/affiliate-program
    // Na aanmelding krijg je een aid nummer
    aid: "", // bijv. "2311236"
    enabled: false,
  },
  thuisbezorgd: {
    // Thuisbezorgd via Awin: https://www.awin.com
    // Zoek "Thuisbezorgd" in Awin, je krijgt een publisher-id
    publisherId: "", // bijv. "123456"
    awinMerchantId: "14376", // Thuisbezorgd merchant ID bij Awin
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
  if (!AFFILIATE_CONFIG.booking.enabled || !AFFILIATE_CONFIG.booking.aid) {
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`;
  }
  return `https://www.booking.com/searchresults.html?aid=${AFFILIATE_CONFIG.booking.aid}&ss=${encodeURIComponent(destination)}&label=kutweer`;
}

export function thuisbezorgdUrl(): string {
  if (!AFFILIATE_CONFIG.thuisbezorgd.enabled || !AFFILIATE_CONFIG.thuisbezorgd.publisherId) {
    return "https://www.thuisbezorgd.nl";
  }
  return `https://www.awin1.com/cread.php?awinmid=${AFFILIATE_CONFIG.thuisbezorgd.awinMerchantId}&awinaffid=${AFFILIATE_CONFIG.thuisbezorgd.publisherId}&ued=${encodeURIComponent("https://www.thuisbezorgd.nl")}`;
}
