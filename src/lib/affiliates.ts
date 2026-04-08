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
    // Publisher ID: je CJ account ID
    // Advertiser CID: Booking.com's CJ advertiser ID (krijg je na goedkeuring)
    cjPublisherId: "7923380",
    cjAdvertiserCid: "4347407", // Booking.com BENELUX
    enabled: true,
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
  const bookingTarget = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&label=weerzone`;

  if (!AFFILIATE_CONFIG.booking.enabled || !AFFILIATE_CONFIG.booking.cjAdvertiserCid) {
    return bookingTarget;
  }

  // CJ Affiliate deep link format
  return `https://www.anrdoezrs.net/click-${AFFILIATE_CONFIG.booking.cjPublisherId}-${AFFILIATE_CONFIG.booking.cjAdvertiserCid}?url=${encodeURIComponent(bookingTarget)}`;
}

export function thuisbezorgdUrl(): string {
  if (!AFFILIATE_CONFIG.thuisbezorgd.enabled || !AFFILIATE_CONFIG.thuisbezorgd.publisherId) {
    return "https://www.thuisbezorgd.nl";
  }
  return `https://www.awin1.com/cread.php?awinmid=${AFFILIATE_CONFIG.thuisbezorgd.awinMerchantId}&awinaffid=${AFFILIATE_CONFIG.thuisbezorgd.publisherId}&ued=${encodeURIComponent("https://www.thuisbezorgd.nl")}`;
}
