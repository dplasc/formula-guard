export const metadata = {
  title: 'Disclaimer | FormulaGuard',
  description: 'Disclaimer for FormulaGuard.',
};

export default function DisclaimerPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1rem', lineHeight: 1.6 }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Disclaimer</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Last updated: January 4, 2026</p>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>General Information</h2>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}>
          FormulaGuard provides informational guidance and formulation tools for educational and research purposes only. The platform is not intended to replace professional cosmetic formulation expertise, regulatory compliance review, or safety testing.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>No Professional Advice</h2>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}>
          The information, calculations, suggestions, and tools provided by FormulaGuard are for informational purposes only and do not constitute professional advice, medical advice, legal advice, or regulatory guidance. FormulaGuard is not a regulatory body, testing laboratory, certification authority, or professional consultancy service.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>User Responsibility</h2>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}>Users are responsible for:</p>
        <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>Ensuring their formulations comply with applicable regulations, safety standards, and industry best practices</li>
          <li style={{ marginBottom: '0.5rem' }}>Conducting appropriate safety testing, stability testing, and quality control measures</li>
          <li style={{ marginBottom: '0.5rem' }}>Verifying all information provided by the platform independently</li>
          <li style={{ marginBottom: '0.5rem' }}>Consulting with qualified professionals (formulators, chemists, regulatory experts, legal advisors) as needed</li>
          <li style={{ marginBottom: '0.5rem' }}>Making all final decisions regarding the use, production, and distribution of any formulations</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>No Guarantees</h2>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}>
          We do not guarantee the accuracy, safety, efficacy, or regulatory compliance of any formulations created using our platform. FormulaGuard makes no warranties, expressed or implied, regarding the suitability of any formulation for any particular purpose.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Limitation of Liability</h2>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}>
          FormulaGuard shall not be liable for any damages, losses, or claims arising from the use or misuse of information, tools, or formulations created using the platform, including but not limited to product liability, regulatory violations, safety issues, or commercial losses.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Contact</h2>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}>
          If you have questions about this Disclaimer, please contact us at:
        </p>
        <p style={{ marginTop: 0, marginBottom: '1rem' }}><strong>Email:</strong> <a href="mailto:info@formulaguard.com">info@formulaguard.com</a></p>
      </section>
    </div>
  );
}

