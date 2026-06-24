import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LAST_UPDATED = "13 April 2026";
const COMPANY = "Vyana Health Technologies";
const APP_NAME = "Vyana";
const SUPPORT_EMAIL = "support@vyana.health";

export const LegalContent = ({
  defaultSection = "terms",
}: {
  defaultSection?: "terms" | "privacy";
}) => (
  <Tabs defaultValue={defaultSection}>
    <TabsList className="grid w-full grid-cols-2 mb-4">
      <TabsTrigger value="terms">Terms of Service</TabsTrigger>
      <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
    </TabsList>

    <TabsContent value="terms">
      <article className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-foreground">
        <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <h2 className="text-xl font-bold">Terms of Service</h2>

        <p>
          Welcome to {APP_NAME}, a product of {COMPANY}. By accessing or using {APP_NAME} (the "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
        </p>

        <h3 className="text-lg font-semibold">1. Nature of Service</h3>
        <p>
          {APP_NAME} is a <strong>clinical decision support and health record management tool</strong>. The App helps you organize health records, track vitals, manage medications, and generate shareable health summaries for your healthcare providers.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Important Disclaimer</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {APP_NAME} does <strong>NOT</strong> provide medical advice, diagnosis, or treatment. All AI-generated insights, risk indicators, and health summaries are for informational purposes only. Always consult a qualified healthcare professional for medical decisions.
          </p>
        </div>

        <h3 className="text-lg font-semibold">2. Eligibility</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must be at least 18 years of age to use the App independently.</li>
          <li>Minors (under 18) may use the App only under the supervision of a parent or legal guardian who accepts these Terms on their behalf.</li>
          <li>By registering, you represent that all information you provide is accurate and complete.</li>
        </ul>

        <h3 className="text-lg font-semibold">3. User Accounts & Identifiers</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your mobile number serves as a primary unique identifier.</li>
          <li>If you have an ABHA Health ID (Ayushman Bharat Health Account), it serves as an additional unique identifier linked to India's national digital health ecosystem.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>One account per mobile number and per ABHA Health ID is enforced.</li>
        </ul>

        <h3 className="text-lg font-semibold">4. Acceptable Use</h3>
        <p>You agree NOT to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload false, misleading, or fabricated health records</li>
          <li>Attempt to access another person's health data without authorization</li>
          <li>Use the App for any illegal purpose</li>
          <li>Reverse-engineer, decompile, or tamper with the App's functionality</li>
          <li>Use automated scripts or bots to access the service</li>
        </ul>

        <h3 className="text-lg font-semibold">5. Health Data & AI-Generated Content</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>AI-generated summaries, risk scores (e.g., ASCVD, eGFR, HbA1c staging), and medication tracking are based on standard medical reference ranges and publicly available clinical guidelines.</li>
          <li>These outputs may contain errors, may not account for your complete medical history, and should <strong>never</strong> replace professional medical judgment.</li>
          <li>{COMPANY} is not liable for any adverse outcomes resulting from reliance on AI-generated content.</li>
        </ul>

        <h3 className="text-lg font-semibold">6. Sharing & Consent</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>You control who can access your health data.</li>
          <li>Shareable links are time-limited (default 24 hours) and can be revoked.</li>
          <li>When you share data via WhatsApp or other channels, you acknowledge that the security of the data in transit depends on the third-party platform.</li>
        </ul>

        <h3 className="text-lg font-semibold">7. Limitation of Liability</h3>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{COMPANY}, its directors, employees, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of the App.</li>
          <li>This includes but is not limited to: misdiagnosis, delayed treatment, medication errors, or any medical decisions made based on information displayed in the App.</li>
          <li>The App is provided "AS IS" without warranties of any kind, express or implied.</li>
        </ul>

        <h3 className="text-lg font-semibold">8. Indemnification</h3>
        <p>
          You agree to indemnify and hold harmless {COMPANY} from any claims, damages, losses, or expenses (including legal fees) arising from your use of the App, violation of these Terms, or infringement of any rights of another person.
        </p>

        <h3 className="text-lg font-semibold">9. Governing Law & Jurisdiction</h3>
        <p>
          These Terms are governed by the laws of <strong>India</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts in <strong>Bengaluru, Karnataka, India</strong>.
        </p>

        <h3 className="text-lg font-semibold">10. Changes to Terms</h3>
        <p>
          {COMPANY} reserves the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the updated Terms. We will notify you of material changes via the App or email.
        </p>

        <h3 className="text-lg font-semibold">11. Contact</h3>
        <p>
          For questions about these Terms, contact us at:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </article>
    </TabsContent>

    <TabsContent value="privacy">
      <article className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-foreground">
        <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <h2 className="text-xl font-bold">Privacy Policy</h2>

        <p>
          This Privacy Policy describes how {COMPANY} ("{APP_NAME}", "we", "us") collects, uses, stores, and protects your personal and health information when you use the {APP_NAME} application.
        </p>

        <h3 className="text-lg font-semibold">1. Applicability & Regulatory Framework</h3>
        <p>This policy is designed in accordance with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>, India's primary data protection legislation governing digital personal data.</li>
          <li><strong>Information Technology Act, 2000</strong> and <strong>IT (Reasonable Security Practices and Procedures) Rules, 2011</strong>, classifying health data as "Sensitive Personal Data or Information" (SPDI) requiring heightened protection.</li>
          <li><strong>Digital Information Security in Healthcare Act (DISHA)</strong> (proposed), anticipated legislation for electronic health data. We proactively adopt DISHA-aligned practices.</li>
          <li><strong>Ayushman Bharat Digital Mission (ABDM)</strong>, for ABHA Health ID integration and health data interoperability standards.</li>
          <li><strong>HIPAA (reference standard)</strong>, while not legally binding in India, we adopt HIPAA-aligned security practices as a best-practice benchmark for health data protection.</li>
        </ul>

        <h3 className="text-lg font-semibold">2. Data We Collect</h3>

        <h4 className="text-base font-medium">2.1 Personal Identifiers</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full name, date of birth, age, weight</li>
          <li>Mobile number (primary unique identifier)</li>
          <li>Email address</li>
          <li>ABHA Health ID (14-digit national identifier, optional)</li>
          <li>Location data (city, pincode, if provided)</li>
        </ul>

        <h4 className="text-base font-medium">2.2 Health Information (Sensitive Personal Data)</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Uploaded health records (lab reports, prescriptions, discharge summaries)</li>
          <li>AI-generated summaries of health documents</li>
          <li>Vital signs history (blood pressure, glucose, cholesterol, HbA1c, TSH, creatinine, etc.)</li>
          <li>Medication reminders and dosage information</li>
          <li>Consultation records and clinical briefings</li>
          <li>Vaccination records</li>
        </ul>

        <h4 className="text-base font-medium">2.3 Technical Data</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Device information, browser type, IP address</li>
          <li>Usage analytics (features accessed, session duration)</li>
          <li>Authentication logs and access timestamps</li>
        </ul>

        <h3 className="text-lg font-semibold">3. Purpose of Data Collection</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Health record management:</strong> Storing, organizing, and retrieving your health documents</li>
          <li><strong>Clinical decision support:</strong> Generating health indicators, risk scores, and trend analysis based on standard clinical reference ranges</li>
          <li><strong>Medication tracking:</strong> Reminders and adherence monitoring</li>
          <li><strong>Health sharing:</strong> Generating time-limited shareable links for healthcare providers</li>
          <li><strong>Emergency access:</strong> Providing designated emergency contacts access to critical health data</li>
          <li><strong>Service improvement:</strong> Anonymous, aggregated analytics to improve features</li>
        </ul>

        <h3 className="text-lg font-semibold">4. Legal Basis for Processing</h3>
        <p>Under DPDPA 2023, we process your data based on:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Consent:</strong> You explicitly consent to data collection and processing during registration.</li>
          <li><strong>Legitimate use:</strong> Processing necessary to provide the services you requested.</li>
          <li><strong>Vital interests:</strong> Emergency access features that may be necessary to protect life.</li>
        </ul>

        <h3 className="text-lg font-semibold">5. Data Storage & Security</h3>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-semibold">Security Measures (HIPAA-aligned)</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Encryption at rest:</strong> All health data is encrypted using AES-256 equivalent encryption</li>
            <li><strong>Encryption in transit:</strong> All data transmission uses TLS 1.2 or higher</li>
            <li><strong>Access controls:</strong> Row-level security ensures users can only access their own data</li>
            <li><strong>Authentication:</strong> Multi-factor authentication support (email, phone OTP, Google OAuth)</li>
            <li><strong>Audit logging:</strong> Access to sensitive health data is logged (e.g., emergency access logs)</li>
            <li><strong>Health ID masking:</strong> ABHA Health IDs are partially masked in the UI (only last 4 digits shown)</li>
            <li><strong>Time-limited sharing:</strong> Shared health record links expire after 24 hours by default</li>
          </ul>
        </div>

        <h3 className="text-lg font-semibold">6. Data Sharing & Disclosure</h3>
        <p>
          We do <strong>NOT</strong> sell, rent, or trade your personal or health data. Your data may be shared only in these circumstances:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>With your explicit consent:</strong> When you generate a shareable link or grant access to a doctor or emergency contact</li>
          <li><strong>Legal compliance:</strong> If required by Indian law, court order, or government authority under the IT Act or DPDPA</li>
          <li><strong>Service providers:</strong> Trusted infrastructure providers who process data on our behalf under strict contractual obligations (e.g., cloud hosting, AI processing)</li>
          <li><strong>Emergency situations:</strong> To designated emergency contacts when the emergency access feature is activated</li>
        </ul>

        <h3 className="text-lg font-semibold">7. AI Processing & Third-Party Models</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>AI-powered features (health summaries, risk scores, prescription interpretation) may use third-party AI models.</li>
          <li>Data sent to AI models is processed in real-time and is <strong>not retained</strong> by the AI provider for training purposes.</li>
          <li>AI outputs are clearly labeled as informational and not medical advice.</li>
        </ul>

        <h3 className="text-lg font-semibold">8. Your Rights (under DPDPA 2023)</h3>
        <p>As a "Data Principal" under DPDPA, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Erasure:</strong> Request deletion of your account and all associated data</li>
          <li><strong>Withdraw consent:</strong> Withdraw your consent at any time (this may limit App functionality)</li>
          <li><strong>Grievance redressal:</strong> File complaints regarding data handling</li>
          <li><strong>Nomination:</strong> Nominate another person to exercise your rights in case of death or incapacity</li>
        </ul>

        <h3 className="text-lg font-semibold">9. Data Retention</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your data is retained as long as your account is active.</li>
          <li>Upon account deletion request, all personal and health data will be permanently deleted within <strong>30 days</strong>.</li>
          <li>Anonymized, aggregated data may be retained for service improvement.</li>
          <li>Legal holds or regulatory requirements may extend retention periods.</li>
        </ul>

        <h3 className="text-lg font-semibold">10. Children's Privacy</h3>
        <p>
          We do not knowingly collect personal data from children under 18 without verifiable parental consent. If you believe a child has provided data without consent, contact us immediately.
        </p>

        <h3 className="text-lg font-semibold">11. Cross-Border Data Transfer</h3>
        <p>
          Your data may be processed on servers located outside India. In such cases, we ensure equivalent data protection standards through contractual safeguards, in compliance with DPDPA provisions on cross-border data transfer.
        </p>

        <h3 className="text-lg font-semibold">12. Breach Notification</h3>
        <p>In the event of a data breach affecting your personal data, we will:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Notify the <strong>Data Protection Board of India</strong> as required by DPDPA</li>
          <li>Notify affected users within <strong>72 hours</strong> of becoming aware of the breach</li>
          <li>Provide details of the breach, data affected, and remedial actions taken</li>
        </ul>

        <h3 className="text-lg font-semibold">13. Grievance Officer</h3>
        <p>In accordance with IT Rules 2011 and DPDPA 2023, our Grievance Officer can be contacted at:</p>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm">
            <strong>Email:</strong>{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-sm mt-1"><strong>Response time:</strong> Within 30 days of receipt of complaint</p>
        </div>

        <h3 className="text-lg font-semibold">14. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy periodically. Material changes will be communicated via the App or email. Continued use after changes constitutes acceptance.
        </p>

        <h3 className="text-lg font-semibold">15. Governing Law</h3>
        <p>
          This Privacy Policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023, and the Information Technology Act, 2000.
        </p>
      </article>
    </TabsContent>
  </Tabs>
);
