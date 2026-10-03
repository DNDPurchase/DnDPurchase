export const metadata = {
  title: "Privacy Policy | DND Purchase",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm text-gray-700">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Privacy Policy</h1>
      <p className="text-gray-500 mb-10">Last updated: October 3, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Introduction</h2>
        <p>
          DND Purchase ("we", "our", "us") operates the website{" "}
          <a href="https://www.dndpurchase.com" className="text-blue-600 underline">
            www.dndpurchase.com
          </a>{" "}
          and the DND Purchase mobile application. This Privacy Policy explains how we collect, use, and protect your
          personal information when you use our platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account information:</strong> Name, email address, phone number, company name, and GST/Aadhaar documents for verification.</li>
          <li><strong>Transaction data:</strong> Inquiry details, offers, and order information you submit through the platform.</li>
          <li><strong>Usage data:</strong> Pages visited, features used, and interactions within the platform.</li>
          <li><strong>Communication data:</strong> Messages sent through the platform between buyers and sellers.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To operate and improve the DND Purchase platform.</li>
          <li>To match buyers with relevant sellers based on product categories and location.</li>
          <li>To send transactional notifications via WhatsApp and email (with your consent).</li>
          <li>To verify your identity and business credentials.</li>
          <li>To comply with applicable laws and regulations.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">4. WhatsApp Notifications</h2>
        <p>
          If you opt in during registration, we send order updates, inquiry notifications, and other transactional
          messages via WhatsApp using Meta's WhatsApp Business Platform. You can opt out at any time by contacting us
          or updating your notification preferences in your account settings. We do not use your phone number for
          marketing without explicit consent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">5. Data Sharing</h2>
        <p>
          We do not sell your personal data. We share information only:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>With the other party in a transaction (e.g., sharing a seller's contact details with a buyer after offer acceptance).</li>
          <li>With service providers (Firebase, Meta, Vercel) under data processing agreements.</li>
          <li>When required by law or government authorities.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">6. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. Transaction records are kept for 7 years
          for legal and tax compliance. You may request deletion of your account by contacting us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">7. Your Rights (DPDP Act 2023)</h2>
        <p>Under India's Digital Personal Data Protection Act 2023, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Access personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Erase your data (right to be forgotten).</li>
          <li>Withdraw consent for data processing.</li>
          <li>Nominate a person to exercise these rights on your behalf.</li>
        </ul>
        <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@dndpurchase.com" className="text-blue-600 underline">support@dndpurchase.com</a>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">8. Security</h2>
        <p>
          We use industry-standard security measures including encrypted data storage (Firebase), HTTPS, and access
          controls. However, no system is 100% secure and we cannot guarantee absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">9. Cookies</h2>
        <p>
          We use essential cookies only to maintain your session. We do not use tracking or advertising cookies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">10. Contact Us</h2>
        <p>
          For any privacy-related questions or requests:
        </p>
        <p className="mt-2">
          <strong>DND Purchase</strong><br />
          Email: <a href="mailto:support@dndpurchase.com" className="text-blue-600 underline">support@dndpurchase.com</a><br />
          Website: <a href="https://www.dndpurchase.com" className="text-blue-600 underline">www.dndpurchase.com</a>
        </p>
      </section>
    </main>
  )
}
