// -----------------------------------------------------------------------------
// Government Schemes Dataset for SAHAYAK
// 30 Official Central and State Schemes ingested from Government_Schemes_India_2026_SIMPLIFIED.xlsx
// - Central Government: CEN001 to CEN010 (10 Schemes)
// - Uttar Pradesh: UP001 to UP005 (5 Schemes)
// - Maharashtra: MH001 to MH005 (5 Schemes)
// - Karnataka: KA001 to KA005 (5 Schemes)
// - Odisha: OD001 to OD005 (5 Schemes)
// -----------------------------------------------------------------------------

export const MOCK_SCHEMES = [
  {
    "id": "CEN001",
    "schemeCode": "CEN001",
    "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    "hiName": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
    "category": "Farmer",
    "hiCategory": "किसान एवं कृषि कल्याण",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Direct income support of ₹6,000 per year in three equal installments of ₹2,000 to all landholding farmer families across India.",
    "fullDesc": "Direct income support of ₹6,000 per year in three equal installments of ₹2,000 to all landholding farmer families across India.",
    "benefits": [
      "Direct income support of ₹6,000 per year in three equal installments of ₹2,000 to all landholding farmer families across India."
    ],
    "eligibility": "Landholding farmer families with cultivable agricultural land in their name. Institutional landholders and high-income/tax-paying taxpayers are excluded.",
    "eligibility_criteria": {
      "occupation": "farmer"
    },
    "required_documents": [
      "aadhaar",
      "land_record",
      "bank_account",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "land_record",
      "bank_account",
      "mobile_number"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Register on PM-KISAN portal or CSC centers → Verify Aadhaar and land record (Khatauni) → Submit bank details for DBT linkage.",
    "application_url": "https://pmkisan.gov.in",
    "officialUrl": "https://pmkisan.gov.in"
  },
  {
    "id": "CEN002",
    "schemeCode": "CEN002",
    "name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    "hiName": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY)",
    "category": "Healthcare",
    "hiCategory": "स्वास्थ्य एवं चिकित्सा सेवा",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Cashless health assurance cover of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization in empanelled hospitals.",
    "fullDesc": "Cashless health assurance cover of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization in empanelled hospitals.",
    "benefits": [
      "Cashless health assurance cover of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization in empanelled hospitals."
    ],
    "eligibility": "Families identified as deprived under rural and urban categories of Socio-Economic Caste Census (SECC) 2011 or NFSA ration card holders, and senior citizens aged 70+.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "ration_card",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "ration_card",
      "mobile_number"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Check eligibility on portal or Ayushman App → Visit nearest CSC or empanelled hospital with Aadhaar and Ration Card → Complete e-KYC and download Ayushman Card.",
    "application_url": "https://beneficiary.nha.gov.in",
    "officialUrl": "https://pmjay.gov.in"
  },
  {
    "id": "CEN003",
    "schemeCode": "CEN003",
    "name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
    "hiName": "प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)",
    "category": "Housing",
    "hiCategory": "आवास एवं शेल्टर",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Financial assistance of ₹1.20 lakh (plains) or ₹1.30 lakh (hilly areas) for constructing pucca houses with basic amenities for houseless and kutcha-house rural families.",
    "fullDesc": "Financial assistance of ₹1.20 lakh (plains) or ₹1.30 lakh (hilly areas) for constructing pucca houses with basic amenities for houseless and kutcha-house rural families.",
    "benefits": [
      "Financial assistance of ₹1.20 lakh (plains) or ₹1.30 lakh (hilly areas) for constructing pucca houses with basic amenities for houseless and kutcha-house rural families."
    ],
    "eligibility": "Rural households living in kutcha or dilapidated houses, identified through SECC 2011 / Awaas+ list verified by Gram Sabha.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "bank_account",
      "mgnrega_job_card",
      "land_record",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "bank_account",
      "mgnrega_job_card",
      "land_record",
      "mobile_number"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Gram Panchayat prepares beneficiary priority list → Block Development Office verifies field geo-tagging → Sanction order issued and DBT installments released in stages.",
    "application_url": "https://pmayg.nic.in",
    "officialUrl": "https://pmayg.nic.in"
  },
  {
    "id": "CEN004",
    "schemeCode": "CEN004",
    "name": "Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)",
    "hiName": "प्रधानमंत्री उज्ज्वला योजना 2.0 (PMUY)",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Deposit-free LPG connection with free first refill and hotplate stove provided to adult women from poor and deprived households.",
    "fullDesc": "Deposit-free LPG connection with free first refill and hotplate stove provided to adult women from poor and deprived households.",
    "benefits": [
      "Deposit-free LPG connection with free first refill and hotplate stove provided to adult women from poor and deprived households."
    ],
    "eligibility": "Adult woman (aged 18+) belonging to poor households (SC/ST, PMAY, Antyodaya Anna Yojana, Most Backward Classes, or verified 14-point declaration) having no existing LPG connection in the family.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "ration_card",
      "bank_account",
      "photograph"
    ],
    "documents": [
      "aadhaar",
      "ration_card",
      "bank_account",
      "photograph"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Apply online on PMUY portal or submit application at nearest LPG distributor with Aadhaar and Ration Card → Distributor conducts e-KYC and releases connection.",
    "application_url": "https://www.pmuy.gov.in",
    "officialUrl": "https://www.pmuy.gov.in"
  },
  {
    "id": "CEN005",
    "schemeCode": "CEN005",
    "name": "Atal Pension Yojana (APY)",
    "hiName": "अटल पेंशन योजना (APY)",
    "category": "Social Welfare",
    "hiCategory": "सामाजिक कल्याण एवं सुरक्षा",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Guaranteed minimum monthly pension of ₹1,000 to ₹5,000 to unorganized sector workers after attaining 60 years of age.",
    "fullDesc": "Guaranteed minimum monthly pension of ₹1,000 to ₹5,000 to unorganized sector workers after attaining 60 years of age.",
    "benefits": [
      "Guaranteed minimum monthly pension of ₹1,000 to ₹5,000 to unorganized sector workers after attaining 60 years of age."
    ],
    "eligibility": "Indian citizen aged between 18 and 40 years holding a savings bank account. Applicant must not be an income taxpayer or member of any statutory social security scheme.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "bank_account",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "bank_account",
      "mobile_number"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Visit bank branch or use net banking / mobile app → Fill APY registration form with auto-debit consent → Receive Permanent Retirement Account Number (PRAN).",
    "application_url": "https://enps.nsdl.com",
    "officialUrl": "https://www.npscra.nsdl.co.in"
  },
  {
    "id": "CEN006",
    "schemeCode": "CEN006",
    "name": "Pradhan Mantri Mudra Yojana (PMMY)",
    "hiName": "प्रधानमंत्री मुद्रा योजना (PMMY)",
    "category": "MSME",
    "hiCategory": "उद्योग एवं एमएसएमई",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Collateral-free micro loans up to ₹10 lakh in three categories (Shishu up to ₹50k, Kishore ₹50k-5L, Tarun ₹5L-10L) to non-corporate, non-farm small/micro enterprises.",
    "fullDesc": "Collateral-free micro loans up to ₹10 lakh in three categories (Shishu up to ₹50k, Kishore ₹50k-5L, Tarun ₹5L-10L) to non-corporate, non-farm small/micro enterprises.",
    "benefits": [
      "Collateral-free micro loans up to ₹10 lakh in three categories (Shishu up to ₹50k, Kishore ₹50k-5L, Tarun ₹5L-10L) to non-corporate, non-farm small/micro enterprises."
    ],
    "eligibility": "Any Indian citizen with a business plan for non-farm income-generating activity such as manufacturing, processing, trading, or service sector.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "pan",
      "address_proof",
      "bank_account",
      "photograph",
      "udyam_registration"
    ],
    "documents": [
      "aadhaar",
      "pan",
      "address_proof",
      "bank_account",
      "photograph",
      "udyam_registration"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Apply via Udyamimitra portal or visit commercial/RRB/cooperative bank with project proposal and KYC → Bank verifies and disburses loan without collateral.",
    "application_url": "https://www.udyamimitra.in",
    "officialUrl": "https://www.mudra.org.in"
  },
  {
    "id": "CEN007",
    "schemeCode": "CEN007",
    "name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    "hiName": "पीएम स्ट्रीट वेंडर्स आत्मनिर्भर निधि (पीएम स्वनिधि)",
    "category": "Employment",
    "hiCategory": "रोजगार एवं आजीविका",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Collateral-free working capital micro-credit starting at ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and ₹50,000 (3rd tranche) with 7% interest subsidy for street vendors.",
    "fullDesc": "Collateral-free working capital micro-credit starting at ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and ₹50,000 (3rd tranche) with 7% interest subsidy for street vendors.",
    "benefits": [
      "Collateral-free working capital micro-credit starting at ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and ₹50,000 (3rd tranche) with 7% interest subsidy for street vendors."
    ],
    "eligibility": "Urban street vendors vending on or before March 24, 2020 holding a Certificate of Vending / Identity Card issued by Urban Local Body, or Letter of Recommendation.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "vending_certificate",
      "bank_account",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "vending_certificate",
      "bank_account",
      "mobile_number"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Register on PM SVANidhi portal or through ULB/banking correspondent → Upload vending proof and KYC → Bank disburses loan to account.",
    "application_url": "https://pmsvanidhi.mohua.gov.in",
    "officialUrl": "https://pmsvanidhi.mohua.gov.in"
  },
  {
    "id": "CEN008",
    "schemeCode": "CEN008",
    "name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
    "hiName": "प्रधानमंत्री मातृ वंदना योजना (PMMVY)",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Cash incentive of ₹5,000 in two installments for the first live child and ₹6,000 for the second girl child to pregnant and lactating mothers for health and nutrition.",
    "fullDesc": "Cash incentive of ₹5,000 in two installments for the first live child and ₹6,000 for the second girl child to pregnant and lactating mothers for health and nutrition.",
    "benefits": [
      "Cash incentive of ₹5,000 in two installments for the first live child and ₹6,000 for the second girl child to pregnant and lactating mothers for health and nutrition."
    ],
    "eligibility": "Pregnant women and lactating mothers aged 19+ belonging to socially/economically disadvantaged categories (BPL, SC/ST, EWS income < ₹8L, PMMY/e-Shram holders) excluding regular government employees.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "mcp_card",
      "bank_account",
      "income_certificate"
    ],
    "documents": [
      "aadhaar",
      "mcp_card",
      "bank_account",
      "income_certificate"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Register at nearest Anganwadi Centre or on PMMVY portal within pregnancy registration period → Submit MCP card and bank details → DBT disbursed directly.",
    "application_url": "https://pmmvy.wcd.gov.in",
    "officialUrl": "https://wcd.nic.in"
  },
  {
    "id": "CEN009",
    "schemeCode": "CEN009",
    "name": "Mahatma Gandhi National Rural Employment Guarantee Scheme (MGNREGS)",
    "hiName": "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी योजना (मनरेगा)",
    "category": "Employment",
    "hiCategory": "रोजगार एवं आजीविका",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "Statutory guarantee of at least 100 days of unskilled wage employment per financial year to rural adult household members willing to do manual work.",
    "fullDesc": "Statutory guarantee of at least 100 days of unskilled wage employment per financial year to rural adult household members willing to do manual work.",
    "benefits": [
      "Statutory guarantee of at least 100 days of unskilled wage employment per financial year to rural adult household members willing to do manual work."
    ],
    "eligibility": "Adult members (aged 18+) of rural households residing in the notified Gram Panchayat area who volunteer for unskilled manual labour.",
    "eligibility_criteria": {},
    "required_documents": [
      "aadhaar",
      "photograph",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "photograph",
      "bank_account"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Submit application to Gram Panchayat → Receive Job Card within 15 days → Submit written work demand → Work allocated within 15 days.",
    "application_url": "https://nrega.nic.in",
    "officialUrl": "https://nrega.nic.in"
  },
  {
    "id": "CEN010",
    "schemeCode": "CEN010",
    "name": "Sukanya Samriddhi Yojana (SSY)",
    "hiName": "सुकन्या समृद्धि योजना (SSY)",
    "category": "Financial Assistance",
    "hiCategory": "वित्तीय समावेशन एवं पेंशन",
    "provider": "Central",
    "level": "Central",
    "provided_by": "Central",
    "state": "All India",
    "applicable_states": [
      "ALL"
    ],
    "applicableStates": [
      "ALL"
    ],
    "shortDesc": "High-interest government small savings scheme for a girl child with tax exemption under Section 80C and sovereign guarantee for higher education and marriage.",
    "fullDesc": "High-interest government small savings scheme for a girl child with tax exemption under Section 80C and sovereign guarantee for higher education and marriage.",
    "benefits": [
      "High-interest government small savings scheme for a girl child with tax exemption under Section 80C and sovereign guarantee for higher education and marriage."
    ],
    "eligibility": "Girl child who is an Indian resident aged below 10 years at account opening. A maximum of two accounts allowed per family (or three in case of twins/triplets).",
    "eligibility_criteria": {},
    "required_documents": [
      "birth_certificate",
      "aadhaar",
      "address_proof",
      "photograph"
    ],
    "documents": [
      "birth_certificate",
      "aadhaar",
      "address_proof",
      "photograph"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Fill account opening form at authorized post office or commercial bank branch → Attach child birth certificate and parent KYC → Deposit minimum initial amount of ₹250.",
    "application_url": "https://www.indiapost.gov.in",
    "officialUrl": "https://www.nsiindia.gov.in"
  },
  {
    "id": "UP001",
    "schemeCode": "UP001",
    "name": "Mukhyamantri Yuva Swarojgar Yojana (MMYSY)",
    "hiName": "मुख्यमंत्री युवा स्वरोजगार योजना (MMYSY)",
    "category": "Employment",
    "hiCategory": "रोजगार एवं आजीविका",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Uttar Pradesh",
    "applicable_states": [
      "Uttar Pradesh"
    ],
    "applicableStates": [
      "Uttar Pradesh"
    ],
    "shortDesc": "Financial assistance with 25% margin money subsidy for unemployed youth to set up industrial projects (up to ₹25 lakh) or service sector units (up to ₹10 lakh).",
    "fullDesc": "Financial assistance with 25% margin money subsidy for unemployed youth to set up industrial projects (up to ₹25 lakh) or service sector units (up to ₹10 lakh).",
    "benefits": [
      "Financial assistance with 25% margin money subsidy for unemployed youth to set up industrial projects (up to ₹25 lakh) or service sector units (up to ₹10 lakh)."
    ],
    "eligibility": "Resident of Uttar Pradesh aged 18 to 40 years with minimum Class 10 qualification. Must be unemployed and not a defaulter in any bank.",
    "eligibility_criteria": {
      "required_state": "Uttar Pradesh"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "educational_certificate",
      "project_report",
      "bank_account",
      "photograph"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "educational_certificate",
      "project_report",
      "bank_account",
      "photograph"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Apply online on UP DIUP portal → District Level Task Force Committee (DLTFC) screens application → Forwarded to bank for loan and margin subsidy release.",
    "application_url": "https://diupmsme.upsdc.gov.in",
    "officialUrl": "https://diupmsme.upsdc.gov.in"
  },
  {
    "id": "UP002",
    "schemeCode": "UP002",
    "name": "Mukhyamantri Kanya Sumangala Yojana",
    "hiName": "मुख्यमंत्री कन्या सुमंगला योजना",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Uttar Pradesh",
    "applicable_states": [
      "Uttar Pradesh"
    ],
    "applicableStates": [
      "Uttar Pradesh"
    ],
    "shortDesc": "Conditional cash transfer of ₹25,000 in six milestones from birth to degree/diploma admission to promote girl child education and curb female foeticide.",
    "fullDesc": "Conditional cash transfer of ₹25,000 in six milestones from birth to degree/diploma admission to promote girl child education and curb female foeticide.",
    "benefits": [
      "Conditional cash transfer of ₹25,000 in six milestones from birth to degree/diploma admission to promote girl child education and curb female foeticide."
    ],
    "eligibility": "Permanent resident of Uttar Pradesh with annual family income not exceeding ₹3 lakh. Maximum two girl children per family eligible.",
    "eligibility_criteria": {
      "required_state": "Uttar Pradesh"
    },
    "required_documents": [
      "aadhaar",
      "birth_certificate",
      "domicile_certificate",
      "income_certificate",
      "bank_account",
      "photograph"
    ],
    "documents": [
      "aadhaar",
      "birth_certificate",
      "domicile_certificate",
      "income_certificate",
      "bank_account",
      "photograph"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Register girl child on MKSY portal → Select applicable milestone stage and upload supporting certificates → BDO/SDO verification → Direct DBT transfer.",
    "application_url": "https://mksy.up.gov.in",
    "officialUrl": "https://mksy.up.gov.in"
  },
  {
    "id": "UP003",
    "schemeCode": "UP003",
    "name": "One District One Product (ODOP) Margin Money Scheme",
    "hiName": "एक जनपद एक उत्पाद (ODOP) योजना",
    "category": "MSME",
    "hiCategory": "उद्योग एवं एमएसएमई",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Uttar Pradesh",
    "applicable_states": [
      "Uttar Pradesh"
    ],
    "applicableStates": [
      "Uttar Pradesh"
    ],
    "shortDesc": "Subsidized margin money support (up to ₹20 lakh) for artisans, craftspersons, and entrepreneurs establishing enterprises under district-notified ODOP products.",
    "fullDesc": "Subsidized margin money support (up to ₹20 lakh) for artisans, craftspersons, and entrepreneurs establishing enterprises under district-notified ODOP products.",
    "benefits": [
      "Subsidized margin money support (up to ₹20 lakh) for artisans, craftspersons, and entrepreneurs establishing enterprises under district-notified ODOP products."
    ],
    "eligibility": "Resident of Uttar Pradesh aged 18+ engaged or planning to engage in the notified ODOP craft/product of their district.",
    "eligibility_criteria": {
      "required_state": "Uttar Pradesh"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "project_report",
      "bank_account",
      "photograph",
      "caste_certificate"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "project_report",
      "bank_account",
      "photograph",
      "caste_certificate"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Apply through DIUP portal under ODOP scheme → Interview by district committee → Sanctioned by bank → Margin money disbursed by DIC.",
    "application_url": "https://diupmsme.upsdc.gov.in",
    "officialUrl": "https://odopup.in"
  },
  {
    "id": "UP004",
    "schemeCode": "UP004",
    "name": "UP Mukhyamantri Abhyudaya Yojana",
    "hiName": "मुख्यमंत्री अभ्युदय योजना",
    "category": "Education",
    "hiCategory": "शिक्षा एवं कौशल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Uttar Pradesh",
    "applicable_states": [
      "Uttar Pradesh"
    ],
    "applicableStates": [
      "Uttar Pradesh"
    ],
    "shortDesc": "Free competitive examination coaching (UPSC, UPPSC, JEE, NEET, NDA, CDS) provided through divisional centers and virtual classes by senior officers and subject experts.",
    "fullDesc": "Free competitive examination coaching (UPSC, UPPSC, JEE, NEET, NDA, CDS) provided through divisional centers and virtual classes by senior officers and subject experts.",
    "benefits": [
      "Free competitive examination coaching (UPSC, UPPSC, JEE, NEET, NDA, CDS) provided through divisional centers and virtual classes by senior officers and subject experts."
    ],
    "eligibility": "Domicile of Uttar Pradesh preparing for competitive exams, belonging to financially weaker or middle-income backgrounds.",
    "eligibility_criteria": {
      "required_state": "Uttar Pradesh"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "educational_certificate",
      "photograph"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "educational_certificate",
      "photograph"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Register on Abhyudaya portal → Select course and divisional center → Appear for eligibility entrance test → Selected candidates join classes.",
    "application_url": "https://abhyuday.up.gov.in",
    "officialUrl": "https://abhyuday.up.gov.in"
  },
  {
    "id": "UP005",
    "schemeCode": "UP005",
    "name": "Mukhyamantri Krishak Durghatna Kalyan Yojana",
    "hiName": "मुख्यमंत्री कृषक दुर्घटना कल्याण योजना",
    "category": "Farmer",
    "hiCategory": "किसान एवं कृषि कल्याण",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Uttar Pradesh",
    "applicable_states": [
      "Uttar Pradesh"
    ],
    "applicableStates": [
      "Uttar Pradesh"
    ],
    "shortDesc": "Accident insurance compensation of up to ₹5 lakh in case of accidental death or permanent disability of farmers while working in fields.",
    "fullDesc": "Accident insurance compensation of up to ₹5 lakh in case of accidental death or permanent disability of farmers while working in fields.",
    "benefits": [
      "Accident insurance compensation of up to ₹5 lakh in case of accidental death or permanent disability of farmers while working in fields."
    ],
    "eligibility": "Account holder / co-tenure holder farmer or agricultural labourer of Uttar Pradesh aged 18 to 70 years.",
    "eligibility_criteria": {
      "occupation": "farmer",
      "required_state": "Uttar Pradesh"
    },
    "required_documents": [
      "aadhaar",
      "land_record",
      "death_or_disability_certificate",
      "post_mortem_report",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "land_record",
      "death_or_disability_certificate",
      "post_mortem_report",
      "bank_account"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Submit claim within 45 days of accident to concerned Tehsil / SDM office → Verification by revenue officials → Sanction and DBT payment by District Magistrate.",
    "application_url": "https://edistrict.up.gov.in",
    "officialUrl": "https://up.gov.in"
  },
  {
    "id": "MH001",
    "schemeCode": "MH001",
    "name": "Mukhyamantri Majhi Ladki Bahin Yojana",
    "hiName": "मुख्यमंत्री माझी लाडकी बहीण योजना",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Maharashtra",
    "applicable_states": [
      "Maharashtra"
    ],
    "applicableStates": [
      "Maharashtra"
    ],
    "shortDesc": "Monthly direct financial assistance of ₹1,500 transferred to women to promote economic independence, nutrition, and health.",
    "fullDesc": "Monthly direct financial assistance of ₹1,500 transferred to women to promote economic independence, nutrition, and health.",
    "benefits": [
      "Monthly direct financial assistance of ₹1,500 transferred to women to promote economic independence, nutrition, and health."
    ],
    "eligibility": "Resident woman of Maharashtra aged between 21 and 65 years with annual family income up to ₹2.5 lakh. Excludes income taxpayers and government pensioners.",
    "eligibility_criteria": {
      "required_state": "Maharashtra"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "ration_card",
      "income_certificate",
      "bank_account",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "ration_card",
      "income_certificate",
      "bank_account",
      "mobile_number"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Apply online via Nari Shakti Doot App / portal or Anganwadi / Setu Suvidha Kendra → Upload Aadhaar, Ration Card, and bank details → Direct monthly DBT credited.",
    "application_url": "https://ladakibahin.maharashtra.gov.in",
    "officialUrl": "https://maharashtra.gov.in"
  },
  {
    "id": "MH002",
    "schemeCode": "MH002",
    "name": "Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)",
    "hiName": "महात्मा ज्योतिराव फुले जन आरोग्य योजना (MJPJAY)",
    "category": "Healthcare",
    "hiCategory": "स्वास्थ्य एवं चिकित्सा सेवा",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Maharashtra",
    "applicable_states": [
      "Maharashtra"
    ],
    "applicableStates": [
      "Maharashtra"
    ],
    "shortDesc": "Cashless health insurance coverage of up to ₹5 lakh per family per year for secondary and tertiary medical treatments across empanelled hospitals in Maharashtra.",
    "fullDesc": "Cashless health insurance coverage of up to ₹5 lakh per family per year for secondary and tertiary medical treatments across empanelled hospitals in Maharashtra.",
    "benefits": [
      "Cashless health insurance coverage of up to ₹5 lakh per family per year for secondary and tertiary medical treatments across empanelled hospitals in Maharashtra."
    ],
    "eligibility": "All families holding valid ration cards (Yellow, Orange, White) or domicile of Maharashtra holding valid state family identity proof.",
    "eligibility_criteria": {
      "required_state": "Maharashtra"
    },
    "required_documents": [
      "aadhaar",
      "ration_card",
      "domicile_certificate"
    ],
    "documents": [
      "aadhaar",
      "ration_card",
      "domicile_certificate"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Visit Arogyamitra desk at any empanelled network hospital with Aadhaar and Ration Card → Pre-authorization generated → Cashless treatment provided.",
    "application_url": "https://www.jeevandayee.gov.in",
    "officialUrl": "https://www.jeevandayee.gov.in"
  },
  {
    "id": "MH003",
    "schemeCode": "MH003",
    "name": "Mukhyamantri Saur Krushi Vahini Yojana (MSKVY 2.0)",
    "hiName": "मुख्यमंत्री सौर कृषी वाहिनी योजना (MSKVY 2.0)",
    "category": "Farmer",
    "hiCategory": "किसान एवं कृषि कल्याण",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Maharashtra",
    "applicable_states": [
      "Maharashtra"
    ],
    "applicableStates": [
      "Maharashtra"
    ],
    "shortDesc": "Daytime solar power supply for agricultural pumps by leasing farmer land for solar power generation with guaranteed lease rent of ₹1.25 lakh/acre/year.",
    "fullDesc": "Daytime solar power supply for agricultural pumps by leasing farmer land for solar power generation with guaranteed lease rent of ₹1.25 lakh/acre/year.",
    "benefits": [
      "Daytime solar power supply for agricultural pumps by leasing farmer land for solar power generation with guaranteed lease rent of ₹1.25 lakh/acre/year."
    ],
    "eligibility": "Farmers / landholders in Maharashtra owning land within a 5 km radius of agricultural sub-stations suitable for solar power projects.",
    "eligibility_criteria": {
      "occupation": "farmer",
      "required_state": "Maharashtra"
    },
    "required_documents": [
      "aadhaar",
      "land_record",
      "bank_account",
      "pan"
    ],
    "documents": [
      "aadhaar",
      "land_record",
      "bank_account",
      "pan"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Land registration on MSEB solar portal → Land inspection by Mahavitaran team → Execution of 30-year lease agreement and annual lease payout.",
    "application_url": "https://www.mahadiscom.in/solar-mskvy",
    "officialUrl": "https://www.mahadiscom.in"
  },
  {
    "id": "MH004",
    "schemeCode": "MH004",
    "name": "Mukhyamantri Vayoshri Yojana",
    "hiName": "मुख्यमंत्री वयोश्री योजना",
    "category": "Social Welfare",
    "hiCategory": "सामाजिक कल्याण एवं सुरक्षा",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Maharashtra",
    "applicable_states": [
      "Maharashtra"
    ],
    "applicableStates": [
      "Maharashtra"
    ],
    "shortDesc": "One-time financial assistance of ₹3,000 for senior citizens to purchase daily living assistive devices and physical support equipment.",
    "fullDesc": "One-time financial assistance of ₹3,000 for senior citizens to purchase daily living assistive devices and physical support equipment.",
    "benefits": [
      "One-time financial assistance of ₹3,000 for senior citizens to purchase daily living assistive devices and physical support equipment."
    ],
    "eligibility": "Senior citizens residing in Maharashtra aged 65 years and above with annual family income not exceeding ₹2 lakh.",
    "eligibility_criteria": {
      "required_state": "Maharashtra"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "age_proof",
      "income_certificate",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "age_proof",
      "income_certificate",
      "bank_account"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Apply through Social Justice Department portal or District Social Welfare Office → Verification of age and income → Amount disbursed to Aadhaar-linked bank account.",
    "application_url": "https://sjsa.maharashtra.gov.in",
    "officialUrl": "https://sjsa.maharashtra.gov.in"
  },
  {
    "id": "MH005",
    "schemeCode": "MH005",
    "name": "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna",
    "hiName": "राजर्षि छत्रपती शाहू महाराज शिक्षण शुल्क शिष्यवृत्ती योजना",
    "category": "Education",
    "hiCategory": "शिक्षा एवं कौशल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Maharashtra",
    "applicable_states": [
      "Maharashtra"
    ],
    "applicableStates": [
      "Maharashtra"
    ],
    "shortDesc": "50% tuition and examination fee reimbursement scholarship for higher and professional education students from economically weaker sections.",
    "fullDesc": "50% tuition and examination fee reimbursement scholarship for higher and professional education students from economically weaker sections.",
    "benefits": [
      "50% tuition and examination fee reimbursement scholarship for higher and professional education students from economically weaker sections."
    ],
    "eligibility": "Domicile of Maharashtra pursuing approved diploma/degree/postgraduate course with annual family income up to ₹8 lakh. Candidate must have taken admission through CAP.",
    "eligibility_criteria": {
      "required_state": "Maharashtra"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "income_certificate",
      "cap_allotment_letter",
      "educational_certificate",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "income_certificate",
      "cap_allotment_letter",
      "educational_certificate",
      "bank_account"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Register on MahaDBT portal → Apply under Directorate of Higher/Technical Education → College scrutiny → Department approval and DBT fee reimbursement.",
    "application_url": "https://mahadbt.maharashtra.gov.in",
    "officialUrl": "https://mahadbt.maharashtra.gov.in"
  },
  {
    "id": "KA001",
    "schemeCode": "KA001",
    "name": "Gruha Lakshmi Scheme",
    "hiName": "गृह लक्ष्मी योजना",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Karnataka",
    "applicable_states": [
      "Karnataka"
    ],
    "applicableStates": [
      "Karnataka"
    ],
    "shortDesc": "Direct financial aid of ₹2,000 per month provided to the female head of eligible households to cushion rising living costs.",
    "fullDesc": "Direct financial aid of ₹2,000 per month provided to the female head of eligible households to cushion rising living costs.",
    "benefits": [
      "Direct financial aid of ₹2,000 per month provided to the female head of eligible households to cushion rising living costs."
    ],
    "eligibility": "Female head of the family named on Antyodaya, BPL, or APL ration card issued by Karnataka Government. Woman and husband must not be income tax or GST payees.",
    "eligibility_criteria": {
      "required_state": "Karnataka"
    },
    "required_documents": [
      "aadhaar",
      "ration_card",
      "bank_account",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "ration_card",
      "bank_account",
      "mobile_number"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Register via Seva Sindhu portal or visit Grama One / Karnataka One / Bangalore One centers → Provide Aadhaar and Ration Card → Biometric verification and monthly DBT activation.",
    "application_url": "https://sevasindhu.karnataka.gov.in",
    "officialUrl": "https://karnataka.gov.in"
  },
  {
    "id": "KA002",
    "schemeCode": "KA002",
    "name": "Gruha Jyothi Scheme",
    "hiName": "गृह ज्योति योजना",
    "category": "Social Welfare",
    "hiCategory": "सामाजिक कल्याण एवं सुरक्षा",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Karnataka",
    "applicable_states": [
      "Karnataka"
    ],
    "applicableStates": [
      "Karnataka"
    ],
    "shortDesc": "Free electricity up to 200 units per month for domestic consumers in Karnataka based on their average annual monthly consumption pattern.",
    "fullDesc": "Free electricity up to 200 units per month for domestic consumers in Karnataka based on their average annual monthly consumption pattern.",
    "benefits": [
      "Free electricity up to 200 units per month for domestic consumers in Karnataka based on their average annual monthly consumption pattern."
    ],
    "eligibility": "Domestic residential electricity connection holders in Karnataka (owners and tenants). Average monthly consumption must be below 200 units. Commercial usage excluded.",
    "eligibility_criteria": {
      "required_state": "Karnataka"
    },
    "required_documents": [
      "aadhaar",
      "electricity_bill_id",
      "rental_agreement"
    ],
    "documents": [
      "aadhaar",
      "electricity_bill_id",
      "rental_agreement"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Link electricity Consumer ID with Aadhaar on Seva Sindhu portal → ESCOM verifies consumption benchmark → Zero-bill benefit reflected on qualifying monthly bills.",
    "application_url": "https://sevasindhugs.karnataka.gov.in",
    "officialUrl": "https://energy.karnataka.gov.in"
  },
  {
    "id": "KA003",
    "schemeCode": "KA003",
    "name": "Yuva Nidhi Scheme",
    "hiName": "युवा निधि योजना",
    "category": "Employment",
    "hiCategory": "रोजगार एवं आजीविका",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Karnataka",
    "applicable_states": [
      "Karnataka"
    ],
    "applicableStates": [
      "Karnataka"
    ],
    "shortDesc": "Unemployment stipend of ₹3,00,0 per month for degree holders and ₹1,500 per month for diploma holders for up to 2 years while looking for employment.",
    "fullDesc": "Unemployment stipend of ₹3,00,0 per month for degree holders and ₹1,500 per month for diploma holders for up to 2 years while looking for employment.",
    "benefits": [
      "Unemployment stipend of ₹3,00,0 per month for degree holders and ₹1,500 per month for diploma holders for up to 2 years while looking for employment."
    ],
    "eligibility": "Graduates and diploma holders domiciled in Karnataka who passed out in recent academic cycles and remained unemployed for at least 6 months after graduation.",
    "eligibility_criteria": {
      "required_state": "Karnataka"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "degree_or_diploma_certificate",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "degree_or_diploma_certificate",
      "bank_account"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Submit application on Seva Sindhu portal → Self-declare unemployment status monthly on the portal → DBT allowance credited to bank account.",
    "application_url": "https://sevasindhu.karnataka.gov.in",
    "officialUrl": "https://skill.karnataka.gov.in"
  },
  {
    "id": "KA004",
    "schemeCode": "KA004",
    "name": "Anna Bhagya Scheme (Cash in lieu of Foodgrains)",
    "hiName": "अन्न भाग्य योजना",
    "category": "Financial Assistance",
    "hiCategory": "वित्तीय समावेशन एवं पेंशन",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Karnataka",
    "applicable_states": [
      "Karnataka"
    ],
    "applicableStates": [
      "Karnataka"
    ],
    "shortDesc": "Monthly cash transfer of ₹170 per person (at ₹34/kg for 5 kg additional rice) directly to BPL cardholders' accounts in lieu of additional foodgrains.",
    "fullDesc": "Monthly cash transfer of ₹170 per person (at ₹34/kg for 5 kg additional rice) directly to BPL cardholders' accounts in lieu of additional foodgrains.",
    "benefits": [
      "Monthly cash transfer of ₹170 per person (at ₹34/kg for 5 kg additional rice) directly to BPL cardholders' accounts in lieu of additional foodgrains."
    ],
    "eligibility": "Members of Antyodaya Anna Yojana (AAY) and Priority Household (PHH/BPL) ration cards issued by Karnataka Food and Civil Supplies Department.",
    "eligibility_criteria": {
      "required_state": "Karnataka"
    },
    "required_documents": [
      "aadhaar",
      "ration_card",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "ration_card",
      "bank_account"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Automatic DBT based on active Aadhaar-seeded BPL ration cards; cardholders verify seeding on the Ahara portal.",
    "application_url": "https://ahara.kar.nic.in",
    "officialUrl": "https://ahara.kar.nic.in"
  },
  {
    "id": "KA005",
    "schemeCode": "KA005",
    "name": "Shakti Scheme",
    "hiName": "शक्ति योजना",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Karnataka",
    "applicable_states": [
      "Karnataka"
    ],
    "applicableStates": [
      "Karnataka"
    ],
    "shortDesc": "Free public bus travel for women and transgender citizens across Karnataka in state-run road transport corporations (KSRTC, BMTC, NWKRTC, KKRTC).",
    "fullDesc": "Free public bus travel for women and transgender citizens across Karnataka in state-run road transport corporations (KSRTC, BMTC, NWKRTC, KKRTC).",
    "benefits": [
      "Free public bus travel for women and transgender citizens across Karnataka in state-run road transport corporations (KSRTC, BMTC, NWKRTC, KKRTC)."
    ],
    "eligibility": "All women and transgender residents of Karnataka travelling in non-premium ordinary city, suburban, and express bus services within the state.",
    "eligibility_criteria": {
      "required_state": "Karnataka"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Show valid Karnataka government-issued residential photo ID proof to bus conductor while travelling to receive a zero-fare ticket.",
    "application_url": "https://transport.karnataka.gov.in",
    "officialUrl": "https://transport.karnataka.gov.in"
  },
  {
    "id": "OD001",
    "schemeCode": "OD001",
    "name": "Subhadra Yojana",
    "hiName": "सुभद्रा योजना",
    "category": "Women",
    "hiCategory": "महिला एवं बाल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Odisha",
    "applicable_states": [
      "Odisha"
    ],
    "applicableStates": [
      "Odisha"
    ],
    "shortDesc": "Financial empowerment assistance of ₹10,000 per year (₹50,000 over 5 years in two ₹5,000 tranches) transferred directly to eligible women.",
    "fullDesc": "Financial empowerment assistance of ₹10,000 per year (₹50,000 over 5 years in two ₹5,000 tranches) transferred directly to eligible women.",
    "benefits": [
      "Financial empowerment assistance of ₹10,000 per year (₹50,000 over 5 years in two ₹5,000 tranches) transferred directly to eligible women."
    ],
    "eligibility": "Resident woman of Odisha aged 21 to 59 years from economically disadvantaged households holding NFSA/SFSS ration card or meeting family income limits. Income taxpayers excluded.",
    "eligibility_criteria": {
      "required_state": "Odisha"
    },
    "required_documents": [
      "aadhaar",
      "ration_card",
      "bank_account",
      "mobile_number"
    ],
    "documents": [
      "aadhaar",
      "ration_card",
      "bank_account",
      "mobile_number"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Submit physical form at Mo Seva Kendra / Anganwadi or apply on Subhadra portal → e-KYC validation → DBT credited on Rakhi Purnima and International Women's Day.",
    "application_url": "https://subhadra.odisha.gov.in",
    "officialUrl": "https://subhadra.odisha.gov.in"
  },
  {
    "id": "OD002",
    "schemeCode": "OD002",
    "name": "KALIA Scheme (Krushak Assistance for Livelihood and Income Augmentation)",
    "hiName": "कालिया योजना (KALIA)",
    "category": "Farmer",
    "hiCategory": "किसान एवं कृषि कल्याण",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Odisha",
    "applicable_states": [
      "Odisha"
    ],
    "applicableStates": [
      "Odisha"
    ],
    "shortDesc": "Financial assistance of ₹4,000 per year in two installments for small and marginal farmers and ₹12,500 livelihood package for landless agricultural labourers.",
    "fullDesc": "Financial assistance of ₹4,000 per year in two installments for small and marginal farmers and ₹12,500 livelihood package for landless agricultural labourers.",
    "benefits": [
      "Financial assistance of ₹4,000 per year in two installments for small and marginal farmers and ₹12,500 livelihood package for landless agricultural labourers."
    ],
    "eligibility": "Small and marginal farmers or landless agricultural households residing in Odisha. Large farmers and public sector employees are excluded.",
    "eligibility_criteria": {
      "occupation": "farmer",
      "required_state": "Odisha"
    },
    "required_documents": [
      "aadhaar",
      "land_record",
      "bank_account",
      "ration_card"
    ],
    "documents": [
      "aadhaar",
      "land_record",
      "bank_account",
      "ration_card"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Apply online at KALIA portal or register at PACS / GP office with Aadhaar and RoR → Ground verification → DBT payment directly into Aadhaar-linked account.",
    "application_url": "https://kalia.odisha.gov.in",
    "officialUrl": "https://kalia.odisha.gov.in"
  },
  {
    "id": "OD003",
    "schemeCode": "OD003",
    "name": "Gopabandhu Jan Arogya Yojana (GJAY)",
    "hiName": "गोपबंधु जन आरोग्य योजना (GJAY)",
    "category": "Healthcare",
    "hiCategory": "स्वास्थ्य एवं चिकित्सा सेवा",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Odisha",
    "applicable_states": [
      "Odisha"
    ],
    "applicableStates": [
      "Odisha"
    ],
    "shortDesc": "Cashless secondary and tertiary healthcare treatment up to ₹5 lakh per family (₹10 lakh for female family members) per year in empanelled hospitals.",
    "fullDesc": "Cashless secondary and tertiary healthcare treatment up to ₹5 lakh per family (₹10 lakh for female family members) per year in empanelled hospitals.",
    "benefits": [
      "Cashless secondary and tertiary healthcare treatment up to ₹5 lakh per family (₹10 lakh for female family members) per year in empanelled hospitals."
    ],
    "eligibility": "All families enrolled under National Food Security Act (NFSA) and State Food Security Scheme (SFSS) residing in Odisha.",
    "eligibility_criteria": {
      "required_state": "Odisha"
    },
    "required_documents": [
      "aadhaar",
      "ration_card"
    ],
    "documents": [
      "aadhaar",
      "ration_card"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Present BSKY / GJAY Nabin Card or Ration Card with Aadhaar at the Swasthya Mitra counter in empanelled hospital for cashless treatment authorization.",
    "application_url": "https://bsky.odisha.gov.in",
    "officialUrl": "https://health.odisha.gov.in"
  },
  {
    "id": "OD004",
    "schemeCode": "OD004",
    "name": "Madhu Babu Pension Yojana (MBPY)",
    "hiName": "मधु बाबू पेंशन योजना (MBPY)",
    "category": "Social Welfare",
    "hiCategory": "सामाजिक कल्याण एवं सुरक्षा",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Odisha",
    "applicable_states": [
      "Odisha"
    ],
    "applicableStates": [
      "Odisha"
    ],
    "shortDesc": "Social security monthly pension of ₹1,000 to ₹1,200 for destitute elderly, widows, persons with disabilities, and destitute persons living in Odisha.",
    "fullDesc": "Social security monthly pension of ₹1,000 to ₹1,200 for destitute elderly, widows, persons with disabilities, and destitute persons living in Odisha.",
    "benefits": [
      "Social security monthly pension of ₹1,000 to ₹1,200 for destitute elderly, widows, persons with disabilities, and destitute persons living in Odisha."
    ],
    "eligibility": "Permanent resident of Odisha aged 60+ (or widow / differently-abled / destitute) with annual family income less than ₹24,000, not receiving other pensions.",
    "eligibility_criteria": {
      "required_state": "Odisha"
    },
    "required_documents": [
      "aadhaar",
      "domicile_certificate",
      "age_proof",
      "income_certificate",
      "disability_certificate",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "domicile_certificate",
      "age_proof",
      "income_certificate",
      "disability_certificate",
      "bank_account"
    ],
    "timeline": "Open All Year Round (Continuous Enrollment)",
    "timelineStatus": "OPEN",
    "application_status": "Continuous",
    "application_process": "Apply online on SSEPD portal or submit form to Block Development Officer / Executive Officer → BDO inquiry and verification → Sanctioned and paid via DBT or cash on Jana Seva Day.",
    "application_url": "https://ssepd.odisha.gov.in",
    "officialUrl": "https://ssepd.odisha.gov.in"
  },
  {
    "id": "OD005",
    "schemeCode": "OD005",
    "name": "Biju Yuva Sashaktikaran Yojana (Free Laptop Distribution)",
    "hiName": "बीजू युवा सशक्तिकरण योजना (लैपटॉप वितरण)",
    "category": "Education",
    "hiCategory": "शिक्षा एवं कौशल विकास",
    "provider": "State",
    "level": "State",
    "provided_by": "State",
    "state": "Odisha",
    "applicable_states": [
      "Odisha"
    ],
    "applicableStates": [
      "Odisha"
    ],
    "shortDesc": "Free laptop or direct financial DBT of ₹30,000 provided to meritorious Class 12 students in Odisha to facilitate higher technical and college education.",
    "fullDesc": "Free laptop or direct financial DBT of ₹30,000 provided to meritorious Class 12 students in Odisha to facilitate higher technical and college education.",
    "benefits": [
      "Free laptop or direct financial DBT of ₹30,000 provided to meritorious Class 12 students in Odisha to facilitate higher technical and college education."
    ],
    "eligibility": "Permanent resident student of Odisha who secured top merit ranks in Higher Secondary (+2) examination conducted by CHSE Odisha across Arts, Science, Commerce, and Vocational streams.",
    "eligibility_criteria": {
      "required_state": "Odisha"
    },
    "required_documents": [
      "aadhaar",
      "class_12_marksheet",
      "domicile_certificate",
      "bank_account"
    ],
    "documents": [
      "aadhaar",
      "class_12_marksheet",
      "domicile_certificate",
      "bank_account"
    ],
    "timeline": "Open",
    "timelineStatus": "OPEN",
    "application_status": "Open",
    "application_process": "Higher Education Department publishes merit list on SAMS Odisha portal → Eligible students verify bank account details on portal → Direct DBT / laptop distribution via nodal colleges.",
    "application_url": "https://dhe.odisha.gov.in",
    "officialUrl": "https://dhe.odisha.gov.in"
  }
];
