const About = () => {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8">
            Transforming{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Clinic Operations
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Vyana AI is transforming how clinics operate. Our platform listens to doctor–patient 
            conversations and automatically generates structured medical notes, prescriptions, and 
            discharge summaries — all in real time.
          </p>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Built with multilingual support and compliant with India's ABDM (Ayushman Bharat Digital 
            Mission), Vyana ensures every clinic can digitize patient records effortlessly and securely.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
