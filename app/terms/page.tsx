'use client';

import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl mb-4">1. Introduction</h2>
            <p>
              Welcome to MerchX. By using our services, you agree to these Terms. If you disagree, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">2. Definitions</h2>
            <p>Throughout these Terms:</p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li><strong>"Service"</strong> refers to the MerchX inventory management platform, website, and related services.</li>
              <li><strong>"User"</strong> refers to individuals who access or use the Service.</li>
              <li><strong>"Account"</strong> refers to the unique access point used by Users to access the Service.</li>
              <li><strong>"Content"</strong> refers to any data, information, text, graphics, or other materials uploaded, downloaded, or appearing on the Service.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">3. Account Security</h2>
            <p>To use certain features, you must register an account and:</p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li>Provide accurate information</li>
              <li>Maintain account security</li>
              <li>Accept responsibility for account activity</li>
              <li>Report unauthorized use immediately</li>
            </ul>
            <p>
              We reserve the right to terminate accounts or remove content at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">4. Payments</h2>
            <p>
              Some features require subscription payments. Fees are billed in advance and are non-refundable except as required by law.
            </p>
            <p>
              We may change fees with notice before your next billing cycle. Continued use after price changes means you accept the new fees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">5. User Content</h2>
            <p>
              You retain all rights to any content you submit, post, or display on or through the Service. By submitting, posting, or displaying content on or through the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate, and distribute such content.
            </p>
            <p>
              You are responsible for your use of the Service and any content you provide, including compliance with applicable laws, rules, and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">6. Intellectual Property Rights</h2>
            <p>
              The Service and its original content, features, and functionality are owned by MerchX and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, MerchX shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li>Your use or inability to use the Service;</li>
              <li>Any unauthorized access to or use of our servers and/or any personal information stored therein;</li>
              <li>Any interruption or cessation of transmission to or from the Service;</li>
              <li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through the Service by any third party.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <p>By email: legal@merchx.com</p>
          </section>
        </div>
      </div>
    </div>
  );
} 