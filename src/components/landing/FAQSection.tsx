import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

const FAQSection = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const list = useReveal<HTMLDivElement>();

  const faqs = Array.from({ length: 8 }, (_, i) => ({
    q: t(`faq.q${i + 1}.q`),
    a: t(`faq.q${i + 1}.a`),
  }));

  return (
    <section id="faq" className="py-24 lg:py-32 bg-background border-t border-border">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`max-w-[640px] mb-14 transition-all duration-700 ${
            header.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-label text-primary mb-5">
            VI &nbsp;·&nbsp; {t("faq.eyebrow")}
          </p>
          <h2 className="text-section text-foreground">
            {t("faq.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("faq.title.l2")}</em>
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
                <AccordionTrigger className="text-left font-serif text-card-title text-foreground hover:no-underline py-6">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-body text-muted-foreground pb-6 pr-8">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="mt-12 text-caption text-muted-foreground italic">
          {t("faq.footer.pre")}{" "}
          <a
            href="mailto:vyana.care@gmail.com"
            className="text-primary not-italic font-medium hover:underline"
          >
            {t("faq.footer.link")}
          </a>
          .
        </p>
      </div>
    </section>
  );
};

export default FAQSection;
