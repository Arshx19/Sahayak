export const MOCK_GRIEVANCES = [
  {
    id: 'SG-1021',
    subject: 'PM-KISAN Installment Payment Delayed for 8th Cycle',
    hiSubject: 'पीएम-किसान की 8वीं किस्त के भुगतान में देरी',
    scheme: 'PM-KISAN',
    department: 'Department of Agriculture & Farmers Welfare',
    hiDepartment: 'कृषि एवं किसान कल्याण विभाग',
    status: 'IN PROGRESS',
    priority: 'HIGH',
    dateSubmitted: '2026-09-12',
    lastUpdated: '2026-10-02',
    description: 'My 8th installment for PM-KISAN has not been credited to my SBI account despite e-KYC completion on 15th August 2026.',
    hiDescription: '15 अगस्त 2026 को ई-केवाईसी पूर्ण होने के बावजूद मेरी पीएम-किसान की 8वीं किस्त एसबीआई खाते में जमा नहीं हुई है।',
    history: [
      { step: 'Grievance Submitted', hiStep: 'शिकायत दर्ज की गई', date: '12 Sep 2026', desc: 'Registered online via SAHAYAK portal.', hiDesc: 'सहायक पोर्टल के माध्यम से ऑनलाइन दर्ज।', done: true },
      { step: 'Assigned to Department', hiStep: 'विभाग को प्रेषित', date: '15 Sep 2026', desc: 'Forwarded to District Agriculture Officer, Haridwar.', hiDesc: 'जिला कृषि अधिकारी, हरिद्वार को अग्रेषित।', done: true },
      { step: 'Under Verification', hiStep: 'सत्यापन प्रक्रिया जारी', date: '28 Sep 2026', desc: 'Aadhaar DB seed verification in progress with NPCI.', hiDesc: 'एनपीसीआई (NPCI) के साथ आधार डीबी सत्यापन जारी।', done: true },
      { step: 'Resolution & Disbursement', hiStep: 'समाधान एवं राशि जारी', date: 'Expected 10 Oct 2026', desc: 'Approval pending for bank release.', hiDesc: 'बैंक हस्तांतरण की अंतिम स्वीकृति लंबित।', done: false }
    ]
  },
  {
    id: 'SG-1088',
    subject: 'Name Spelling Mismatch in Old Age Pension Application',
    hiSubject: 'वृद्धावस्था पेंशन आवेदन में नाम के नाम की वर्तनी में त्रुटि',
    scheme: 'Old Age Pension',
    department: 'Department of Social Justice & Empowerment',
    hiDepartment: 'सामाजिक न्याय एवं अधिकारिता विभाग',
    status: 'OPEN',
    priority: 'MEDIUM',
    dateSubmitted: '2026-10-01',
    lastUpdated: '2026-10-01',
    description: 'Application rejected due to mismatch in name spelling between Aadhaar and Bank Passbook.',
    hiDescription: 'आधार कार्ड और बैंक पासबुक में नाम के अक्षरों का मिलान न होने के कारण आवेदन अटका हुआ है।',
    history: [
      { step: 'Grievance Submitted', hiStep: 'शिकायत दर्ज हुई', date: '01 Oct 2026', desc: 'Grievance registered and ticket generated.', hiDesc: 'शिकायत दर्ज और टिकट संख्या जारी।', done: true },
      { step: 'Assigned to Department', hiStep: 'अधिकारी आवंटन', date: 'Pending', desc: 'Awaiting officer allocation.', hiDesc: 'अधिकारी आवंटन की प्रतीक्षा है।', done: false }
    ]
  }
];
