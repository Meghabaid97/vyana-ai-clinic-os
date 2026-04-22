import { useEffect, useState } from "react";
import type { Language } from "./i18n";
import { getLanguage } from "./i18n";

// Comprehensive landing-page translations across 5 Indian languages.
// Keep keys flat under `landing.*` so components can stay simple.
const landingTranslations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.story": "Story",
    "nav.research": "Research",
    "nav.how": "How it works",
    "nav.contact": "Contact",
    "nav.try": "Try Vyana now",

    // Hero
    "hero.eyebrow": "Your health story, always with you",
    "hero.h1.l1": "Never explain your medical",
    "hero.h1.l2": "history",
    "hero.h1.l3": "",
    "hero.h1.again": "again.",
    "hero.sub":
      "Upload your reports. Get a doctor-ready summary in 30 seconds. Conditions, medications, recent changes, one screen any doctor can read instantly.",
    "hero.cta.primary": "Upload your first record",
    "hero.cta.secondary": "See a sample brief",

    // Problem
    "problem.eyebrow": "The problem",
    "problem.title.l1": "Healthcare is broken in",
    "problem.title.l2": "one simple way.",
    "problem.sub":
      "Every time you visit a new doctor, you start from scratch. Your history sits in folders, drawers and inboxes nobody reads.",
    "problem.stat1.k": "75 pages",
    "problem.stat1.v": "of scattered reports across hospitals, clinics and labs.",
    "problem.stat2.k": "5 minutes",
    "problem.stat2.v": "to explain a lifetime of history to a doctor who has never seen you.",
    "problem.stat3.k": "0 context",
    "problem.stat3.v": "every new specialist starts from a blank page.",
    "problem.consequences": "This leads to",
    "problem.tag.repeat": "Repeated tests",
    "problem.tag.miss": "Missed patterns",
    "problem.tag.delay": "Delayed diagnoses",
    "problem.closer":
      "This isn't a productivity problem. It's a life problem. In emergencies, families have minutes to explain years of history, and patients pay the price.",

    // Voices
    "voices.eyebrow": "Voices",
    "voices.title.l1": "Every Indian family",
    "voices.title.l2": "has a version of this story.",
    "voices.q1.body":
      "We had five minutes to explain everything. We didn't even know where to start.",
    "voices.q1.who": "A daughter",
    "voices.q1.ctx": "Chennai · about her mother's last admission",
    "voices.q2.body":
      "Every new doctor sends us back for the same blood tests. We have a folder this thick. Nobody reads it.",
    "voices.q2.who": "A son",
    "voices.q2.ctx": "Bengaluru · caring for his diabetic father",
    "voices.q3.body":
      "Appa's surgery was at 2 AM. I was holding three prescriptions and a CT scan from a hospital in another city.",
    "voices.q3.who": "A founder",
    "voices.q3.ctx": "Delhi · the night Vyana was born",

    // Wedge
    "wedge.title.l1": "Not a health records app.",
    "wedge.title.l2": "A clinical memory system.",
    "wedge.sub":
      "Vyana doesn't just store files. It builds a continuous health graph, so doctors see your full story in seconds, not silos.",
    "wedge.p1.title": "Tracks conditions over time",
    "wedge.p1.body": "HbA1c, BP, kidney function, thyroid. The slow signals plotted across years, not visits.",
    "wedge.p2.title": "Connects the dots",
    "wedge.p2.body": "Tests, medications and symptoms linked into one continuous graph, not scattered files.",
    "wedge.p3.title": "Surfaces what changed",
    "wedge.p3.body": "Abnormal patterns and shifts highlighted before they become emergencies.",

    // How it works
    "how.eyebrow": "How it works",
    "how.title.l1": "Three quiet steps.",
    "how.title.l2": "A lifetime of context.",
    "how.step": "Step",
    "how.s1.title": "Upload anything.",
    "how.s1.body":
      "Snap a prescription. Drop a PDF. Forward a discharge summary. We read handwritten Hindi, printed Tamil, smudged Bengali. Five languages, every format.",
    "how.s2.title": "AI extracts everything.",
    "how.s2.body":
      "Vitals, diagnoses, medications, timelines. Thirty-three clinical signals plotted across years, so the slow patterns finally become visible.",
    "how.s3.title": "Walk in prepared.",
    "how.s3.body":
      "A one-page clinical briefing any doctor can read in thirty seconds. Conditions, medications, recent flags. Share on WhatsApp before the appointment.",

    // Outcome
    "out.eyebrow": "What you walk in with",
    "out.title.l1": "Your next appointment,",
    "out.title.l2": "already prepared.",
    "out.list1": "A one-screen medical summary",
    "out.list2": "Trends across time (BP, HbA1c, eGFR)",
    "out.list3": "Medication and diagnosis history",
    "out.list4": "Abnormal signals highlighted",
    "out.flips.eyebrow": "What it actually does for you",
    "out.flip1.stop": "Stop repeating tests",
    "out.flip1.gain": "Save money",
    "out.flip2.stop": "Stop guessing history",
    "out.flip2.gain": "Better care",
    "out.flip3.stop": "Stop losing reports",
    "out.flip3.gain": "Stay in control",

    // Trust
    "trust.eyebrow": "Trust",
    "trust.title.l1": "Your records belong to you.",
    "trust.title.l2": "We never sell them. Ever.",
    "trust.sub":
      "Vyana is built on India's national health standards and protected by the same encryption banks use. You can export everything, share with any doctor, or delete it all in one tap.",
    "trust.b1.label": "End-to-end encrypted",
    "trust.b1.sub": "AES-256 at rest",
    "trust.b2.label": "ABDM-aligned",
    "trust.b2.sub": "India's national health stack",
    "trust.b3.label": "DPDPA 2023 compliant",
    "trust.b3.sub": "Indian data law",
    "trust.b4.label": "Your data, your control",
    "trust.b4.sub": "Delete anytime",
    "trust.b5.label": "Built at Wharton",
    "trust.b5.sub": "Healthcare & AI research",
    "trust.note":
      "A note on ABDM: Vyana follows India's Ayushman Bharat Digital Mission standards for health records and identity. Full sandbox certification is in progress.",

    // FAQ
    "faq.eyebrow": "Questions",
    "faq.title.l1": "Things families",
    "faq.title.l2": "ask us first.",
    "faq.q1.q": "Is this approved by India's national health system?",
    "faq.q1.a":
      "Yes. Vyana is built to align with the Ayushman Bharat Digital Mission (ABDM), the same framework Apollo, Max, and government hospitals use. Your records can travel across any ABDM-connected clinic in India.",
    "faq.q2.q": "Who can actually see my records?",
    "faq.q2.a":
      "Only you. Doctors see what you choose to share, for as long as you choose. Every share creates a 24-hour link that expires automatically. We never sell your data, never share it with insurers, and never use it to train public AI models.",
    "faq.q3.q": "Does Vyana work in my language?",
    "faq.q3.a":
      "Yes. The app speaks English, Hindi, Tamil, Telugu, and Bengali. Your prescriptions are read in any of these scripts, including handwritten notes. More languages are added based on family requests.",
    "faq.q4.q": "Will my doctor actually accept the briefing?",
    "faq.q4.a":
      "We generate a clean, one-page clinical summary in standard SOAP format that any doctor can read in 30 seconds. It also exports as a structured FHIR file, the global standard hospitals already use. No new app for the doctor to download.",
    "faq.q5.q": "What if I delete my account?",
    "faq.q5.a":
      "Everything goes. Within 30 days every record, vital, prescription, and note is permanently erased from our systems. You can also export all your data as a single download before you leave.",
    "faq.q6.q": "How much does this cost?",
    "faq.q6.a":
      "Free to start. You can upload, organize, and share unlimited records on the free plan. Paid plans add advanced AI features like longitudinal trend analysis and faster support.",
    "faq.q7.q": "Who is this really for?",
    "faq.q7.a":
      "Families managing chronic conditions, adult children caring for elderly parents, anyone juggling specialists across cities, and patients tired of repeating their history every visit. If you've ever lost a prescription, this is for you.",
    "faq.q8.q": "Is the AI making medical decisions?",
    "faq.q8.a":
      "No. Vyana is clinical decision support, not a diagnosis engine. We surface patterns, flag drug interactions, and prepare your history for the doctor. Every medical decision stays with your doctor, where it belongs.",
    "faq.footer.pre": "Still wondering something?",
    "faq.footer.link": "Write to Megha directly",

    // CTA
    "cta.title.l1": "Start your family's",
    "cta.title.l2": "health memory today.",
    "cta.sub": "Free to start. Upload your first report in thirty seconds.",
    "cta.email": "Your email address",
    "cta.relation": "Who you care for",
    "cta.city": "City",
    "cta.button": "Get started",
    "cta.signoff": "With care,",
    "cta.role": "Founder · Vyana",

    // Research / Science section
    "research.eyebrow": "The science",
    "research.title.l1": "Built on the same protocols",
    "research.title.l2": "your doctor already trusts.",
    "research.sub": "Every flag, score and warning in Vyana is a faithful implementation of a published clinical guideline. Not generative guesswork.",
    "research.c1.title": "Cardiovascular Risk",
    "research.c1.cite": "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline. Circulation, 129(25_suppl_2).",
    "research.c1.line": "We implement the Pooled Cohort ASCVD equations on real patient vitals. Never speculative inference.",
    "research.c2.title": "Diabetes Staging",
    "research.c2.cite": "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    "research.c2.line": "HbA1c thresholds and glycemic targets follow ADA 2024, the standard every Indian endocrinology practice uses.",
    "research.c3.title": "Kidney Function",
    "research.c3.cite": "KDIGO. (2024). Clinical Practice Guideline for CKD. Kidney International, 105(4S).",
    "research.c3.line": "eGFR is computed via the 2021 CKD-EPI race-free equation, with KDIGO stage flags surfaced early.",
    "research.c4.title": "Drug Interactions",
    "research.c4.cite": "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index.",
    "research.c4.line": "Every medication is mapped to ATC codes and cross-checked for major interactions.",
    "research.builtBy": "Built by founders from",
    "research.advisors": "Clinical Advisors",
    "research.advisors.sub": "AIIMS · Apollo · Tertiary care",
    "research.megha.role": "Founder · CS Major · Ex-FAANG · Wharton MBA",
    "research.megha.bio": "Megha is pursuing her MBA at Wharton, focused on healthcare and applied AI. She lost both grandparents to medical emergencies in Tirupur 2005 where doctors had no clinical history, and later navigated her father's intestinal gangrene during COVID with the same gap. Vyana is the layer that would have changed both nights.",
    "research.cab.title": "Clinical Advisory Board",
    "research.cab.tag": "The trust",
    "research.cab.body": "Practising physicians from Indian tertiary hospitals contribute to our risk engine, briefing protocols and the clinical safety rules that govern every AI-generated insight in Vyana.",

    // Team section
    "team.eyebrow": "Built by",
    "team.title.l1": "A founder who",
    "team.title.l2": "lived this problem.",
    "team.founderTag": "The Founder",
    "team.founderName": "Megha Baid",
    "team.founderSub": "Wharton MBA · Healthcare & AI",
    "team.bio.p1": "Megha is building Vyana out of Wharton, where she focuses on healthcare and applied AI. Before Wharton, she spent years in product and operations across consumer technology in India.",
    "team.bio.p2": "Vyana began in Tirupur, Tamil Nadu in 2005, when she lost both grandparents to medical emergencies that arrived at hospitals with no records, no history, and five minutes to explain a lifetime. Fifteen years later, she watched her father survive intestinal gangrene during COVID with the same gap. Vyana is the layer that would have changed both nights.",
    "team.affiliated": "Affiliated with",
    "team.aff1": "The Wharton School",
    "team.aff2": "University of Pennsylvania",
    "team.aff3": "ABDM-aligned",
    "team.advisorNote": "Clinical advisors from Indian tertiary hospitals contributing to our risk engine and briefing protocols.",

    // Legacy keys still used elsewhere
    "landing.getAccess": "Get Early Access",
  },

  hi: {
    "nav.story": "कहानी",
    "nav.research": "रिसर्च",
    "nav.how": "यह कैसे काम करता है",
    "nav.contact": "संपर्क",
    "nav.try": "अभी Vyana आज़माएं",

    "hero.eyebrow": "आपकी स्वास्थ्य कहानी, हमेशा आपके साथ",
    "hero.h1.l1": "अपना मेडिकल",
    "hero.h1.l2": "इतिहास कभी",
    "hero.h1.l3": "दोबारा मत",
    "hero.h1.again": "समझाइए।",
    "hero.sub":
      "अपनी रिपोर्ट अपलोड करें। 30 सेकंड में डॉक्टर के लिए तैयार सारांश पाएं। बीमारियाँ, दवाइयाँ, हाल के बदलाव, एक स्क्रीन जो कोई भी डॉक्टर तुरंत पढ़ सके।",
    "hero.cta.primary": "अपनी पहली रिपोर्ट अपलोड करें",
    "hero.cta.secondary": "एक नमूना सारांश देखें",

    "problem.eyebrow": "समस्या",
    "problem.title.l1": "हेल्थकेयर एक",
    "problem.title.l2": "साधारण तरीके से टूटा है।",
    "problem.sub":
      "हर बार जब आप किसी नए डॉक्टर के पास जाते हैं, सब कुछ शून्य से शुरू होता है। आपका इतिहास फ़ोल्डरों और दराज़ों में पड़ा रहता है, जिन्हें कोई नहीं पढ़ता।",
    "problem.stat1.k": "75 पन्ने",
    "problem.stat1.v": "अस्पतालों, क्लीनिकों और लैब्स में बिखरी रिपोर्टों के।",
    "problem.stat2.k": "5 मिनट",
    "problem.stat2.v": "एक डॉक्टर को पूरे जीवन का इतिहास समझाने के लिए, जिसने आपको पहले कभी नहीं देखा।",
    "problem.stat3.k": "0 संदर्भ",
    "problem.stat3.v": "हर नया विशेषज्ञ खाली पन्ने से शुरू करता है।",
    "problem.consequences": "इसका नतीजा",
    "problem.tag.repeat": "दोहराई गई जाँचें",
    "problem.tag.miss": "छूटे हुए पैटर्न",
    "problem.tag.delay": "देरी से निदान",
    "problem.closer":
      "यह उत्पादकता की समस्या नहीं है। यह जीवन की समस्या है। आपात स्थिति में, परिवारों के पास सालों का इतिहास समझाने के लिए मिनट होते हैं, और कीमत मरीज़ चुकाते हैं।",

    "voices.eyebrow": "आवाज़ें",
    "voices.title.l1": "हर भारतीय परिवार के पास",
    "voices.title.l2": "इस कहानी का अपना संस्करण है।",
    "voices.q1.body":
      "हमारे पास सब कुछ समझाने के लिए पाँच मिनट थे। हमें पता ही नहीं था कि कहाँ से शुरू करें।",
    "voices.q1.who": "एक बेटी",
    "voices.q1.ctx": "चेन्नई · अपनी माँ की आख़िरी भर्ती के बारे में",
    "voices.q2.body":
      "हर नया डॉक्टर हमें वही ब्लड टेस्ट दोबारा कराने भेजता है। हमारे पास इतनी मोटी फ़ाइल है। कोई नहीं पढ़ता।",
    "voices.q2.who": "एक बेटा",
    "voices.q2.ctx": "बेंगलुरु · अपने डायबिटिक पिता की देखभाल करते हुए",
    "voices.q3.body":
      "पापा की सर्जरी रात 2 बजे थी। मेरे हाथ में तीन पर्चे और दूसरे शहर के अस्पताल का एक CT स्कैन था।",
    "voices.q3.who": "एक संस्थापक",
    "voices.q3.ctx": "दिल्ली · वह रात जब Vyana का जन्म हुआ",

    "wedge.title.l1": "कोई हेल्थ रिकॉर्ड ऐप नहीं।",
    "wedge.title.l2": "एक क्लिनिकल मेमोरी सिस्टम।",
    "wedge.sub":
      "Vyana सिर्फ़ फ़ाइलें नहीं रखता। यह एक निरंतर हेल्थ ग्राफ़ बनाता है, ताकि डॉक्टर आपकी पूरी कहानी सेकंडों में देख सकें।",
    "wedge.p1.title": "समय के साथ बीमारियों को ट्रैक करता है",
    "wedge.p1.body": "HbA1c, BP, किडनी फ़ंक्शन, थायरॉइड। धीमे संकेत वर्षों में, मुलाक़ातों में नहीं।",
    "wedge.p2.title": "बिंदुओं को जोड़ता है",
    "wedge.p2.body": "टेस्ट, दवाइयाँ और लक्षण एक निरंतर ग्राफ़ में, बिखरी फ़ाइलों में नहीं।",
    "wedge.p3.title": "जो बदला है उसे सामने लाता है",
    "wedge.p3.body": "असामान्य पैटर्न और बदलाव आपातकाल बनने से पहले हाइलाइट हो जाते हैं।",

    "how.eyebrow": "यह कैसे काम करता है",
    "how.title.l1": "तीन शांत कदम।",
    "how.title.l2": "जीवन भर का संदर्भ।",
    "how.step": "कदम",
    "how.s1.title": "कुछ भी अपलोड करें।",
    "how.s1.body":
      "एक पर्ची की फ़ोटो लें। PDF भेजें। डिस्चार्ज समरी फ़ॉरवर्ड करें। हम हस्तलिखित हिंदी, छपी तमिल, धुंधली बंगाली पढ़ते हैं। पाँच भाषाएँ, हर फ़ॉर्मैट।",
    "how.s2.title": "AI सब कुछ निकालता है।",
    "how.s2.body":
      "वाइटल्स, निदान, दवाइयाँ, टाइमलाइन। तैंतीस क्लिनिकल संकेत वर्षों में प्लॉट किए जाते हैं, ताकि धीमे पैटर्न आख़िरकार दिखाई दें।",
    "how.s3.title": "तैयार होकर अंदर जाइए।",
    "how.s3.body":
      "एक पन्ने का क्लिनिकल ब्रीफ़िंग जिसे कोई भी डॉक्टर तीस सेकंड में पढ़ सकता है। अपॉइंटमेंट से पहले WhatsApp पर शेयर करें।",

    "out.eyebrow": "आप जो लेकर अंदर जाते हैं",
    "out.title.l1": "आपकी अगली अपॉइंटमेंट,",
    "out.title.l2": "पहले से तैयार।",
    "out.list1": "एक स्क्रीन का मेडिकल सारांश",
    "out.list2": "समय के साथ रुझान (BP, HbA1c, eGFR)",
    "out.list3": "दवाइयों और निदान का इतिहास",
    "out.list4": "असामान्य संकेत हाइलाइट किए गए",
    "out.flips.eyebrow": "यह वास्तव में आपके लिए क्या करता है",
    "out.flip1.stop": "टेस्ट दोहराना बंद करें",
    "out.flip1.gain": "पैसा बचाएँ",
    "out.flip2.stop": "इतिहास का अंदाज़ा लगाना बंद करें",
    "out.flip2.gain": "बेहतर देखभाल",
    "out.flip3.stop": "रिपोर्ट खोना बंद करें",
    "out.flip3.gain": "नियंत्रण में रहें",

    "trust.eyebrow": "विश्वास",
    "trust.title.l1": "आपके रिकॉर्ड आपके हैं।",
    "trust.title.l2": "हम उन्हें कभी नहीं बेचते।",
    "trust.sub":
      "Vyana भारत के राष्ट्रीय हेल्थ मानकों पर बना है और उसी एन्क्रिप्शन से सुरक्षित है जिसका उपयोग बैंक करते हैं। आप सब कुछ एक्सपोर्ट कर सकते हैं, किसी भी डॉक्टर से शेयर कर सकते हैं, या एक टैप में सब हटा सकते हैं।",
    "trust.b1.label": "एंड-टू-एंड एन्क्रिप्टेड",
    "trust.b1.sub": "AES-256",
    "trust.b2.label": "ABDM-संगत",
    "trust.b2.sub": "भारत का राष्ट्रीय हेल्थ स्टैक",
    "trust.b3.label": "DPDPA 2023 अनुपालन",
    "trust.b3.sub": "भारतीय डेटा क़ानून",
    "trust.b4.label": "आपका डेटा, आपका नियंत्रण",
    "trust.b4.sub": "कभी भी हटाएँ",
    "trust.b5.label": "Wharton में बना",
    "trust.b5.sub": "हेल्थकेयर और AI रिसर्च",
    "trust.note":
      "ABDM के बारे में: Vyana भारत के आयुष्मान भारत डिजिटल मिशन मानकों का पालन करता है। पूर्ण सैंडबॉक्स प्रमाणन प्रगति पर है।",

    "faq.eyebrow": "सवाल",
    "faq.title.l1": "जो परिवार",
    "faq.title.l2": "हमसे पहले पूछते हैं।",
    "faq.q1.q": "क्या यह भारत के राष्ट्रीय हेल्थ सिस्टम द्वारा अनुमोदित है?",
    "faq.q1.a":
      "हाँ। Vyana आयुष्मान भारत डिजिटल मिशन (ABDM) के अनुरूप बनाया गया है, वही ढाँचा जो Apollo, Max और सरकारी अस्पताल इस्तेमाल करते हैं। आपके रिकॉर्ड किसी भी ABDM-कनेक्टेड क्लिनिक में जा सकते हैं।",
    "faq.q2.q": "मेरे रिकॉर्ड वास्तव में कौन देख सकता है?",
    "faq.q2.a":
      "केवल आप। डॉक्टर वही देखते हैं जो आप शेयर करते हैं, जब तक आप चाहें। हर शेयर 24 घंटे का लिंक बनाता है जो अपने आप समाप्त हो जाता है। हम आपका डेटा कभी नहीं बेचते, बीमा कंपनियों को नहीं देते, और सार्वजनिक AI मॉडल को ट्रेन करने के लिए उपयोग नहीं करते।",
    "faq.q3.q": "क्या Vyana मेरी भाषा में काम करता है?",
    "faq.q3.a":
      "हाँ। ऐप अंग्रेज़ी, हिंदी, तमिल, तेलुगु और बंगाली बोलता है। आपकी पर्चियाँ इन सभी लिपियों में पढ़ी जाती हैं, हस्तलिखित नोट्स सहित।",
    "faq.q4.q": "क्या मेरा डॉक्टर वास्तव में ब्रीफ़िंग स्वीकार करेगा?",
    "faq.q4.a":
      "हम मानक SOAP फ़ॉर्मैट में एक साफ़, एक-पन्ने का क्लिनिकल सारांश तैयार करते हैं जिसे कोई भी डॉक्टर 30 सेकंड में पढ़ सकता है। यह एक संरचित FHIR फ़ाइल के रूप में भी एक्सपोर्ट होता है, वही वैश्विक मानक जो अस्पताल पहले से उपयोग करते हैं।",
    "faq.q5.q": "अगर मैं अपना खाता हटा दूँ तो क्या होगा?",
    "faq.q5.a":
      "सब कुछ चला जाता है। 30 दिनों के भीतर हर रिकॉर्ड, वाइटल, पर्ची और नोट हमारे सिस्टम से स्थायी रूप से मिटा दिया जाता है। आप जाने से पहले अपना सारा डेटा एक डाउनलोड के रूप में एक्सपोर्ट भी कर सकते हैं।",
    "faq.q6.q": "इसकी क़ीमत कितनी है?",
    "faq.q6.a":
      "शुरू करना मुफ़्त है। आप मुफ़्त प्लान पर असीमित रिकॉर्ड अपलोड, व्यवस्थित और शेयर कर सकते हैं। पेड प्लान में लंबी अवधि के ट्रेंड विश्लेषण और तेज़ सपोर्ट जैसी एडवांस AI सुविधाएँ शामिल हैं।",
    "faq.q7.q": "यह वास्तव में किसके लिए है?",
    "faq.q7.a":
      "पुरानी बीमारियों का प्रबंधन करने वाले परिवार, बुज़ुर्ग माता-पिता की देखभाल करने वाले बच्चे, शहरों भर में विशेषज्ञों के बीच जूझने वाले लोग, और हर बार अपना इतिहास दोहराने से थके मरीज़।",
    "faq.q8.q": "क्या AI मेडिकल फ़ैसले ले रहा है?",
    "faq.q8.a":
      "नहीं। Vyana क्लिनिकल डिसीज़न सपोर्ट है, निदान इंजन नहीं। हम पैटर्न सामने लाते हैं, दवाओं की प्रतिक्रियाओं को फ़्लैग करते हैं, और आपका इतिहास डॉक्टर के लिए तैयार करते हैं। हर मेडिकल फ़ैसला आपके डॉक्टर के पास रहता है।",
    "faq.footer.pre": "अभी भी कुछ पूछना है?",
    "faq.footer.link": "मेघा को सीधे लिखें",

    "cta.title.l1": "अपने परिवार की",
    "cta.title.l2": "स्वास्थ्य स्मृति आज शुरू करें।",
    "cta.sub": "शुरू करना मुफ़्त है। अपनी पहली रिपोर्ट तीस सेकंड में अपलोड करें।",
    "cta.email": "आपका ईमेल पता",
    "cta.relation": "आप किसकी देखभाल करते हैं",
    "cta.city": "शहर",
    "cta.button": "शुरू करें",
    "cta.signoff": "स्नेह सहित,",
    "cta.role": "संस्थापक · Vyana",

    "research.eyebrow": "विज्ञान",
    "research.title.l1": "उन्हीं प्रोटोकॉल पर बना",
    "research.title.l2": "जिन पर आपके डॉक्टर पहले से भरोसा करते हैं।",
    "research.sub": "Vyana में हर फ्लैग, स्कोर और चेतावनी प्रकाशित क्लिनिकल गाइडलाइन का सटीक कार्यान्वयन है। कोई जनरेटिव अनुमान नहीं।",
    "research.c1.title": "हृदय जोखिम",
    "research.c1.cite": "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline. Circulation, 129(25_suppl_2).",
    "research.c1.line": "हम वास्तविक रोगी वाइटल्स पर Pooled Cohort ASCVD समीकरण लागू करते हैं। कभी अटकल नहीं।",
    "research.c2.title": "डायबिटीज़ स्टेजिंग",
    "research.c2.cite": "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    "research.c2.line": "HbA1c सीमाएँ और ग्लाइसेमिक लक्ष्य ADA 2024 के अनुसार, जिसे हर भारतीय एंडोक्रिनोलॉजी प्रैक्टिस उपयोग करती है।",
    "research.c3.title": "किडनी फंक्शन",
    "research.c3.cite": "KDIGO. (2024). Clinical Practice Guideline for CKD. Kidney International, 105(4S).",
    "research.c3.line": "eGFR की गणना 2021 CKD-EPI race-free समीकरण से, और KDIGO स्टेज फ्लैग शुरुआत में ही दिखाए जाते हैं।",
    "research.c4.title": "ड्रग इंटरैक्शन",
    "research.c4.cite": "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index.",
    "research.c4.line": "हर दवा ATC कोड से मैप की जाती है और बड़े इंटरैक्शन के लिए जांची जाती है।",
    "research.builtBy": "संस्थापक यहाँ से",
    "research.advisors": "क्लिनिकल सलाहकार",
    "research.advisors.sub": "AIIMS · Apollo · टर्शियरी केयर",
    "research.megha.role": "संस्थापक · CS · पूर्व-FAANG · Wharton MBA",
    "research.megha.bio": "मेघा Wharton से MBA कर रही हैं, जिसका फोकस हेल्थकेयर और एप्लाइड AI पर है। 2005 में तिरुपुर में उनके दोनों दादा-दादी मेडिकल इमरजेंसी में चले गए क्योंकि डॉक्टरों के पास कोई क्लिनिकल इतिहास नहीं था। बाद में COVID के दौरान उन्होंने पिता की आंत्र गैंग्रीन भी इसी कमी के साथ झेली। Vyana वही लेयर है जो उन दोनों रातों को बदल देती।",
    "research.cab.title": "क्लिनिकल सलाहकार बोर्ड",
    "research.cab.tag": "विश्वास",
    "research.cab.body": "भारतीय टर्शियरी अस्पतालों के प्रैक्टिसिंग डॉक्टर हमारे रिस्क इंजन, ब्रीफिंग प्रोटोकॉल और Vyana की हर AI इनसाइट को नियंत्रित करने वाले क्लिनिकल सेफ्टी नियमों में योगदान करते हैं।",

    "team.eyebrow": "द्वारा निर्मित",
    "team.title.l1": "एक संस्थापक जिन्होंने",
    "team.title.l2": "इस समस्या को जिया है।",
    "team.founderTag": "संस्थापक",
    "team.founderName": "मेघा बैद",
    "team.founderSub": "Wharton MBA · हेल्थकेयर और AI",
    "team.bio.p1": "मेघा Wharton से Vyana बना रही हैं, जहाँ उनका फोकस हेल्थकेयर और एप्लाइड AI पर है। Wharton से पहले उन्होंने भारत में कंज़्यूमर टेक्नोलॉजी के प्रोडक्ट और ऑपरेशंस में कई साल बिताए।",
    "team.bio.p2": "Vyana की शुरुआत 2005 में तमिलनाडु के तिरुपुर में हुई, जब उन्होंने दोनों दादा-दादी को मेडिकल इमरजेंसी में खो दिया। अस्पतालों के पास न रिकॉर्ड थे, न इतिहास, और एक जीवन समझाने के लिए सिर्फ़ पाँच मिनट। पंद्रह साल बाद, उन्होंने पिता को COVID के दौरान आंत्र गैंग्रीन से जूझते देखा, वही कमी फिर सामने थी। Vyana वही लेयर है जो उन दोनों रातों को बदल देती।",
    "team.affiliated": "संबद्धता",
    "team.aff1": "The Wharton School",
    "team.aff2": "University of Pennsylvania",
    "team.aff3": "ABDM-संरेखित",
    "team.advisorNote": "भारतीय टर्शियरी अस्पतालों के क्लिनिकल सलाहकार हमारे रिस्क इंजन और ब्रीफिंग प्रोटोकॉल में योगदान करते हैं।",

    "landing.getAccess": "अर्ली एक्सेस पाएँ",
  },

  ta: {
    "nav.story": "கதை",
    "nav.research": "ஆராய்ச்சி",
    "nav.how": "எப்படி வேலை செய்கிறது",
    "nav.contact": "தொடர்பு",
    "nav.try": "இப்போதே Vyana-ஐ முயற்சிக்கவும்",

    "hero.eyebrow": "உங்கள் ஆரோக்கியக் கதை, எப்போதும் உங்களுடன்",
    "hero.h1.l1": "உங்கள் மருத்துவ",
    "hero.h1.l2": "வரலாற்றை மீண்டும்",
    "hero.h1.l3": "விளக்க வேண்டாம்",
    "hero.h1.again": "மீண்டும்.",
    "hero.sub":
      "உங்கள் அறிக்கைகளை பதிவேற்றவும். 30 விநாடிகளில் மருத்துவருக்குத் தயாரான சுருக்கம். நிலைகள், மருந்துகள், சமீபத்திய மாற்றங்கள், எந்த மருத்துவரும் உடனே படிக்கக்கூடிய ஒரு திரை.",
    "hero.cta.primary": "உங்கள் முதல் பதிவை பதிவேற்றவும்",
    "hero.cta.secondary": "மாதிரிச் சுருக்கத்தைக் காண்க",

    "problem.eyebrow": "பிரச்சினை",
    "problem.title.l1": "சுகாதாரம் ஒரே",
    "problem.title.l2": "எளிய வழியில் உடைந்துள்ளது.",
    "problem.sub":
      "ஒவ்வொரு புதிய மருத்துவரிடமும் நீங்கள் பூஜ்ஜியத்திலிருந்து தொடங்குகிறீர்கள். உங்கள் வரலாறு யாரும் படிக்காத கோப்புகளில் கிடக்கிறது.",
    "problem.stat1.k": "75 பக்கங்கள்",
    "problem.stat1.v": "மருத்துவமனைகள், கிளினிக்குகள் மற்றும் ஆய்வகங்களில் சிதறிய அறிக்கைகள்.",
    "problem.stat2.k": "5 நிமிடங்கள்",
    "problem.stat2.v": "உங்களை முன்பு பார்த்திராத மருத்துவரிடம் வாழ்நாள் வரலாற்றை விளக்க.",
    "problem.stat3.k": "0 சூழல்",
    "problem.stat3.v": "ஒவ்வொரு புதிய நிபுணரும் வெற்றுப் பக்கத்திலிருந்து தொடங்குகிறார்.",
    "problem.consequences": "இதன் விளைவு",
    "problem.tag.repeat": "மீண்டும் செய்யப்பட்ட சோதனைகள்",
    "problem.tag.miss": "தவறவிட்ட வடிவங்கள்",
    "problem.tag.delay": "தாமதமான நோயறிதல்கள்",
    "problem.closer":
      "இது உற்பத்தித்திறன் பிரச்சினை அல்ல. இது வாழ்க்கைப் பிரச்சினை. அவசர நிலையில், குடும்பங்களுக்கு ஆண்டுகளின் வரலாற்றை விளக்க சில நிமிடங்களே உள்ளன, விலையை நோயாளிகள் கொடுக்கிறார்கள்.",

    "voices.eyebrow": "குரல்கள்",
    "voices.title.l1": "ஒவ்வொரு இந்தியக் குடும்பத்திற்கும்",
    "voices.title.l2": "இந்தக் கதையின் ஒரு பதிப்பு உள்ளது.",
    "voices.q1.body":
      "எல்லாவற்றையும் விளக்க எங்களுக்கு ஐந்து நிமிடங்கள் இருந்தன. எங்கிருந்து தொடங்குவது என்று கூட தெரியவில்லை.",
    "voices.q1.who": "ஒரு மகள்",
    "voices.q1.ctx": "சென்னை · அவளது அம்மாவின் கடைசி அனுமதி பற்றி",
    "voices.q2.body":
      "ஒவ்வொரு புதிய மருத்துவரும் அதே ரத்தப் பரிசோதனைக்கு எங்களை அனுப்புகிறார். எங்களிடம் இவ்வளவு தடிமனான கோப்பு உள்ளது. யாரும் படிப்பதில்லை.",
    "voices.q2.who": "ஒரு மகன்",
    "voices.q2.ctx": "பெங்களூரு · சர்க்கரை நோயுள்ள தந்தையை கவனித்து",
    "voices.q3.body":
      "அப்பாவின் அறுவை சிகிச்சை இரவு 2 மணிக்கு. என் கையில் மூன்று மருந்துச் சீட்டுகளும் வேறு நகரத்து CT ஸ்கேனும் இருந்தன.",
    "voices.q3.who": "ஒரு நிறுவனர்",
    "voices.q3.ctx": "டெல்லி · Vyana பிறந்த இரவு",

    "wedge.title.l1": "இது ஒரு மருத்துவ பதிவுகள் ஆப் அல்ல.",
    "wedge.title.l2": "ஒரு மருத்துவ நினைவு அமைப்பு.",
    "wedge.sub":
      "Vyana வெறும் கோப்புகளை சேமிக்கவில்லை. தொடர்ச்சியான ஆரோக்கிய வரைபடத்தை உருவாக்குகிறது, மருத்துவர்கள் உங்கள் முழுக் கதையையும் வினாடிகளில் காண்கிறார்கள்.",
    "wedge.p1.title": "காலப்போக்கில் நிலைகளைக் கண்காணிக்கிறது",
    "wedge.p1.body": "HbA1c, BP, சிறுநீரக செயல்பாடு, தைராய்டு. ஆண்டுகளில் பதிக்கப்பட்ட மெதுவான சமிக்ஞைகள்.",
    "wedge.p2.title": "புள்ளிகளை இணைக்கிறது",
    "wedge.p2.body": "சோதனைகள், மருந்துகள், அறிகுறிகள் ஒரு தொடர்ச்சியான வரைபடத்தில் இணைக்கப்படுகின்றன.",
    "wedge.p3.title": "மாறியதை வெளிப்படுத்துகிறது",
    "wedge.p3.body": "அசாதாரண வடிவங்கள் அவசரநிலையாக மாறுவதற்கு முன்பே சிறப்பிக்கப்படுகின்றன.",

    "how.eyebrow": "எப்படி வேலை செய்கிறது",
    "how.title.l1": "மூன்று அமைதியான படிகள்.",
    "how.title.l2": "வாழ்நாள் சூழல்.",
    "how.step": "படி",
    "how.s1.title": "எதையும் பதிவேற்றவும்.",
    "how.s1.body":
      "ஒரு மருந்துச் சீட்டை புகைப்படம் எடுக்கவும். PDF அனுப்பவும். டிஸ்சார்ஜ் சுருக்கத்தை அனுப்பவும். கையெழுத்து இந்தி, அச்சிட்ட தமிழ், மங்கலான பெங்காலி படிக்கிறோம்.",
    "how.s2.title": "AI அனைத்தையும் பிரித்தெடுக்கிறது.",
    "how.s2.body":
      "வைட்டல்கள், நோயறிதல்கள், மருந்துகள், காலவரிசை. முப்பத்து மூன்று மருத்துவ சமிக்ஞைகள் ஆண்டுகளில் வரையப்படுகின்றன.",
    "how.s3.title": "தயாராக உள்ளே செல்லுங்கள்.",
    "how.s3.body":
      "எந்த மருத்துவரும் முப்பது விநாடிகளில் படிக்கக்கூடிய ஒரு பக்க சுருக்கம். சந்திப்புக்கு முன் WhatsApp-ல் பகிரவும்.",

    "out.eyebrow": "நீங்கள் எடுத்துச் செல்வது",
    "out.title.l1": "உங்கள் அடுத்த சந்திப்பு,",
    "out.title.l2": "ஏற்கனவே தயார்.",
    "out.list1": "ஒரு திரையில் மருத்துவ சுருக்கம்",
    "out.list2": "காலப்போக்கில் போக்குகள் (BP, HbA1c, eGFR)",
    "out.list3": "மருந்து மற்றும் நோயறிதல் வரலாறு",
    "out.list4": "அசாதாரண சமிக்ஞைகள் சிறப்பிக்கப்பட்டுள்ளன",
    "out.flips.eyebrow": "இது உண்மையில் உங்களுக்கு என்ன செய்கிறது",
    "out.flip1.stop": "சோதனைகளை மீண்டும் செய்வதை நிறுத்துங்கள்",
    "out.flip1.gain": "பணத்தை சேமிக்கவும்",
    "out.flip2.stop": "வரலாற்றை யூகிப்பதை நிறுத்துங்கள்",
    "out.flip2.gain": "சிறந்த பராமரிப்பு",
    "out.flip3.stop": "அறிக்கைகளை இழப்பதை நிறுத்துங்கள்",
    "out.flip3.gain": "கட்டுப்பாட்டில் இருங்கள்",

    "trust.eyebrow": "நம்பிக்கை",
    "trust.title.l1": "உங்கள் பதிவுகள் உங்களுக்கே சொந்தம்.",
    "trust.title.l2": "நாங்கள் அதை விற்பதில்லை. ஒருபோதும்.",
    "trust.sub":
      "Vyana இந்தியாவின் தேசிய சுகாதார தரநிலைகளில் கட்டப்பட்டு வங்கிகள் பயன்படுத்தும் அதே என்க்ரிப்ஷனால் பாதுகாக்கப்படுகிறது.",
    "trust.b1.label": "எண்ட்-டு-எண்ட் என்க்ரிப்ட்",
    "trust.b1.sub": "AES-256",
    "trust.b2.label": "ABDM-இணக்கம்",
    "trust.b2.sub": "இந்தியாவின் தேசிய சுகாதார ஸ்டாக்",
    "trust.b3.label": "DPDPA 2023",
    "trust.b3.sub": "இந்திய தரவுச் சட்டம்",
    "trust.b4.label": "உங்கள் தரவு, உங்கள் கட்டுப்பாடு",
    "trust.b4.sub": "எந்த நேரத்திலும் நீக்கவும்",
    "trust.b5.label": "Wharton-ல் கட்டப்பட்டது",
    "trust.b5.sub": "சுகாதாரம் & AI ஆராய்ச்சி",
    "trust.note":
      "ABDM குறிப்பு: Vyana இந்தியாவின் ஆயுஷ்மான் பாரத் டிஜிட்டல் மிஷன் தரநிலைகளைப் பின்பற்றுகிறது. முழுமையான சான்றிதழ் முன்னேற்றத்தில் உள்ளது.",

    "faq.eyebrow": "கேள்விகள்",
    "faq.title.l1": "குடும்பங்கள்",
    "faq.title.l2": "எங்களிடம் முதலில் கேட்பவை.",
    "faq.q1.q": "இது இந்தியாவின் தேசிய சுகாதார அமைப்பால் அங்கீகரிக்கப்பட்டதா?",
    "faq.q1.a":
      "ஆம். Vyana ஆயுஷ்மான் பாரத் டிஜிட்டல் மிஷன் (ABDM)-உடன் இணங்க கட்டப்பட்டுள்ளது, இதே அமைப்பை Apollo, Max மற்றும் அரசு மருத்துவமனைகள் பயன்படுத்துகின்றன.",
    "faq.q2.q": "என் பதிவுகளை யார் உண்மையில் பார்க்க முடியும்?",
    "faq.q2.a":
      "நீங்கள் மட்டுமே. மருத்துவர்கள் நீங்கள் பகிர்வதை மட்டுமே, நீங்கள் விரும்பும் காலம் வரை பார்க்கிறார்கள். ஒவ்வொரு பகிர்வும் 24-மணி நேர இணைப்பாக இருக்கும். நாங்கள் உங்கள் தரவை விற்பதில்லை.",
    "faq.q3.q": "Vyana என் மொழியில் வேலை செய்கிறதா?",
    "faq.q3.a":
      "ஆம். ஆப் ஆங்கிலம், இந்தி, தமிழ், தெலுங்கு மற்றும் பெங்காலி பேசுகிறது. கையெழுத்து குறிப்புகள் உட்பட எல்லா எழுத்துக்களிலும் மருந்துச் சீட்டுகள் படிக்கப்படுகின்றன.",
    "faq.q4.q": "என் மருத்துவர் ப்ரீஃபிங்கை ஏற்றுக்கொள்வாரா?",
    "faq.q4.a":
      "எந்த மருத்துவரும் 30 விநாடிகளில் படிக்கக்கூடிய நிலையான SOAP வடிவில் ஒரு பக்க சுருக்கத்தை உருவாக்குகிறோம். FHIR கோப்பாகவும் ஏற்றுமதி செய்கிறது.",
    "faq.q5.q": "என் கணக்கை நீக்கினால் என்ன ஆகும்?",
    "faq.q5.a":
      "எல்லாமே போய்விடும். 30 நாட்களுக்குள் ஒவ்வொரு பதிவும் எங்கள் அமைப்புகளிலிருந்து நிரந்தரமாக அழிக்கப்படுகிறது.",
    "faq.q6.q": "இது எவ்வளவு செலவாகும்?",
    "faq.q6.a":
      "தொடங்க இலவசம். இலவசத் திட்டத்தில் வரம்பற்ற பதிவுகளை பதிவேற்றலாம். கட்டண திட்டங்களில் மேம்பட்ட AI அம்சங்கள் உள்ளன.",
    "faq.q7.q": "இது உண்மையில் யாருக்காக?",
    "faq.q7.a":
      "நாள்பட்ட நிலைகளை நிர்வகிக்கும் குடும்பங்கள், முதியோரை கவனிக்கும் வயது வந்த குழந்தைகள், ஒவ்வொரு வருகையிலும் வரலாற்றை மீண்டும் சொல்வதில் சோர்வடைந்த நோயாளிகள்.",
    "faq.q8.q": "AI மருத்துவ முடிவுகளை எடுக்கிறதா?",
    "faq.q8.a":
      "இல்லை. Vyana மருத்துவ முடிவுக்கான ஆதரவு, நோயறிதல் இயந்திரம் அல்ல. ஒவ்வொரு மருத்துவ முடிவும் உங்கள் மருத்துவருடன் இருக்கிறது.",
    "faq.footer.pre": "இன்னும் ஏதேனும் சந்தேகமா?",
    "faq.footer.link": "மேகாவுக்கு நேரடியாக எழுதுங்கள்",

    "cta.title.l1": "உங்கள் குடும்பத்தின்",
    "cta.title.l2": "ஆரோக்கிய நினைவை இன்றே தொடங்குங்கள்.",
    "cta.sub": "தொடங்க இலவசம். உங்கள் முதல் அறிக்கையை முப்பது விநாடிகளில் பதிவேற்றவும்.",
    "cta.email": "உங்கள் மின்னஞ்சல் முகவரி",
    "cta.relation": "நீங்கள் யாரை கவனிக்கிறீர்கள்",
    "cta.city": "நகரம்",
    "cta.button": "தொடங்கு",
    "cta.signoff": "அன்புடன்,",
    "cta.role": "நிறுவனர் · Vyana",

    "research.eyebrow": "அறிவியல்",
    "research.title.l1": "உங்கள் மருத்துவர் ஏற்கனவே நம்பும்",
    "research.title.l2": "அதே நெறிமுறைகள் மீது கட்டப்பட்டது.",
    "research.sub": "Vyana-வில் ஒவ்வொரு கொடி, மதிப்பெண் மற்றும் எச்சரிக்கையும் வெளியிடப்பட்ட மருத்துவ வழிகாட்டியின் நேர்மையான செயல்பாடு. ஊகம் இல்லை.",
    "research.c1.title": "இதய ஆபத்து",
    "research.c1.cite": "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline. Circulation, 129(25_suppl_2).",
    "research.c1.line": "உண்மையான நோயாளி வைட்டல்களில் Pooled Cohort ASCVD சமன்பாடுகளை செயல்படுத்துகிறோம். ஊகம் இல்லை.",
    "research.c2.title": "நீரிழிவு படிநிலை",
    "research.c2.cite": "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    "research.c2.line": "HbA1c வரம்புகளும் இலக்குகளும் ADA 2024-ஐ பின்பற்றுகின்றன, ஒவ்வொரு இந்திய எண்டோகிரைனாலஜி நடைமுறையும் இதை பயன்படுத்துகிறது.",
    "research.c3.title": "சிறுநீரக செயல்பாடு",
    "research.c3.cite": "KDIGO. (2024). Clinical Practice Guideline for CKD. Kidney International, 105(4S).",
    "research.c3.line": "eGFR 2021 CKD-EPI race-free சமன்பாட்டின் மூலம் கணக்கிடப்படுகிறது, KDIGO நிலை கொடிகள் முன்கூட்டியே காட்டப்படும்.",
    "research.c4.title": "மருந்து இடைவினைகள்",
    "research.c4.cite": "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index.",
    "research.c4.line": "ஒவ்வொரு மருந்தும் ATC குறியீடுகளுக்கு வரைபடமாக்கப்பட்டு பெரிய இடைவினைகளுக்கு சரிபார்க்கப்படுகிறது.",
    "research.builtBy": "நிறுவனர்கள் இங்கிருந்து",
    "research.advisors": "மருத்துவ ஆலோசகர்கள்",
    "research.advisors.sub": "AIIMS · Apollo · டெர்ஷியரி கேர்",
    "research.megha.role": "நிறுவனர் · CS · முன்னாள்-FAANG · Wharton MBA",
    "research.megha.bio": "மேகா Wharton-இல் MBA படிக்கிறார், சுகாதாரம் மற்றும் AI மீது கவனம். 2005-ல் திருப்பூரில் மருத்துவ வரலாறு இல்லாமல் இரு பாட்டனார்களையும் இழந்தார். பின்னர் COVID-ல் தந்தையின் குடல் கேங்கிரீன் அதே இடைவெளியுடன் சந்தித்தார். Vyana அந்த இரு இரவுகளையும் மாற்றியிருக்கும் அடுக்கு.",
    "research.cab.title": "மருத்துவ ஆலோசனை வாரியம்",
    "research.cab.tag": "நம்பிக்கை",
    "research.cab.body": "இந்திய டெர்ஷியரி மருத்துவமனைகளில் பணியாற்றும் மருத்துவர்கள் எங்கள் ரிஸ்க் இன்ஜின், ப்ரீஃபிங் நெறிமுறைகள் மற்றும் ஒவ்வொரு AI நுண்ணறிவையும் நிர்வகிக்கும் பாதுகாப்பு விதிகளுக்கு பங்களிக்கின்றனர்.",

    "team.eyebrow": "உருவாக்கியவர்",
    "team.title.l1": "இந்தப் பிரச்சினையை",
    "team.title.l2": "வாழ்ந்த ஒரு நிறுவனர்.",
    "team.founderTag": "நிறுவனர்",
    "team.founderName": "மேகா பைத்",
    "team.founderSub": "Wharton MBA · சுகாதாரம் & AI",
    "team.bio.p1": "மேகா Wharton-இலிருந்து Vyana-வை உருவாக்குகிறார், அங்கு சுகாதாரம் மற்றும் AI மீது கவனம். Wharton-க்கு முன், இந்தியாவில் நுகர்வோர் தொழில்நுட்பத்தில் தயாரிப்பு மற்றும் செயல்பாடுகளில் பல ஆண்டுகள் பணியாற்றினார்.",
    "team.bio.p2": "Vyana 2005-ல் தமிழ்நாட்டின் திருப்பூரில் தொடங்கியது, இரு பாட்டனார்களும் பதிவுகள், வரலாறு இல்லாமல், ஒரு வாழ்க்கையை விளக்க ஐந்து நிமிடங்கள் மட்டுமே இருந்த மருத்துவமனைகளில் இறந்தனர். பதினைந்து ஆண்டுகள் கழித்து, தந்தை COVID-ல் குடல் கேங்கிரீனை அதே இடைவெளியுடன் தாங்கியதைப் பார்த்தார். Vyana அந்த இரு இரவுகளையும் மாற்றியிருக்கும் அடுக்கு.",
    "team.affiliated": "இணைப்பு",
    "team.aff1": "The Wharton School",
    "team.aff2": "University of Pennsylvania",
    "team.aff3": "ABDM-இணக்கம்",
    "team.advisorNote": "இந்திய டெர்ஷியரி மருத்துவமனைகளின் ஆலோசகர்கள் எங்கள் ரிஸ்க் இன்ஜின் மற்றும் ப்ரீஃபிங் நெறிமுறைகளுக்கு பங்களிக்கின்றனர்.",

    "landing.getAccess": "ஆரம்ப அணுகலைப் பெறுங்கள்",
  },

  te: {
    "nav.story": "కథ",
    "nav.research": "పరిశోధన",
    "nav.how": "ఎలా పని చేస్తుంది",
    "nav.contact": "సంప్రదించండి",
    "nav.try": "ఇప్పుడు Vyana ప్రయత్నించండి",

    "hero.eyebrow": "మీ ఆరోగ్య కథ, ఎల్లప్పుడూ మీతో",
    "hero.h1.l1": "మీ వైద్య",
    "hero.h1.l2": "చరిత్రను మళ్ళీ",
    "hero.h1.l3": "వివరించాల్సిన",
    "hero.h1.again": "అవసరం లేదు.",
    "hero.sub":
      "మీ నివేదికలను అప్‌లోడ్ చేయండి. 30 సెకన్లలో డాక్టర్‌కు సిద్ధంగా ఉన్న సారాంశం పొందండి. పరిస్థితులు, మందులు, ఇటీవలి మార్పులు, ఏ డాక్టర్ అయినా వెంటనే చదవగలిగే ఒక స్క్రీన్.",
    "hero.cta.primary": "మీ మొదటి రికార్డును అప్‌లోడ్ చేయండి",
    "hero.cta.secondary": "నమూనా సారాంశం చూడండి",

    "problem.eyebrow": "సమస్య",
    "problem.title.l1": "ఆరోగ్య సంరక్షణ ఒకే",
    "problem.title.l2": "సాధారణ మార్గంలో విరిగింది.",
    "problem.sub":
      "మీరు కొత్త డాక్టర్‌ను సందర్శించిన ప్రతిసారీ, శూన్యం నుండి ప్రారంభిస్తారు. మీ చరిత్ర ఎవరూ చదవని ఫోల్డర్లలో ఉంటుంది.",
    "problem.stat1.k": "75 పేజీలు",
    "problem.stat1.v": "ఆసుపత్రులు, క్లినిక్‌లు, ల్యాబ్‌లలో చెల్లాచెదురైన నివేదికలు.",
    "problem.stat2.k": "5 నిమిషాలు",
    "problem.stat2.v": "మిమ్మల్ని ముందు చూడని డాక్టర్‌కు జీవితకాల చరిత్రను వివరించడానికి.",
    "problem.stat3.k": "0 సందర్భం",
    "problem.stat3.v": "ప్రతి కొత్త నిపుణుడు ఖాళీ పేజీ నుండి ప్రారంభిస్తాడు.",
    "problem.consequences": "దీని ఫలితం",
    "problem.tag.repeat": "పునరావృత పరీక్షలు",
    "problem.tag.miss": "తప్పిపోయిన నమూనాలు",
    "problem.tag.delay": "ఆలస్యమైన నిర్ధారణలు",
    "problem.closer":
      "ఇది ఉత్పాదకత సమస్య కాదు. ఇది జీవిత సమస్య. అత్యవసర పరిస్థితుల్లో, కుటుంబాలకు సంవత్సరాల చరిత్రను వివరించడానికి నిమిషాలే ఉంటాయి.",

    "voices.eyebrow": "గాత్రాలు",
    "voices.title.l1": "ప్రతి భారతీయ కుటుంబానికి",
    "voices.title.l2": "ఈ కథకు ఒక సంస్కరణ ఉంది.",
    "voices.q1.body":
      "మాకు అన్నీ వివరించడానికి ఐదు నిమిషాలు ఉన్నాయి. ఎక్కడ నుండి ప్రారంభించాలో కూడా తెలియదు.",
    "voices.q1.who": "ఒక కుమార్తె",
    "voices.q1.ctx": "చెన్నై · తన తల్లి చివరి అడ్మిషన్ గురించి",
    "voices.q2.body":
      "ప్రతి కొత్త డాక్టర్ అదే రక్త పరీక్షల కోసం మమ్మల్ని తిరిగి పంపుతాడు. మాకు ఇంత మందమైన ఫైల్ ఉంది.",
    "voices.q2.who": "ఒక కుమారుడు",
    "voices.q2.ctx": "బెంగళూరు · తన మధుమేహ తండ్రిని చూసుకుంటూ",
    "voices.q3.body":
      "నాన్న శస్త్రచికిత్స రాత్రి 2 గంటలకు. నా చేతిలో మూడు ప్రిస్క్రిప్షన్‌లు మరియు మరో నగరం ఆసుపత్రి CT స్కాన్ ఉన్నాయి.",
    "voices.q3.who": "ఒక వ్యవస్థాపకురాలు",
    "voices.q3.ctx": "ఢిల్లీ · Vyana పుట్టిన రాత్రి",

    "wedge.title.l1": "ఇది ఆరోగ్య రికార్డుల యాప్ కాదు.",
    "wedge.title.l2": "ఒక క్లినికల్ మెమరీ సిస్టమ్.",
    "wedge.sub":
      "Vyana కేవలం ఫైళ్లను నిల్వ చేయదు. ఇది నిరంతర ఆరోగ్య గ్రాఫ్‌ను నిర్మిస్తుంది, కాబట్టి డాక్టర్లు మీ పూర్తి కథను సెకన్లలో చూస్తారు.",
    "wedge.p1.title": "కాలక్రమేణా పరిస్థితులను ట్రాక్ చేస్తుంది",
    "wedge.p1.body": "HbA1c, BP, కిడ్నీ ఫంక్షన్, థైరాయిడ్. సంవత్సరాల్లో మెల్లగా వచ్చే సంకేతాలు.",
    "wedge.p2.title": "బిందువులను కలుపుతుంది",
    "wedge.p2.body": "పరీక్షలు, మందులు మరియు లక్షణాలు ఒక నిరంతర గ్రాఫ్‌లో కలుపుతాయి.",
    "wedge.p3.title": "మారినదాన్ని వెల్లడిస్తుంది",
    "wedge.p3.body": "అసాధారణ నమూనాలు అత్యవసర పరిస్థితులుగా మారడానికి ముందే హైలైట్ చేయబడతాయి.",

    "how.eyebrow": "ఎలా పని చేస్తుంది",
    "how.title.l1": "మూడు నిశ్శబ్ద దశలు.",
    "how.title.l2": "జీవితకాల సందర్భం.",
    "how.step": "దశ",
    "how.s1.title": "ఏదైనా అప్‌లోడ్ చేయండి.",
    "how.s1.body":
      "ప్రిస్క్రిప్షన్ ఫోటో తీయండి. PDF పంపండి. డిశ్చార్జ్ సారాంశం ఫార్వర్డ్ చేయండి. చేతిరాత హిందీ, ముద్రిత తమిళం, మసకబారిన బెంగాలీ చదువుతాము.",
    "how.s2.title": "AI అన్నీ సేకరిస్తుంది.",
    "how.s2.body":
      "వైటల్స్, నిర్ధారణలు, మందులు, టైమ్‌లైన్‌లు. ముప్పై మూడు క్లినికల్ సంకేతాలు సంవత్సరాల్లో ప్లాట్ చేయబడతాయి.",
    "how.s3.title": "సిద్ధంగా లోపలకు వెళ్ళండి.",
    "how.s3.body":
      "ఏ డాక్టర్ అయినా ముప్పై సెకన్లలో చదవగలిగే ఒక పేజీ క్లినికల్ సారాంశం. అపాయింట్‌మెంట్‌కు ముందు WhatsApp-లో షేర్ చేయండి.",

    "out.eyebrow": "మీరు తీసుకువెళ్ళేది",
    "out.title.l1": "మీ తదుపరి అపాయింట్‌మెంట్,",
    "out.title.l2": "ఇప్పటికే సిద్ధం.",
    "out.list1": "ఒక స్క్రీన్ వైద్య సారాంశం",
    "out.list2": "కాలక్రమేణా ధోరణులు (BP, HbA1c, eGFR)",
    "out.list3": "మందులు మరియు నిర్ధారణ చరిత్ర",
    "out.list4": "అసాధారణ సంకేతాలు హైలైట్ చేయబడ్డాయి",
    "out.flips.eyebrow": "ఇది మీ కోసం నిజంగా ఏమి చేస్తుంది",
    "out.flip1.stop": "పరీక్షలను పునరావృతం చేయడం ఆపండి",
    "out.flip1.gain": "డబ్బు ఆదా చేయండి",
    "out.flip2.stop": "చరిత్రను ఊహించడం ఆపండి",
    "out.flip2.gain": "మెరుగైన సంరక్షణ",
    "out.flip3.stop": "నివేదికలను కోల్పోవడం ఆపండి",
    "out.flip3.gain": "నియంత్రణలో ఉండండి",

    "trust.eyebrow": "నమ్మకం",
    "trust.title.l1": "మీ రికార్డులు మీవే.",
    "trust.title.l2": "మేము వాటిని ఎప్పుడూ అమ్మము.",
    "trust.sub":
      "Vyana భారతదేశ జాతీయ ఆరోగ్య ప్రమాణాలపై నిర్మించబడింది మరియు బ్యాంకులు ఉపయోగించే అదే ఎన్‌క్రిప్షన్‌తో రక్షించబడింది.",
    "trust.b1.label": "ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్టెడ్",
    "trust.b1.sub": "AES-256",
    "trust.b2.label": "ABDM-అనుకూలం",
    "trust.b2.sub": "భారత జాతీయ ఆరోగ్య స్టాక్",
    "trust.b3.label": "DPDPA 2023",
    "trust.b3.sub": "భారత డేటా చట్టం",
    "trust.b4.label": "మీ డేటా, మీ నియంత్రణ",
    "trust.b4.sub": "ఎప్పుడైనా తొలగించండి",
    "trust.b5.label": "Wharton-లో నిర్మించబడింది",
    "trust.b5.sub": "ఆరోగ్యం & AI పరిశోధన",
    "trust.note":
      "ABDM గురించి: Vyana భారతదేశ ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ ప్రమాణాలను అనుసరిస్తుంది. పూర్తి సర్టిఫికేషన్ ప్రగతిలో ఉంది.",

    "faq.eyebrow": "ప్రశ్నలు",
    "faq.title.l1": "కుటుంబాలు",
    "faq.title.l2": "మాకు మొదట అడిగేవి.",
    "faq.q1.q": "ఇది భారతదేశ జాతీయ ఆరోగ్య వ్యవస్థచే ఆమోదించబడిందా?",
    "faq.q1.a":
      "అవును. Vyana ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ (ABDM) తో అనుగుణంగా నిర్మించబడింది, Apollo, Max మరియు ప్రభుత్వ ఆసుపత్రులు ఉపయోగించే అదే ఫ్రేమ్‌వర్క్.",
    "faq.q2.q": "నా రికార్డులను ఎవరు చూడగలరు?",
    "faq.q2.a":
      "మీరు మాత్రమే. మీరు షేర్ చేసేదానిని, మీరు ఎంచుకున్న సమయం వరకు డాక్టర్లు చూస్తారు. ప్రతి షేర్ 24-గంటల లింక్ సృష్టిస్తుంది. మేము మీ డేటాను ఎప్పుడూ అమ్మము.",
    "faq.q3.q": "Vyana నా భాషలో పని చేస్తుందా?",
    "faq.q3.a":
      "అవును. యాప్ ఇంగ్లీష్, హిందీ, తమిళం, తెలుగు మరియు బెంగాలీ మాట్లాడుతుంది. చేతిరాత నోట్‌లతో సహా మీ ప్రిస్క్రిప్షన్‌లు ఈ లిపులలో చదవబడతాయి.",
    "faq.q4.q": "నా డాక్టర్ సారాంశాన్ని అంగీకరిస్తాడా?",
    "faq.q4.a":
      "ఏ డాక్టర్ అయినా 30 సెకన్లలో చదవగలిగే ప్రామాణిక SOAP ఫార్మాట్‌లో ఒక పేజీ సారాంశాన్ని తయారు చేస్తాము. FHIR ఫైల్‌గా కూడా ఎగుమతి అవుతుంది.",
    "faq.q5.q": "నా ఖాతాను తొలగిస్తే ఏమవుతుంది?",
    "faq.q5.a":
      "అన్నీ పోతాయి. 30 రోజుల్లో ప్రతి రికార్డ్ మా సిస్టమ్‌ల నుండి శాశ్వతంగా తొలగించబడుతుంది.",
    "faq.q6.q": "ఇది ఎంత ఖరీదు?",
    "faq.q6.a":
      "ప్రారంభించడం ఉచితం. ఉచిత ప్లాన్‌లో అపరిమిత రికార్డులను అప్‌లోడ్ చేయవచ్చు. చెల్లింపు ప్లాన్లలో అధునాతన AI ఫీచర్‌లు ఉన్నాయి.",
    "faq.q7.q": "ఇది నిజంగా ఎవరికోసం?",
    "faq.q7.a":
      "దీర్ఘకాలిక పరిస్థితులను నిర్వహించే కుటుంబాలు, వృద్ధ తల్లిదండ్రులను చూసుకునే పిల్లలు, ప్రతి సందర్శనలో చరిత్రను పునరావృతం చేయడంలో అలసిపోయిన రోగులు.",
    "faq.q8.q": "AI వైద్య నిర్ణయాలు తీసుకుంటోందా?",
    "faq.q8.a":
      "లేదు. Vyana క్లినికల్ నిర్ణయ మద్దతు, నిర్ధారణ యంత్రం కాదు. ప్రతి వైద్య నిర్ణయం మీ డాక్టర్‌తో ఉంటుంది.",
    "faq.footer.pre": "ఇంకా ఏదైనా సందేహమా?",
    "faq.footer.link": "మేఘకు నేరుగా రాయండి",

    "cta.title.l1": "మీ కుటుంబ",
    "cta.title.l2": "ఆరోగ్య జ్ఞాపకాన్ని ఈరోజు ప్రారంభించండి.",
    "cta.sub": "ప్రారంభించడం ఉచితం. మీ మొదటి నివేదికను ముప్పై సెకన్లలో అప్‌లోడ్ చేయండి.",
    "cta.email": "మీ ఇమెయిల్ చిరునామా",
    "cta.relation": "మీరు ఎవరిని చూసుకుంటారు",
    "cta.city": "నగరం",
    "cta.button": "ప్రారంభించండి",
    "cta.signoff": "ప్రేమతో,",
    "cta.role": "వ్యవస్థాపకురాలు · Vyana",

    "research.eyebrow": "విజ్ఞానం",
    "research.title.l1": "మీ వైద్యుడు ఇప్పటికే నమ్మే",
    "research.title.l2": "అదే ప్రోటోకాల్‌లపై నిర్మించబడింది.",
    "research.sub": "Vyana-లో ప్రతి ఫ్లాగ్, స్కోర్ మరియు హెచ్చరిక ప్రచురించబడిన క్లినికల్ గైడ్‌లైన్ యొక్క నమ్మకమైన అమలు. ఊహాగానం కాదు.",
    "research.c1.title": "హృదయ ప్రమాదం",
    "research.c1.cite": "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline. Circulation, 129(25_suppl_2).",
    "research.c1.line": "నిజమైన రోగి వైటల్స్‌పై Pooled Cohort ASCVD సమీకరణాలను అమలు చేస్తాము. ఊహాగానం లేదు.",
    "research.c2.title": "డయాబెటిస్ స్టేజింగ్",
    "research.c2.cite": "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    "research.c2.line": "HbA1c పరిమితులు మరియు లక్ష్యాలు ADA 2024 ప్రకారం, ఇది ప్రతి భారతీయ ఎండోక్రినాలజీ ప్రాక్టీస్ ఉపయోగించే ప్రమాణం.",
    "research.c3.title": "మూత్రపిండ పనితీరు",
    "research.c3.cite": "KDIGO. (2024). Clinical Practice Guideline for CKD. Kidney International, 105(4S).",
    "research.c3.line": "eGFR 2021 CKD-EPI race-free సమీకరణం ద్వారా లెక్కించబడుతుంది, KDIGO స్టేజ్ ఫ్లాగ్‌లు ముందుగానే కనిపిస్తాయి.",
    "research.c4.title": "ఔషధ ఇంటరాక్షన్‌లు",
    "research.c4.cite": "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index.",
    "research.c4.line": "ప్రతి మందు ATC కోడ్‌లకు మ్యాప్ చేయబడి ప్రధాన ఇంటరాక్షన్‌ల కోసం తనిఖీ చేయబడుతుంది.",
    "research.builtBy": "వ్యవస్థాపకులు ఇక్కడి నుండి",
    "research.advisors": "క్లినికల్ సలహాదారులు",
    "research.advisors.sub": "AIIMS · Apollo · టర్షియరీ కేర్",
    "research.megha.role": "వ్యవస్థాపకురాలు · CS · మాజీ-FAANG · Wharton MBA",
    "research.megha.bio": "మేఘా Wharton-లో MBA చేస్తున్నారు, ఆరోగ్య సంరక్షణ మరియు అప్లైడ్ AIపై దృష్టి. 2005లో తిరుపూర్‌లో క్లినికల్ చరిత్ర లేకుండా ఇద్దరు తాతామామల్ని కోల్పోయారు. తర్వాత COVID సమయంలో తండ్రి యొక్క పేగు గ్యాంగ్రీన్‌ను అదే అంతరంతో ఎదుర్కొన్నారు. Vyana ఆ రెండు రాత్రులను మార్చగలిగే లేయర్.",
    "research.cab.title": "క్లినికల్ సలహా బోర్డు",
    "research.cab.tag": "నమ్మకం",
    "research.cab.body": "భారతీయ టర్షియరీ ఆసుపత్రుల నుండి అభ్యాసకులైన వైద్యులు మా రిస్క్ ఇంజిన్, బ్రీఫింగ్ ప్రోటోకాల్‌లు మరియు Vyana-లో ప్రతి AI అంతర్దృష్టిని నియంత్రించే భద్రతా నియమాలకు సహకరిస్తారు.",

    "team.eyebrow": "నిర్మించినవారు",
    "team.title.l1": "ఈ సమస్యను",
    "team.title.l2": "జీవించిన వ్యవస్థాపకురాలు.",
    "team.founderTag": "వ్యవస్థాపకురాలు",
    "team.founderName": "మేఘా బైద్",
    "team.founderSub": "Wharton MBA · ఆరోగ్యం & AI",
    "team.bio.p1": "మేఘా Wharton నుండి Vyana-ను నిర్మిస్తున్నారు, అక్కడ ఆరోగ్యం మరియు అప్లైడ్ AIపై దృష్టి. Wharton ముందు, భారతదేశంలో కన్స్యూమర్ టెక్నాలజీలో ప్రొడక్ట్ మరియు ఆపరేషన్స్‌లో ఏళ్లు గడిపారు.",
    "team.bio.p2": "Vyana 2005లో తమిళనాడులోని తిరుపూర్‌లో మొదలైంది, రికార్డులు, చరిత్ర లేకుండా, ఒక జీవితాన్ని వివరించడానికి ఐదు నిమిషాలు మాత్రమే ఉన్న ఆసుపత్రులకు చేరిన మెడికల్ ఎమర్జెన్సీలలో ఇద్దరు తాతామామల్ని కోల్పోయారు. పదిహేను సంవత్సరాల తర్వాత, COVID సమయంలో తండ్రి పేగు గ్యాంగ్రీన్ నుండి అదే అంతరంతో బయటపడడాన్ని చూశారు. Vyana ఆ రెండు రాత్రులను మార్చగలిగే లేయర్.",
    "team.affiliated": "అనుబంధం",
    "team.aff1": "The Wharton School",
    "team.aff2": "University of Pennsylvania",
    "team.aff3": "ABDM-సరిపోలిన",
    "team.advisorNote": "భారతీయ టర్షియరీ ఆసుపత్రుల నుండి క్లినికల్ సలహాదారులు మా రిస్క్ ఇంజిన్ మరియు బ్రీఫింగ్ ప్రోటోకాల్‌లకు సహకరిస్తారు.",

    "landing.getAccess": "ముందస్తు యాక్సెస్ పొందండి",
  },

  bn: {
    "nav.story": "গল্প",
    "nav.research": "গবেষণা",
    "nav.how": "কীভাবে কাজ করে",
    "nav.contact": "যোগাযোগ",
    "nav.try": "এখনই Vyana চেষ্টা করুন",

    "hero.eyebrow": "আপনার স্বাস্থ্য কাহিনি, সর্বদা আপনার সাথে",
    "hero.h1.l1": "আপনার চিকিৎসা",
    "hero.h1.l2": "ইতিহাস কখনো",
    "hero.h1.l3": "আবার ব্যাখ্যা",
    "hero.h1.again": "করবেন না।",
    "hero.sub":
      "আপনার রিপোর্ট আপলোড করুন। 30 সেকেন্ডে ডাক্তারের জন্য প্রস্তুত সারাংশ পান। অবস্থা, ওষুধ, সাম্প্রতিক পরিবর্তন, একটি স্ক্রিন যা যেকোনো ডাক্তার তৎক্ষণাৎ পড়তে পারেন।",
    "hero.cta.primary": "আপনার প্রথম রেকর্ড আপলোড করুন",
    "hero.cta.secondary": "একটি নমুনা সারাংশ দেখুন",

    "problem.eyebrow": "সমস্যা",
    "problem.title.l1": "স্বাস্থ্যসেবা একটি",
    "problem.title.l2": "সহজ উপায়ে ভেঙে গেছে।",
    "problem.sub":
      "প্রতিবার নতুন ডাক্তারের কাছে গেলে, আপনি শূন্য থেকে শুরু করেন। আপনার ইতিহাস ফাইলে পড়ে থাকে যা কেউ পড়ে না।",
    "problem.stat1.k": "75 পৃষ্ঠা",
    "problem.stat1.v": "হাসপাতাল, ক্লিনিক ও ল্যাবে ছড়িয়ে থাকা রিপোর্ট।",
    "problem.stat2.k": "5 মিনিট",
    "problem.stat2.v": "যিনি আপনাকে আগে কখনো দেখেননি এমন ডাক্তারকে জীবনকালের ইতিহাস ব্যাখ্যা করতে।",
    "problem.stat3.k": "0 প্রসঙ্গ",
    "problem.stat3.v": "প্রতিটি নতুন বিশেষজ্ঞ একটি ফাঁকা পৃষ্ঠা থেকে শুরু করেন।",
    "problem.consequences": "এর ফলাফল",
    "problem.tag.repeat": "পুনরাবৃত্ত পরীক্ষা",
    "problem.tag.miss": "মিস করা প্যাটার্ন",
    "problem.tag.delay": "দেরি হওয়া রোগ নির্ণয়",
    "problem.closer":
      "এটি উৎপাদনশীলতার সমস্যা নয়। এটি জীবনের সমস্যা। জরুরি অবস্থায়, পরিবারের কাছে বছরের ইতিহাস ব্যাখ্যা করার জন্য মিনিট থাকে, এবং রোগী মূল্য দেন।",

    "voices.eyebrow": "কণ্ঠস্বর",
    "voices.title.l1": "প্রতিটি ভারতীয় পরিবারের",
    "voices.title.l2": "এই গল্পের একটি সংস্করণ আছে।",
    "voices.q1.body":
      "সব কিছু ব্যাখ্যা করতে আমাদের পাঁচ মিনিট ছিল। কোথা থেকে শুরু করব তাও জানতাম না।",
    "voices.q1.who": "এক কন্যা",
    "voices.q1.ctx": "চেন্নাই · তার মায়ের শেষ ভর্তি সম্পর্কে",
    "voices.q2.body":
      "প্রতিটি নতুন ডাক্তার একই রক্ত পরীক্ষার জন্য আমাদের ফেরত পাঠায়। আমাদের কাছে এত মোটা ফাইল আছে।",
    "voices.q2.who": "এক ছেলে",
    "voices.q2.ctx": "বেঙ্গালুরু · তার ডায়াবেটিক বাবার যত্ন নিয়ে",
    "voices.q3.body":
      "বাবার অস্ত্রোপচার রাত 2টায়। আমার হাতে তিনটি প্রেসক্রিপশন এবং অন্য শহরের হাসপাতালের একটি CT স্ক্যান ছিল।",
    "voices.q3.who": "এক প্রতিষ্ঠাতা",
    "voices.q3.ctx": "দিল্লি · যে রাতে Vyana জন্ম নিয়েছিল",

    "wedge.title.l1": "এটি স্বাস্থ্য রেকর্ড অ্যাপ নয়।",
    "wedge.title.l2": "এটি একটি ক্লিনিকাল মেমরি সিস্টেম।",
    "wedge.sub":
      "Vyana শুধু ফাইল সংরক্ষণ করে না। এটি একটি ক্রমাগত স্বাস্থ্য গ্রাফ তৈরি করে, যাতে ডাক্তাররা আপনার পুরো গল্প সেকেন্ডে দেখেন।",
    "wedge.p1.title": "সময়ের সাথে অবস্থা ট্র্যাক করে",
    "wedge.p1.body": "HbA1c, BP, কিডনি ফাংশন, থাইরয়েড। ধীর সংকেত বছরের পর বছর প্লট করা।",
    "wedge.p2.title": "বিন্দুগুলি সংযুক্ত করে",
    "wedge.p2.body": "পরীক্ষা, ওষুধ এবং উপসর্গ একটি ক্রমাগত গ্রাফে সংযুক্ত।",
    "wedge.p3.title": "যা পরিবর্তিত হয়েছে তা প্রকাশ করে",
    "wedge.p3.body": "অস্বাভাবিক প্যাটার্ন জরুরি অবস্থা হওয়ার আগেই হাইলাইট হয়।",

    "how.eyebrow": "কীভাবে কাজ করে",
    "how.title.l1": "তিনটি শান্ত পদক্ষেপ।",
    "how.title.l2": "জীবনকালের প্রসঙ্গ।",
    "how.step": "ধাপ",
    "how.s1.title": "যে কোনো কিছু আপলোড করুন।",
    "how.s1.body":
      "একটি প্রেসক্রিপশনের ছবি তুলুন। PDF পাঠান। ডিসচার্জ সারাংশ ফরওয়ার্ড করুন। আমরা হাতে লেখা হিন্দি, মুদ্রিত তামিল, ঝাপসা বাংলা পড়ি।",
    "how.s2.title": "AI সব কিছু বের করে।",
    "how.s2.body":
      "ভাইটাল, রোগ নির্ণয়, ওষুধ, টাইমলাইন। তেত্রিশটি ক্লিনিকাল সংকেত বছরের পর বছর প্লট করা।",
    "how.s3.title": "প্রস্তুত হয়ে ভিতরে যান।",
    "how.s3.body":
      "এক পৃষ্ঠার ক্লিনিকাল ব্রিফিং যা যেকোনো ডাক্তার ত্রিশ সেকেন্ডে পড়তে পারেন। অ্যাপয়েন্টমেন্টের আগে WhatsApp-এ শেয়ার করুন।",

    "out.eyebrow": "আপনি যা নিয়ে যান",
    "out.title.l1": "আপনার পরবর্তী অ্যাপয়েন্টমেন্ট,",
    "out.title.l2": "ইতিমধ্যেই প্রস্তুত।",
    "out.list1": "এক স্ক্রিন চিকিৎসা সারাংশ",
    "out.list2": "সময়ের সাথে প্রবণতা (BP, HbA1c, eGFR)",
    "out.list3": "ওষুধ এবং রোগ নির্ণয়ের ইতিহাস",
    "out.list4": "অস্বাভাবিক সংকেত হাইলাইট",
    "out.flips.eyebrow": "এটি আসলে আপনার জন্য কী করে",
    "out.flip1.stop": "পরীক্ষা পুনরাবৃত্তি বন্ধ করুন",
    "out.flip1.gain": "টাকা সাশ্রয় করুন",
    "out.flip2.stop": "ইতিহাস অনুমান করা বন্ধ করুন",
    "out.flip2.gain": "ভাল যত্ন",
    "out.flip3.stop": "রিপোর্ট হারানো বন্ধ করুন",
    "out.flip3.gain": "নিয়ন্ত্রণে থাকুন",

    "trust.eyebrow": "বিশ্বাস",
    "trust.title.l1": "আপনার রেকর্ড আপনার।",
    "trust.title.l2": "আমরা সেগুলি কখনো বিক্রি করি না।",
    "trust.sub":
      "Vyana ভারতের জাতীয় স্বাস্থ্য মান অনুসারে নির্মিত এবং ব্যাংক যে এনক্রিপশন ব্যবহার করে তা দ্বারা সুরক্ষিত।",
    "trust.b1.label": "এন্ড-টু-এন্ড এনক্রিপ্টেড",
    "trust.b1.sub": "AES-256",
    "trust.b2.label": "ABDM-সংগত",
    "trust.b2.sub": "ভারতের জাতীয় স্বাস্থ্য স্ট্যাক",
    "trust.b3.label": "DPDPA 2023",
    "trust.b3.sub": "ভারতীয় ডেটা আইন",
    "trust.b4.label": "আপনার ডেটা, আপনার নিয়ন্ত্রণ",
    "trust.b4.sub": "যে কোনো সময় মুছুন",
    "trust.b5.label": "Wharton-এ নির্মিত",
    "trust.b5.sub": "স্বাস্থ্যসেবা ও AI গবেষণা",
    "trust.note":
      "ABDM সম্পর্কে: Vyana ভারতের আয়ুষ্মান ভারত ডিজিটাল মিশন মান অনুসরণ করে। সম্পূর্ণ সার্টিফিকেশন প্রক্রিয়াধীন।",

    "faq.eyebrow": "প্রশ্ন",
    "faq.title.l1": "পরিবারগুলি",
    "faq.title.l2": "আমাদের প্রথমে যা জিজ্ঞাসা করে।",
    "faq.q1.q": "এটি কি ভারতের জাতীয় স্বাস্থ্য ব্যবস্থা দ্বারা অনুমোদিত?",
    "faq.q1.a":
      "হ্যাঁ। Vyana আয়ুষ্মান ভারত ডিজিটাল মিশন (ABDM)-এর সাথে সঙ্গতিপূর্ণভাবে নির্মিত, একই ফ্রেমওয়ার্ক যা Apollo, Max এবং সরকারি হাসপাতাল ব্যবহার করে।",
    "faq.q2.q": "আমার রেকর্ড কে দেখতে পারে?",
    "faq.q2.a":
      "শুধু আপনি। আপনি যা শেয়ার করেন, যতক্ষণ চান ডাক্তাররা ততক্ষণ দেখেন। প্রতিটি শেয়ার 24-ঘণ্টার লিঙ্ক তৈরি করে। আমরা আপনার ডেটা কখনো বিক্রি করি না।",
    "faq.q3.q": "Vyana কি আমার ভাষায় কাজ করে?",
    "faq.q3.a":
      "হ্যাঁ। অ্যাপটি ইংরেজি, হিন্দি, তামিল, তেলুগু এবং বাংলা বলে। হাতে লেখা নোট সহ এই সব লিপিতে আপনার প্রেসক্রিপশন পড়া হয়।",
    "faq.q4.q": "আমার ডাক্তার কি ব্রিফিং গ্রহণ করবে?",
    "faq.q4.a":
      "যেকোনো ডাক্তার 30 সেকেন্ডে পড়তে পারেন এমন স্ট্যান্ডার্ড SOAP ফরম্যাটে এক পৃষ্ঠার সারাংশ তৈরি করি। FHIR ফাইল হিসাবেও এক্সপোর্ট হয়।",
    "faq.q5.q": "আমি যদি অ্যাকাউন্ট মুছে ফেলি?",
    "faq.q5.a":
      "সব চলে যায়। 30 দিনের মধ্যে প্রতিটি রেকর্ড আমাদের সিস্টেম থেকে স্থায়ীভাবে মুছে ফেলা হয়।",
    "faq.q6.q": "এটির খরচ কত?",
    "faq.q6.a":
      "শুরু করা বিনামূল্যে। ফ্রি প্ল্যানে অসীমিত রেকর্ড আপলোড করতে পারেন। পেইড প্ল্যানে উন্নত AI বৈশিষ্ট্য রয়েছে।",
    "faq.q7.q": "এটি আসলে কাদের জন্য?",
    "faq.q7.a":
      "দীর্ঘস্থায়ী রোগ পরিচালনাকারী পরিবার, বয়স্ক বাবা-মায়ের যত্ন নেওয়া সন্তান, প্রতিটি পরিদর্শনে ইতিহাস পুনরাবৃত্তি করতে ক্লান্ত রোগী।",
    "faq.q8.q": "AI কি চিকিৎসা সিদ্ধান্ত নিচ্ছে?",
    "faq.q8.a":
      "না। Vyana ক্লিনিকাল সিদ্ধান্ত সমর্থন, রোগ নির্ণয় ইঞ্জিন নয়। প্রতিটি চিকিৎসা সিদ্ধান্ত আপনার ডাক্তারের কাছেই থাকে।",
    "faq.footer.pre": "এখনও কিছু জিজ্ঞাসা করার আছে?",
    "faq.footer.link": "মেঘাকে সরাসরি লিখুন",

    "cta.title.l1": "আপনার পরিবারের",
    "cta.title.l2": "স্বাস্থ্য স্মৃতি আজই শুরু করুন।",
    "cta.sub": "শুরু করা বিনামূল্যে। আপনার প্রথম রিপোর্ট ত্রিশ সেকেন্ডে আপলোড করুন।",
    "cta.email": "আপনার ইমেল ঠিকানা",
    "cta.relation": "আপনি কার যত্ন নেন",
    "cta.city": "শহর",
    "cta.button": "শুরু করুন",
    "cta.signoff": "ভালোবাসা সহ,",
    "cta.role": "প্রতিষ্ঠাতা · Vyana",

    "research.eyebrow": "বিজ্ঞান",
    "research.title.l1": "আপনার ডাক্তার ইতিমধ্যে যেসব প্রোটোকল",
    "research.title.l2": "বিশ্বাস করেন তার উপর তৈরি।",
    "research.sub": "Vyana-তে প্রতিটি ফ্ল্যাগ, স্কোর এবং সতর্কতা প্রকাশিত ক্লিনিক্যাল গাইডলাইনের একটি বিশ্বস্ত বাস্তবায়ন। কোনো জেনারেটিভ অনুমান নয়।",
    "research.c1.title": "হৃদরোগের ঝুঁকি",
    "research.c1.cite": "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline. Circulation, 129(25_suppl_2).",
    "research.c1.line": "আমরা প্রকৃত রোগীর ভাইটালে Pooled Cohort ASCVD সমীকরণ প্রয়োগ করি। কখনো অনুমান নয়।",
    "research.c2.title": "ডায়াবেটিস স্টেজিং",
    "research.c2.cite": "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    "research.c2.line": "HbA1c সীমা এবং লক্ষ্য ADA 2024 অনুসরণ করে, যা প্রতিটি ভারতীয় এন্ডোক্রিনোলজি অনুশীলন ব্যবহার করে।",
    "research.c3.title": "কিডনি ফাংশন",
    "research.c3.cite": "KDIGO. (2024). Clinical Practice Guideline for CKD. Kidney International, 105(4S).",
    "research.c3.line": "eGFR 2021 CKD-EPI race-free সমীকরণ দ্বারা গণনা করা হয়, KDIGO স্টেজ ফ্ল্যাগ আগেই দেখানো হয়।",
    "research.c4.title": "ড্রাগ ইন্টারঅ্যাকশন",
    "research.c4.cite": "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index.",
    "research.c4.line": "প্রতিটি ওষুধ ATC কোডে ম্যাপ করা হয় এবং বড় ইন্টারঅ্যাকশনের জন্য ক্রস-চেক করা হয়।",
    "research.builtBy": "প্রতিষ্ঠাতারা এখান থেকে",
    "research.advisors": "ক্লিনিক্যাল উপদেষ্টা",
    "research.advisors.sub": "AIIMS · Apollo · টার্শিয়ারি কেয়ার",
    "research.megha.role": "প্রতিষ্ঠাতা · CS · প্রাক্তন-FAANG · Wharton MBA",
    "research.megha.bio": "মেঘা Wharton-এ MBA করছেন, স্বাস্থ্যসেবা ও প্রয়োগিক AI-তে মনোনিবেশ। ২০০৫ সালে তিরুপুরে কোনো ক্লিনিক্যাল ইতিহাস ছাড়াই দু'জন দাদা-দিদাকে হারান। পরে COVID-এ বাবার অন্ত্রের গ্যাংগ্রিন একই ফাঁকের সাথে মোকাবিলা করেন। Vyana সেই দুটি রাতকে বদলে দিতে পারত এমন স্তর।",
    "research.cab.title": "ক্লিনিক্যাল উপদেষ্টা বোর্ড",
    "research.cab.tag": "বিশ্বাস",
    "research.cab.body": "ভারতীয় টার্শিয়ারি হাসপাতালের অনুশীলনকারী চিকিৎসকরা আমাদের রিস্ক ইঞ্জিন, ব্রিফিং প্রোটোকল এবং Vyana-র প্রতিটি AI অন্তর্দৃষ্টিকে নিয়ন্ত্রণকারী নিরাপত্তা নিয়মে অবদান রাখেন।",

    "team.eyebrow": "নির্মাতা",
    "team.title.l1": "একজন প্রতিষ্ঠাতা যিনি",
    "team.title.l2": "এই সমস্যা যাপন করেছেন।",
    "team.founderTag": "প্রতিষ্ঠাতা",
    "team.founderName": "মেঘা বাইদ",
    "team.founderSub": "Wharton MBA · স্বাস্থ্যসেবা ও AI",
    "team.bio.p1": "মেঘা Wharton থেকে Vyana তৈরি করছেন, যেখানে তিনি স্বাস্থ্যসেবা ও প্রয়োগিক AI-তে মনোনিবেশ করেন। Wharton-এর আগে, তিনি ভারতে কনজিউমার টেকনোলজির প্রোডাক্ট ও অপারেশনে বছর কাটিয়েছেন।",
    "team.bio.p2": "Vyana শুরু হয়েছিল ২০০৫ সালে তামিলনাড়ুর তিরুপুরে, যখন তিনি দু'জন দাদা-দিদাকে হারান, যাঁরা রেকর্ড, ইতিহাস ছাড়া এবং একটি জীবন ব্যাখ্যা করার মাত্র পাঁচ মিনিট নিয়ে হাসপাতালে পৌঁছেছিলেন। পনেরো বছর পরে, তিনি দেখেছেন বাবা COVID-এ একই ফাঁকের সাথে অন্ত্রের গ্যাংগ্রিন থেকে বেঁচেছেন। Vyana সেই দুটি রাতকে বদলে দিতে পারত এমন স্তর।",
    "team.affiliated": "অনুমোদিত",
    "team.aff1": "The Wharton School",
    "team.aff2": "University of Pennsylvania",
    "team.aff3": "ABDM-সঙ্গতিপূর্ণ",
    "team.advisorNote": "ভারতীয় টার্শিয়ারি হাসপাতালের ক্লিনিক্যাল উপদেষ্টারা আমাদের রিস্ক ইঞ্জিন ও ব্রিফিং প্রোটোকলে অবদান রাখেন।",

    "landing.getAccess": "আর্লি অ্যাক্সেস পান",
  },
};

// Synchronous fetch using current localStorage value (kept for legacy callers)
export function tLanding(key: string): string {
  const lang = getLanguage();
  return landingTranslations[lang]?.[key] || landingTranslations.en[key] || key;
}

// React hook that re-renders on language change. Prefer this in components.
export function useLandingT() {
  const [lang, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    const handler = (e: Event) => setLang((e as CustomEvent).detail);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (key: string) =>
    landingTranslations[lang]?.[key] || landingTranslations.en[key] || key;
}

export default landingTranslations;
