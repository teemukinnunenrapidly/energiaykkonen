import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Privacy Policy & Data Protection Notice
        </h1>
        <p className="text-lg text-gray-600">
          Energiaykkönen Oy - Heat Pump Calculator
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {new Date().toLocaleDateString('en-GB')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Energiaykkönen Oy (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;) is committed to protecting your privacy and
              personal data. This Privacy Policy explains how we collect, use,
              and protect your information when you use our Heat Pump Calculator
              and related services.
            </p>
            <p>
              This policy complies with the EU General Data Protection
              Regulation (GDPR) and Finnish data protection laws.
            </p>
          </CardContent>
        </Card>

        {/* Data Controller */}
        <Card>
          <CardHeader>
            <CardTitle>2. Data Controller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Energiaykkönen Oy</strong>
              </p>
              <p>Business ID: [Your Business ID]</p>
              <p>Address: [Your Business Address]</p>
              <p>Email: privacy@energiaykkonen.fi</p>
              <p>Phone: +358 40 765 4321</p>
            </div>
          </CardContent>
        </Card>

        {/* What Data We Collect */}
        <Card>
          <CardHeader>
            <CardTitle>3. What Personal Data We Collect</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              When you use our Heat Pump Calculator, we collect the following
              information:
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Contact Information:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Street address (optional)</li>
                  <li>City (optional)</li>
                  <li>Contact preference</li>
                  <li>Message/comments (optional)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Property Information:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Property size (square meters)</li>
                  <li>Ceiling height</li>
                  <li>Construction year range</li>
                  <li>Number of floors</li>
                  <li>Number of residents</li>
                  <li>Current heating type and costs</li>
                  <li>Hot water usage level</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Technical Information:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>IP address</li>
                  <li>Browser type and version (User Agent)</li>
                  <li>Source page URL</li>
                  <li>Timestamp of form submission</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Basis */}
        <Card>
          <CardHeader>
            <CardTitle>4. Legal Basis for Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We process your personal data based on the following legal
              grounds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>Consent (Art. 6(1)(a) GDPR):</strong> You provide
                explicit consent for us to process your data to calculate heat
                pump savings and contact you with results and quotes.
              </li>
              <li>
                <strong>Legitimate Interests (Art. 6(1)(f) GDPR):</strong> We
                have a legitimate interest in providing heat pump consultation
                services and improving our calculator tool.
              </li>
              <li>
                <strong>Contract Performance (Art. 6(1)(b) GDPR):</strong>{' '}
                Processing is necessary to provide the services you requested
                (calculation and consultation).
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How We Use Data */}
        <Card>
          <CardHeader>
            <CardTitle>5. How We Use Your Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Calculate heat pump savings specific to your property</li>
              <li>Send you personalized calculation results via email</li>
              <li>
                Contact you to discuss heat pump solutions (if you consent)
              </li>
              <li>Provide quotes and consultation services</li>
              <li>Improve our calculator tool and services</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns to enhance user experience</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>6. Data Sharing and Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  We may share your data with:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Our sales team for follow-up consultation</li>
                  <li>Trusted service providers (email delivery, analytics)</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  <strong>International Transfers:</strong> We use cloud
                  services that may process data outside the EU. All transfers
                  are protected by appropriate safeguards including adequacy
                  decisions and Standard Contractual Clauses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>7. Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>We retain your personal data for the following periods:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>Active leads:</strong> 2 years from last contact
                </li>
                <li>
                  <strong>Converted customers:</strong> 7 years for warranty and
                  legal purposes
                </li>
                <li>
                  <strong>Technical logs:</strong> 12 months for security and
                  system optimization
                </li>
                <li>
                  <strong>Marketing consent:</strong> Until consent is withdrawn
                </li>
              </ul>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800">
                  <strong>Automatic Deletion:</strong> We automatically delete
                  personal data after the retention period expires, unless legal
                  requirements mandate longer retention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>8. Your Rights Under GDPR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You have the following rights regarding your personal data:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right of Access
                  </h5>
                  <p className="text-sm text-gray-600">
                    Request a copy of your personal data
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Rectification
                  </h5>
                  <p className="text-sm text-gray-600">
                    Correct inaccurate or incomplete data
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Erasure
                  </h5>
                  <p className="text-sm text-gray-600">
                    Request deletion of your data
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Restrict Processing
                  </h5>
                  <p className="text-sm text-gray-600">
                    Limit how we use your data
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Data Portability
                  </h5>
                  <p className="text-sm text-gray-600">
                    Receive your data in a portable format
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Object
                  </h5>
                  <p className="text-sm text-gray-600">
                    Object to processing based on legitimate interests
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Withdraw Consent
                  </h5>
                  <p className="text-sm text-gray-600">
                    Withdraw consent at any time
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Right to Lodge a Complaint
                  </h5>
                  <p className="text-sm text-gray-600">
                    File a complaint with data protection authorities
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg">
              <h5 className="font-semibold text-amber-800 mb-2">
                Exercise Your Rights
              </h5>
              <p className="text-amber-700">
                To exercise any of these rights, contact us at{' '}
                <strong>privacy@energiaykkonen.fi</strong> or use our
                <a href="/data-request" className="underline ml-1">
                  online data request form
                </a>
                . We will respond within 30 days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>9. Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to
              protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>End-to-end encryption for data transmission (HTTPS/TLS)</li>
              <li>Encrypted data storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Staff training on data protection practices</li>
              <li>Incident response procedures</li>
              <li>Regular automated backups with encryption</li>
            </ul>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>10. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our Heat Pump Calculator uses minimal cookies and tracking:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>Functional cookies:</strong> Essential for the
                calculator to work properly
              </li>
              <li>
                <strong>Analytics:</strong> Anonymous usage statistics to
                improve the tool
              </li>
              <li>
                <strong>No third-party advertising</strong> cookies or trackers
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              You can disable cookies in your browser settings, but this may
              affect the functionality of the calculator.
            </p>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardHeader>
            <CardTitle>11. Policy Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes via email or prominent notice on
              our website. Continued use of our services after changes
              constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>12. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  Data Protection Officer:
                </h5>
                <p>Email: dpo@energiaykkonen.fi</p>
                <p>Phone: +358 40 765 4321</p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  Supervisory Authority:
                </h5>
                <p>Office of the Data Protection Ombudsman (Finland)</p>
                <p>Website: tietosuoja.fi</p>
                <p>Email: tietosuoja@om.fi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Back to Calculator */}
      <div className="text-center mt-8 pt-8 border-t">
        <a
          href="/calculator"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Heat Pump Calculator
        </a>
      </div>
    </div>
  );
}
