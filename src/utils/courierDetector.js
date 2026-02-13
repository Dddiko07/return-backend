const COURIERS = [
    // ===== MARKETPLACE =====
    { name: "Shopee Express", codes: ["SPX", "SPXID", "SHOPEE"] },
    { name: "Lazada Logistics", codes: ["LZ", "LZD", "LXAD"] },
    { name: "TikTok Logistics", codes: ["TT", "TTS"] },
  
    // ===== EKSPEDISI NASIONAL =====
    { name: "J&T Express", codes: ["JNT", "JX", "JT"] },
    { name: "JNE", codes: ["JP", "JNE"] },
    { name: "SiCepat", codes: ["SC", "SICEPAT"] },
    { name: "AnterAja", codes: ["ANT", "ANTERAJA"] },
    { name: "Ninja Xpress", codes: ["NJV", "NJVTT", "NINJA"] },
    { name: "ID Express", codes: ["ID"] },
    { name: "TIKI", codes: ["TIKI"] },
    { name: "Lion Parcel", codes: ["LION", "LP"] },
    { name: "J&T Cargo", codes: ["JTC"] },
  
    // ===== POS & REGIONAL =====
    { name: "POS Indonesia", codes: ["POS", "R", "CP", "EE"] },
  
    // ===== INSTANT / SAME DAY =====
    { name: "GoSend", codes: ["GOSEND"] },
    { name: "Grab Express", codes: ["GRAB"] },
  ];
  
  /**
   * DETEKSI JASA KIRIM DARI NOMOR RESI
   */
  export function detectCourier(resi) {
    if (!resi) return "";
    const upper = resi.toUpperCase().trim();
  
    for (const courier of COURIERS) {
      if (courier.codes.some((code) => upper.startsWith(code))) {
        return courier.name;
      }
    }
  
    return ""; // tidak terdeteksi
  }
  