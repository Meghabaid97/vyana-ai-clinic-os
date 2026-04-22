import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useReveal } from "@/hooks/use-reveal";

const faqs = [
  {
    q: "Is this approved by India's national health system?",
    a: "Yes. Vyana is built to align with the Ayushman Bharat Digital Mission (ABDM), the same framework Apollo, Max, and government hospitals use. Your records can travel across any ABDM-connected clinic in India.",
  },
  {
    q: "Who can actually see my records?",
    a: "Only you. Doctors see what you choose to share, for as long as you choose. Every share creates a 24-hour link that expires automatically. We never sell your data, never share it with insurers, and never use it to train public AI models.",
  },
  {
    q: "Does Vyana work in my language?",
    a: "Yes. The app speaks English, Hindi, Tamil, Telugu, and Bengali. Your prescriptions are read in any of these scripts, including handwritten notes. More languages are added based on family requests.",
  },
  {
    q: "Will my doctor actually accept the briefing?",
    a: "We generate a clean, one-page clinical summary in standard SOAP format that any doctor can read in 30 seconds. It also exports as a structured FHIR file, the global standard hospitals already use. No new app for the doctor to download.",
  },
  {
    q: "What if I delete my account?",
    a: "Everything goes. Within 30 days every record, vital, prescription, and note is permanently erased from our systems. You can also export all your data as a single download before you leave.",
  },
  {
    q: "How much does this cost?",
    a: "Free to start. You can upload, organize, and share unlimited records on the free plan. Paid plans add advanced AI features like longitudinal trend analysis and faster support.",
  },
  {
    q: "Who is this really for?",
    a: "Families managing chronic conditions, adult children caring for elderly parents, anyone juggling specialists across cities, and patients tired of repeating their history every visit. If you've ever lost a prescription, this is for you.",
  },
  {
    q: "Is the AI making medical decisions?",
    a: "No. Vyana is clinical decision support, not a diagnosis engine. We surface patterns, flag drug interactions, and prepare your history for the doctor. Every medical decision stays with your doctor, where it belongs.",
  },
];

const FAQSection = () => {
  const header = useReveal<HTMLDivElement>();
  const list = useReveal<HTMLDivElement>();

  return (
    <section id="faq" className="py-28 lg:py-36 bg-background">
      <div className="max-w-[900px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`mb-14 transition-all duration-700 ${
            header.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-5">
            VI &nbsp;·&nbsp; Questions
          </p>
          <h2 className="font-serif text-[36px] sm:text-[52px] lg:text-[60px] leading-[1.04] tracking-[-0.02em] text-foreground">
            Things families
            <br />
            <em className="italic text-primary font-normal">ask us first.</em>
          </h2>
        </div>

        <div
          ref={list.ref}
          className={`transition-all duration-700 delay-150 ${
            list.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-border"
              >
                <AccordionTrigger className="text-left font-serif text-[18px] sm:text-[20px] text-foreground hover:no-underline py-6">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-[1.75] text-muted-foreground pb-6 pr-8">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="mt-12 text-[14px] text-muted-foreground italic">
          Still wondering something?{" "}
          <a
            href="mailto:mbaid@wharton.upenn.edu"
            className="text-primary not-italic font-medium hover:underline"
          >
            Write to Megha directly
          </a>
          .
        </p>
      </div>
    </section>
  );
};

export default FAQSection;
