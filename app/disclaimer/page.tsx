export const metadata = {
  title: 'Disclaimer | FormulaGuard',
  description: 'Disclaimer for FormulaGuard.',
};

export default function DisclaimerPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Disclaimer</h1>
      <p>Last updated: January 4, 2026</p>

      <section>
        <h2>General Information</h2>
        <p>
          FormulaGuard provides informational guidance and formulation tools for educational and research purposes only. The platform is not intended to replace professional cosmetic formulation expertise, regulatory compliance review, or safety testing.
        </p>
      </section>

      <section>
        <h2>No Professional Advice</h2>
        <p>
          The information, calculations, suggestions, and tools provided by FormulaGuard are for informational purposes only and do not constitute professional advice, medical advice, legal advice, or regulatory guidance. FormulaGuard is not a regulatory body, testing laboratory, certification authority, or professional consultancy service.
        </p>
      </section>

      <section>
        <h2>User Responsibility</h2>
        <p>Users are responsible for:</p>
        <ul>
          <li>Ensuring their formulations comply with applicable regulations, safety standards, and industry best practices</li>
          <li>Conducting appropriate safety testing, stability testing, and quality control measures</li>
          <li>Verifying all information provided by the platform independently</li>
          <li>Consulting with qualified professionals (formulators, chemists, regulatory experts, legal advisors) as needed</li>
          <li>Making all final decisions regarding the use, production, and distribution of any formulations</li>
        </ul>
      </section>

      <section>
        <h2>No Guarantees</h2>
        <p>
          We do not guarantee the accuracy, safety, efficacy, or regulatory compliance of any formulations created using our platform. FormulaGuard makes no warranties, expressed or implied, regarding the suitability of any formulation for any particular purpose.
        </p>
      </section>

      <section>
        <h2>Limitation of Liability</h2>
        <p>
          FormulaGuard shall not be liable for any damages, losses, or claims arising from the use or misuse of information, tools, or formulations created using the platform, including but not limited to product liability, regulatory violations, safety issues, or commercial losses.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          If you have questions about this Disclaimer, please contact us at:
        </p>
        <p><strong>Email:</strong> <a href="mailto:info@formulaguard.com">info@formulaguard.com</a></p>
      </section>
    </div>
  );
}

