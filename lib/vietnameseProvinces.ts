// Vietnamese provinces data for dropdown selection
export interface Province {
  id: string;
  name: string;
  nameEn: string;
  region: string;
  coordinates?: { lat: number; lon: number };
}

export const vietnameseProvinces: Province[] = [
  // Northern Region
  { id: 'HN', name: 'Hà Nội', nameEn: 'Hanoi', region: 'Northern', coordinates: { lat: 21.0285, lon: 105.8542 } },
  { id: 'HP', name: 'Hải Phòng', nameEn: 'Hai Phong', region: 'Northern', coordinates: { lat: 20.8449, lon: 106.6881 } },
  { id: 'QN', name: 'Quảng Ninh', nameEn: 'Quang Ninh', region: 'Northern', coordinates: { lat: 21.0059, lon: 107.2925 } },
  { id: 'LC', name: 'Lào Cai', nameEn: 'Lao Cai', region: 'Northern', coordinates: { lat: 22.4856, lon: 103.9707 } },
  { id: 'YB', name: 'Yên Bái', nameEn: 'Yen Bai', region: 'Northern', coordinates: { lat: 21.7168, lon: 104.9113 } },
  { id: 'TQ', name: 'Tuyên Quang', nameEn: 'Tuyen Quang', region: 'Northern', coordinates: { lat: 21.8230, lon: 105.2280 } },
  { id: 'LS', name: 'Lạng Sơn', nameEn: 'Lang Son', region: 'Northern', coordinates: { lat: 21.8537, lon: 106.7610 } },
  { id: 'BG', name: 'Bắc Giang', nameEn: 'Bac Giang', region: 'Northern', coordinates: { lat: 21.2731, lon: 106.1946 } },
  { id: 'PH', name: 'Phú Thọ', nameEn: 'Phu Tho', region: 'Northern', coordinates: { lat: 21.4086, lon: 105.2045 } },
  { id: 'VP', name: 'Vĩnh Phúc', nameEn: 'Vinh Phuc', region: 'Northern', coordinates: { lat: 21.3609, lon: 105.6057 } },
  { id: 'BN', name: 'Bắc Ninh', nameEn: 'Bac Ninh', region: 'Northern', coordinates: { lat: 21.1861, lon: 106.0763 } },
  { id: 'HD', name: 'Hải Dương', nameEn: 'Hai Duong', region: 'Northern', coordinates: { lat: 20.9373, lon: 106.3148 } },
  { id: 'HY', name: 'Hưng Yên', nameEn: 'Hung Yen', region: 'Northern', coordinates: { lat: 20.6464, lon: 106.0511 } },
  { id: 'TN_N', name: 'Thái Nguyên', nameEn: 'Thai Nguyen', region: 'Northern', coordinates: { lat: 21.5924, lon: 105.8487 } },
  { id: 'CB', name: 'Cao Bằng', nameEn: 'Cao Bang', region: 'Northern', coordinates: { lat: 22.6358, lon: 106.2565 } },
  { id: 'BK', name: 'Bắc Kạn', nameEn: 'Bac Kan', region: 'Northern', coordinates: { lat: 22.1471, lon: 105.8348 } },
  { id: 'HG_N', name: 'Hà Giang', nameEn: 'Ha Giang', region: 'Northern', coordinates: { lat: 22.8025, lon: 104.9784 } },
  { id: 'DB', name: 'Điện Biên', nameEn: 'Dien Bien', region: 'Northern', coordinates: { lat: 21.3817, lon: 103.0200 } },
  { id: 'LCH', name: 'Lai Châu', nameEn: 'Lai Chau', region: 'Northern', coordinates: { lat: 22.3964, lon: 103.4591 } },
  { id: 'SL', name: 'Sơn La', nameEn: 'Son La', region: 'Northern', coordinates: { lat: 21.3273, lon: 103.9188 } },
  { id: 'HB', name: 'Hòa Bình', nameEn: 'Hoa Binh', region: 'Northern', coordinates: { lat: 20.8137, lon: 105.3382 } },

  // Central Region
  { id: 'TB', name: 'Thái Bình', nameEn: 'Thai Binh', region: 'Central', coordinates: { lat: 20.4463, lon: 106.3365 } },
  { id: 'HNa', name: 'Hà Nam', nameEn: 'Ha Nam', region: 'Central', coordinates: { lat: 20.5835, lon: 105.9230 } },
  { id: 'ND', name: 'Nam Định', nameEn: 'Nam Dinh', region: 'Central', coordinates: { lat: 20.4388, lon: 106.1621 } },
  { id: 'NB', name: 'Ninh Bình', nameEn: 'Ninh Binh', region: 'Central', coordinates: { lat: 20.2506, lon: 105.9744 } },
  { id: 'TH', name: 'Thanh Hóa', nameEn: 'Thanh Hoa', region: 'Central', coordinates: { lat: 19.8067, lon: 105.7851 } },
  { id: 'NA', name: 'Nghệ An', nameEn: 'Nghe An', region: 'Central', coordinates: { lat: 18.6700, lon: 105.6800 } },
  { id: 'HT', name: 'Hà Tĩnh', nameEn: 'Ha Tinh', region: 'Central', coordinates: { lat: 18.3429, lon: 105.9069 } },
  { id: 'QB', name: 'Quảng Bình', nameEn: 'Quang Binh', region: 'Central', coordinates: { lat: 17.4677, lon: 106.6221 } },
  { id: 'QT', name: 'Quảng Trị', nameEn: 'Quang Tri', region: 'Central', coordinates: { lat: 16.7403, lon: 107.1851 } },
  { id: 'TTH', name: 'Thừa Thiên Huế', nameEn: 'Thua Thien Hue', region: 'Central', coordinates: { lat: 16.4637, lon: 107.5909 } },
  { id: 'DN_C', name: 'Đà Nẵng', nameEn: 'Da Nang', region: 'Central', coordinates: { lat: 16.0544, lon: 108.2022 } },
  { id: 'QNa', name: 'Quảng Nam', nameEn: 'Quang Nam', region: 'Central', coordinates: { lat: 15.5394, lon: 108.0191 } },
  { id: 'QNg', name: 'Quảng Ngãi', nameEn: 'Quang Ngai', region: 'Central', coordinates: { lat: 15.1214, lon: 108.8044 } },
  { id: 'BD_C', name: 'Bình Định', nameEn: 'Binh Dinh', region: 'Central', coordinates: { lat: 13.7830, lon: 109.2219 } },
  { id: 'PY', name: 'Phú Yên', nameEn: 'Phu Yen', region: 'Central', coordinates: { lat: 13.0881, lon: 109.0928 } },
  { id: 'KH', name: 'Khánh Hòa', nameEn: 'Khanh Hoa', region: 'Central', coordinates: { lat: 12.2585, lon: 109.0526 } },
  { id: 'NTh', name: 'Ninh Thuận', nameEn: 'Ninh Thuan', region: 'Central', coordinates: { lat: 11.5753, lon: 108.9860 } },
  { id: 'BT_C', name: 'Bình Thuận', nameEn: 'Binh Thuan', region: 'Central', coordinates: { lat: 11.0904, lon: 108.0721 } },
  { id: 'KT', name: 'Kon Tum', nameEn: 'Kon Tum', region: 'Central', coordinates: { lat: 14.3497, lon: 108.0007 } },
  { id: 'GL', name: 'Gia Lai', nameEn: 'Gia Lai', region: 'Central', coordinates: { lat: 13.9826, lon: 108.0004 } },
  { id: 'DL_C', name: 'Đắk Lắk', nameEn: 'Dak Lak', region: 'Central', coordinates: { lat: 12.7100, lon: 108.2378 } },
  { id: 'DNong', name: 'Đắk Nông', nameEn: 'Dak Nong', region: 'Central', coordinates: { lat: 12.2646, lon: 107.6098 } },
  { id: 'LD_C', name: 'Lâm Đồng', nameEn: 'Lam Dong', region: 'Central', coordinates: { lat: 11.5753, lon: 108.1429 } },

  // Southern Region
  { id: 'HCM', name: 'Thành phố Hồ Chí Minh', nameEn: 'Ho Chi Minh City', region: 'Southern', coordinates: { lat: 10.8231, lon: 106.6297 } },
  { id: 'BD_S', name: 'Bình Dương', nameEn: 'Binh Duong', region: 'Southern', coordinates: { lat: 11.3254, lon: 106.4770 } },
  { id: 'BP', name: 'Bình Phước', nameEn: 'Binh Phuoc', region: 'Southern', coordinates: { lat: 11.7511, lon: 106.7234 } },
  { id: 'TN_S', name: 'Tây Ninh', nameEn: 'Tay Ninh', region: 'Southern', coordinates: { lat: 11.3100, lon: 106.0981 } },
  { id: 'LA', name: 'Long An', nameEn: 'Long An', region: 'Southern', coordinates: { lat: 10.6956, lon: 106.2431 } },
  { id: 'TG', name: 'Tiền Giang', nameEn: 'Tien Giang', region: 'Southern', coordinates: { lat: 10.3592, lon: 106.3601 } },
  { id: 'BT_S', name: 'Bến Tre', nameEn: 'Ben Tre', region: 'Southern', coordinates: { lat: 10.2415, lon: 106.3757 } },
  { id: 'TV', name: 'Trà Vinh', nameEn: 'Tra Vinh', region: 'Southern', coordinates: { lat: 9.9477, lon: 106.3422 } },
  { id: 'VL', name: 'Vĩnh Long', nameEn: 'Vinh Long', region: 'Southern', coordinates: { lat: 10.2397, lon: 105.9571 } },
  { id: 'DT', name: 'Đồng Tháp', nameEn: 'Dong Thap', region: 'Southern', coordinates: { lat: 10.4938, lon: 105.6881 } },
  { id: 'AG', name: 'An Giang', nameEn: 'An Giang', region: 'Southern', coordinates: { lat: 10.3886, lon: 105.4359 } },
  { id: 'KG', name: 'Kiên Giang', nameEn: 'Kien Giang', region: 'Southern', coordinates: { lat: 10.0124, lon: 105.0808 } },
  { id: 'CT', name: 'Cần Thơ', nameEn: 'Can Tho', region: 'Southern', coordinates: { lat: 10.0452, lon: 105.7469 } },
  { id: 'HG_S', name: 'Hậu Giang', nameEn: 'Hau Giang', region: 'Southern', coordinates: { lat: 9.7570, lon: 105.6412 } },
  { id: 'ST', name: 'Sóc Trăng', nameEn: 'Soc Trang', region: 'Southern', coordinates: { lat: 9.6003, lon: 105.9800 } },
  { id: 'BL', name: 'Bạc Liêu', nameEn: 'Bac Lieu', region: 'Southern', coordinates: { lat: 9.2940, lon: 105.7215 } },
  { id: 'CM', name: 'Cà Mau', nameEn: 'Ca Mau', region: 'Southern', coordinates: { lat: 9.1768, lon: 105.1524 } },
  { id: 'VT', name: 'Vũng Tàu', nameEn: 'Vung Tau', region: 'Southern', coordinates: { lat: 10.4113, lon: 107.1362 } },
  { id: 'DN_S', name: 'Đồng Nai', nameEn: 'Dong Nai', region: 'Southern', coordinates: { lat: 10.9571, lon: 106.8563 } },
];

export const getProvincesByRegion = () => {
  const northern = vietnameseProvinces.filter(p => p.region === 'Northern');
  const central = vietnameseProvinces.filter(p => p.region === 'Central');
  const southern = vietnameseProvinces.filter(p => p.region === 'Southern');

  return { northern, central, southern };
};

// Get coordinates for a province by name - Fixed to handle undefined/null values
export const getProvinceCoordinates = (provinceName: string): { lat: number; lon: number } | null => {
  // Add null/undefined check to prevent toLowerCase error
  if (!provinceName || typeof provinceName !== 'string') {
    return null;
  }

  const province = vietnameseProvinces.find(p =>
    p.name === provinceName ||
    (p.nameEn && p.nameEn.toLowerCase() === provinceName.toLowerCase())
  );
  return province?.coordinates || null;
};
