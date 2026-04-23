const citations = [
  {
    title: "Longitudinal health records",
    cite: "WHO. (2016). Framework on integrated, people-centred health services. World Health Organization.",
    line: "Continuity of clinical information is the single strongest predictor of safe, appropriate care across visits.",
  },
  {
    title: "Diagnostic delays in India",
    cite: "Lancet Commission on Diagnostics. (2021). Transforming access to diagnostics. The Lancet, 398(10315).",
    line: "47% of the world’s population has little or no access to diagnostics. Repeated tests are the norm, not the exception.",
  },
  {
    title: "ABDM & federated records",
    cite: "Ministry of Health & Family Welfare. (2020). Ayushman Bharat Digital Mission Strategy Overview.",
    line: "India’s health stack envisions consent-based, patient-held records as the foundation of digital care.",
  },
  {
    title: "Family caregiving burden",
    cite: "Brinda, E. M., et al. (2014). Cost and burden of informal caregiving of dependent older people. BMC Health Services Research, 14, 207.",
    line: "Indian family caregivers carry 80%+ of chronic care coordination, often without any clinical record to anchor decisions.",
  },
  {
    title: "Medication adherence",
    cite: "WHO. (2003). Adherence to long-term therapies: Evidence for action. World Health Organization.",
    line: "Adherence to chronic medication averages just 50% in low- and middle-income countries.",
  },
  {
    title: "Emergency room handoffs",
    cite: "Stiell, A., et al. (2003). Prevalence of information gaps in the emergency department. CMAJ, 169(10).",
    line: "Information gaps occur in 32% of ER visits, and are independently associated with longer stays and adverse events.",
  },
];

const ResearchStrip = () => {
  return (
    <section id="research" className="py-24 lg:py-32 bg-muted/40 border-y border-border">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="max-w-[640px] mb-14">
          <p className="text-label text-primary mb-4">
            III &nbsp;·&nbsp; The science
          </p>
          <h2 className="text-section text-foreground">
            Grounded in clinical
            <br />
            <em className="italic text-primary font-normal">and public-health research.</em>
          </h2>
          <p className="mt-5 text-body text-muted-foreground">
            Vyana is built on a quiet thesis: most preventable harm in Indian
            healthcare comes from missing context, not missing medicine. The
            literature agrees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-10">
          {citations.map((c, i) => (
            <div key={i} className="rounded-2xl glass-card p-6 space-y-2.5">
              <h3 className="font-serif text-card-title text-foreground">
                {c.title}
              </h3>
              <p className="text-caption text-muted-foreground italic">
                {c.cite}
              </p>
              <p className="text-caption text-foreground/85 leading-[1.65]">
                {c.line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResearchStrip;
