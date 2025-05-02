'use client';

import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl mb-4">Introduction</h2>
            <p>
              MerchX respects your privacy and is committed to protecting your personal data. 
              This policy explains how we collect and use your data, and describes your privacy rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Information We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access our website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
              <li><strong>Business Data</strong> includes information about your business inventory, sales, and other operational data when you use our services.</li>
            </ul>
            <p>We do not collect any Special Categories of Personal Data about you (this includes details about your race or ethnicity, religious or philosophical beliefs, sex life, sexual orientation, political opinions, trade union membership, information about your health, and genetic and biometric data).</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">How We Use Your Information</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
            <p>The purposes for which we will use your personal data include:</p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li>To register you as a new customer</li>
              <li>To provide and maintain our services</li>
              <li>To notify you about changes to our service</li>
              <li>To manage our relationship with you</li>
              <li>To improve our website, products/services, marketing or customer relationships</li>
              <li>To administer and protect our business and this website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and store information.
              You can set your browser to refuse cookies, but this may limit some site functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Data Security</h2>
            <p>
              We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
              In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
            <p>
              We have procedures in place to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Your Legal Rights</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
            <ul className="list-disc pl-6 mt-4 mb-4">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p>If you wish to exercise any of these rights, please contact us.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Changes to this Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              We will let you know via email and/or a prominent notice on our service, prior to the change becoming effective.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p>By email: privacy@merchx.com</p>
          </section>
        </div>
      </div>
    </div>
  );
} 