export const MOCK_SCHEMES = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    hiName: 'पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)',
    category: 'Agriculture & Farmers',
    hiCategory: 'कृषि एवं किसान कल्याण',
    level: 'Central',
    hiLevel: 'केंद्रीय',
    state: 'All States / UTs',
    hiState: 'सभी राज्य / केंद्र शासित प्रदेश',
    shortDesc: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.',
    hiShortDesc: 'सभी भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता तीन समान किश्तों में प्रदान की जाती है।',
    fullDesc: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector scheme with 100% funding from Government of India. Under the scheme an income support of 6,000/- per year in three equal installments is provided to all landholding farmer families across the country.',
    hiFullDesc: 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान) भारत सरकार द्वारा 100% वित्त पोषित एक केंद्रीय योजना है। इसके तहत सभी पात्र भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष की आय सहायता सीधे बैंक खाते में दी जाती है।',
    benefits: [
      'Direct Financial Benefit of ₹6,000/year transferred directly to bank accounts',
      '3 equal installments of ₹2,000 every 4 months',
      'Direct Benefit Transfer (DBT) ensuring zero leakage'
    ],
    hiBenefits: [
      '₹6,000/वर्ष का सीधा वित्तीय लाभ बैंक खाते में स्थानांतरित',
      'हर 4 महीने में ₹2,000 की 3 समान किश्तें',
      'प्रत्यक्ष लाभ अंतरण (DBT) से पारदर्शिता और कोई बिचौलिया नहीं'
    ],
    documents: [
      'Aadhaar Card',
      'Proof of Landholding / Khasra-Khatauni Record',
      'Active Bank Account linked with Aadhaar',
      'Mobile Number'
    ],
    hiDocuments: [
      'आधार कार्ड',
      'भूमि स्वामित्व प्रमाण / खसरा-खतौनी की प्रति',
      'आधार से लिंक बैंक खाता विवरण',
      'सक्रिय मोबाइल नंबर'
    ]
  },
  {
    id: 'pm-awas',
    name: 'Pradhan Mantri Awas Yojana (PMAY-G)',
    hiName: 'प्रधानमंत्री आवास योजना (ग्रामीण)',
    category: 'Housing & Shelter',
    hiCategory: 'आवास एवं शेल्टर',
    level: 'Central',
    hiLevel: 'केंद्रीय',
    state: 'All States / UTs',
    hiState: 'सभी राज्य / केंद्र शासित प्रदेश',
    shortDesc: 'Financial assistance for construction of pucca house to rural houseless and living in kutcha houses.',
    hiShortDesc: 'ग्रामीण बेघर और कच्चे मकानों में रहने वाले परिवारों को पक्का मकान बनाने के लिए वित्तीय सहायता।',
    fullDesc: 'PMAY-G aims to provide a pucca house, with basic amenities, to all houseless householders and those households living in kutcha and dilapidated houses by providing financial assistance.',
    hiFullDesc: 'प्रधानमंत्री आवास योजना (ग्रामीण) का उद्देश्य सभी बेघर और जर्जर कच्चे मकानों में रहने वाले ग्रामीण परिवारों को बुनियादी सुविधाओं के साथ पक्का मकान निर्माण हेतु वित्तीय सहायता देना है।',
    benefits: [
      'Financial assistance of ₹1.20 Lakh in plain areas and ₹1.30 Lakh in hilly/difficult areas',
      '90/95 days of unskilled labor under MGNREGA',
      'Assistance for toilet construction under Swachh Bharat Mission'
    ],
    hiBenefits: [
      'मैदानी क्षेत्रों में ₹1.20 लाख और पहाड़ी/दुर्गम क्षेत्रों में ₹1.30 लाख की वित्तीय सहायता',
      'मनरेगा के तहत 90/95 दिनों की अकुशल मजदूरी का लाभ',
      'स्वच्छ भारत मिशन के तहत शौचालय निर्माण हेतु अतिरिक्त सहायता'
    ],
    documents: [
      'Aadhaar Card',
      'Job Card Number (MGNREGA)',
      'Bank Account details',
      'Certificate of Houselessness / Kutcha house proof'
    ],
    hiDocuments: [
      'आधार कार्ड',
      'मनरेगा जॉब कार्ड संख्या',
      'बैंक खाता पासबुक',
      'कच्चे मकान / बेघर होने का प्रमाण पत्र'
    ]
  },
  {
    id: 'old-age-pension',
    name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    hiName: 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना',
    category: 'Social Welfare & Senior Citizens',
    hiCategory: 'सामाजिक कल्याण एवं वरिष्ठ नागरिक',
    level: 'Central & State',
    hiLevel: 'केंद्र व राज्य',
    state: 'All States',
    hiState: 'सभी राज्य',
    shortDesc: 'Monthly pension for senior citizens belonging to Below Poverty Line (BPL) households.',
    hiShortDesc: 'गरीबी रेखा से नीचे (BPL) जीवन यापन करने वाले वरिष्ठ नागरिकों को मासिक वित्तीय सहायता।',
    fullDesc: 'IGNOAPS provides monthly pension to senior citizens aged 60 years and above who belong to households below the poverty line as per government benchmarks.',
    hiFullDesc: 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना के तहत 60 वर्ष या उससे अधिक आयु के BPL परिवारों के वृद्धजनों को प्रतिमाह पेंशन राशि सीधे उनके खातों में प्रदान की जाती है।',
    benefits: [
      '₹500 to ₹1,500 monthly pension (varies by age & state contribution)',
      'Direct monthly deposit into beneficiary Aadhaar-linked bank account'
    ],
    hiBenefits: [
      '₹500 से ₹1,500 मासिक पेंशन (आयु एवं राज्य के अंशदान अनुसार)',
      'आधार-लिंक्ड बैंक खाते में प्रति माह सीधा जमा'
    ],
    documents: [
      'Age Proof (Aadhaar Card / Birth Certificate)',
      'BPL Ration Card',
      'Bank Passbook Copy',
      'Domicile Certificate'
    ],
    hiDocuments: [
      'आयु प्रमाण पत्र (आधार कार्ड / जन्म प्रमाण पत्र)',
      'बीपीएल (BPL) राशन कार्ड',
      'बैंक पासबुक की छायाप्रति',
      'मूल निवास प्रमाण पत्र'
    ]
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat - PM Jan Arogya Yojana (PM-JAY)',
    hiName: 'आयुष्मान भारत - पीएम जन आरोग्य योजना',
    category: 'Healthcare & Insurance',
    hiCategory: 'स्वास्थ्य सेवा एवं बीमा',
    level: 'Central',
    hiLevel: 'केंद्रीय',
    state: 'All States / UTs',
    hiState: 'सभी राज्य / केंद्र शासित प्रदेश',
    shortDesc: 'Health cover of ₹5 Lakh per family per year for secondary and tertiary care hospitalization.',
    hiShortDesc: 'प्रत्येक पात्र परिवार को द्वितीयक और तृतीयक अस्पताल में इलाज के लिए प्रति वर्ष ₹5 लाख का स्वास्थ्य बीमा।',
    fullDesc: 'PM-JAY is the world largest health insurance scheme fully financed by the government. It provides a cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization across public and private empaneled hospitals.',
    hiFullDesc: 'आयुष्मान भारत दुनिया की सबसे बड़ी सरकारी स्वास्थ्य बीमा योजना है। यह देश भर के सूचीबद्ध सरकारी व निजी अस्पतालों में प्रति परिवार ₹5 लाख तक का कैशलेस इलाज प्रदान करती है।',
    benefits: [
      'Cashless & Paperless treatment at empaneled hospitals',
      'Coverage up to ₹5,00,000 per family per year',
      'Pre and post-hospitalization expense coverage'
    ],
    hiBenefits: [
      'सूचीबद्ध अस्पतालों में पूरी तरह कैशलेस और पेपरलेस इलाज',
      'प्रति परिवार प्रति वर्ष ₹5,00,000 तक का मुफ़्त कवरेज',
      'अस्पताल में भर्ती होने से पहले और बाद का खर्च शामिल'
    ],
    documents: [
      'Aadhaar Card',
      'Ration Card / SECC Data Verification',
      'Mobile Number'
    ],
    hiDocuments: [
      'आधार कार्ड',
      'राशन कार्ड / SECC डेटा सूची में नाम',
      'सक्रिय मोबाइल नंबर'
    ]
  },
  {
    id: 'ujjwala-yojana',
    name: 'PM Ujjwala Yojana (PMUY 2.0)',
    hiName: 'प्रधानमंत्री उज्ज्वला योजना (PMUY 2.0)',
    category: 'Energy & Women Empowerment',
    hiCategory: 'ऊर्जा एवं महिला सशक्तिकरण',
    level: 'Central',
    hiLevel: 'केंद्रीय',
    state: 'All States / UTs',
    hiState: 'सभी राज्य / केंद्र शासित प्रदेश',
    shortDesc: 'Deposit-free LPG connection to adult women from poor households across India.',
    hiShortDesc: 'देशभर के गरीब परिवारों की वयस्क महिलाओं को डिपाज़िट-मुक्त एलपीजी (LPG) कनेक्शन।',
    fullDesc: 'PMUY 2.0 aims to provide deposit-free LPG connections to low-income families who could not be covered under the first phase of PMUY.',
    hiFullDesc: 'प्रधानमंत्री उज्ज्वला योजना 2.0 का लक्ष्य आर्थिक रूप से कमजोर परिवारों की महिलाओं को निःशुल्क रसोई गैस कनेक्शन और पहला सिलिंडर व चूल्हा मुफ़्त प्रदान करना है।',
    benefits: [
      'Deposit-free LPG connection (Cylinder + Regulator)',
      'First refill and hotplate (stove) provided free of cost',
      'Targeted subsidy on refill cylinders'
    ],
    hiBenefits: [
      'डिपाज़िट-मुक्त एलपीजी कनेक्शन (सिलिंडर व रेगुलेटर मुफ़्त)',
      'पहला सिलिंडर रिफिल और गैस चूल्हा पूरी तरह मुफ़्त',
      'रिफिल सिलिंडर पर लक्षित सब्सिडी का लाभ'
    ],
    documents: [
      'Aadhaar of Applicant (Adult Woman)',
      'Ration Card / Family Composition Certificate',
      'Bank Account Number & IFSC'
    ],
    hiDocuments: [
      'आवेदक महिला का आधार कार्ड',
      'राशन कार्ड / पारिवारिक सदस्यता प्रमाण पत्र',
      'बैंक खाता संख्या एवं IFSC कोड'
    ]
  }
];
