'use client';

import Link from 'next/link';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            E1 Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Calculate your energy savings, payback period, and CO2 reduction for
            heat pump installation. Get personalized results and connect with
            our sales team.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/calculator"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Start Calculator
            </Link>
            <Link
              href="/admin"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Admin Panel
            </Link>
            <Link
              href="/font-test"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Font Test
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Energy Savings
                </h3>
                <p className="text-gray-600">
                  Calculate potential savings on your heating costs
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Payback Period
                </h3>
                <p className="text-gray-600">
                  See how long until your investment pays off
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Environmental Impact
                </h3>
                <p className="text-gray-600">
                  Understand your CO2 reduction contribution
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Preview Section with Green Background */}
      <div
        className="relative bg-green-500 overflow-hidden"
        style={{ height: '1200px' }}
      >
        {/* Geometric Background Shapes */}
        <div className="absolute inset-0">
          {/* Large circular shape */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-green-400 rounded-full opacity-30"></div>

          {/* Diagonal lines/shapes */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-64 h-2 bg-green-300 rotate-45 opacity-40"></div>
            <div className="absolute top-40 left-32 w-48 h-2 bg-green-300 rotate-12 opacity-40"></div>
            <div className="absolute bottom-32 right-16 w-72 h-2 bg-green-300 -rotate-45 opacity-40"></div>
          </div>

          {/* Triangular shapes */}
          <div className="absolute bottom-20 left-20">
            <div className="w-0 h-0 border-l-[80px] border-r-[80px] border-b-[120px] border-l-transparent border-r-transparent border-b-green-400 opacity-25"></div>
          </div>

          {/* Rectangle shapes */}
          <div className="absolute top-60 right-1/4 w-32 h-20 bg-green-400 opacity-20 rotate-12"></div>
          <div className="absolute bottom-60 left-1/3 w-24 h-40 bg-green-300 opacity-25 -rotate-6"></div>

          {/* Additional circular elements */}
          <div className="absolute bottom-10 right-1/3 w-24 h-24 bg-green-300 rounded-full opacity-30"></div>
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-green-400 rounded-full opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Try the Calculator
            </h2>
            <p className="text-lg text-green-100">
              Experience our interactive calculator below or{' '}
              <Link
                href="/calculator"
                className="text-white hover:text-green-200 font-semibold underline"
              >
                open it in full-screen mode
              </Link>
            </p>
          </div>
          <div className="rounded-lg overflow-hidden bg-transparent">
            <CardSystemContainer
              maxWidth={1200}
              showVisualSupport={true}
              visualWidth="50%"
              height={700}
              showBlurredCards={true}
            />
          </div>
        </div>
      </div>

      {/* Energy Information Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Heat Pumps?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Heat pumps are the most efficient way to heat and cool your home,
              offering significant savings and environmental benefits.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Energy Efficiency Statistics
              </h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">3x</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      300% Efficiency
                    </h4>
                    <p className="text-gray-600">
                      Heat pumps deliver 3 units of heat for every 1 unit of
                      electricity
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">50%</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Energy Savings
                    </h4>
                    <p className="text-gray-600">
                      Reduce your heating costs by up to 50% compared to
                      traditional systems
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">70%</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      CO2 Reduction
                    </h4>
                    <p className="text-gray-600">
                      Lower your carbon footprint by up to 70% with renewable
                      energy
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Average Annual Savings
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Small Home (100m²)</span>
                  <span className="text-green-600 font-bold">
                    €800 - €1,200
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Medium Home (150m²)</span>
                  <span className="text-green-600 font-bold">
                    €1,200 - €1,800
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Large Home (200m²)</span>
                  <span className="text-green-600 font-bold">
                    €1,800 - €2,400
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                *Savings depend on current heating system, home insulation, and
                local energy prices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Government Incentives Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Available Incentives & Grants
            </h2>
            <p className="text-xl text-gray-600">
              Take advantage of government programs to reduce your investment
              costs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">€</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Energy Grant Program
              </h3>
              <p className="text-gray-600 mb-4">
                Get up to €4,000 in grants for qualifying heat pump
                installations
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Air-to-water heat pumps: up to €2,400</li>
                <li>• Ground source heat pumps: up to €4,000</li>
                <li>• Additional insulation grants available</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">%</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Tax Incentives
              </h3>
              <p className="text-gray-600 mb-4">
                Benefit from reduced VAT rates and tax deductions on your
                installation
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Reduced VAT rate of 10% on installation</li>
                <li>• Tax credit up to 30% of equipment cost</li>
                <li>• Accelerated depreciation for businesses</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Financing Options
              </h3>
              <p className="text-gray-600 mb-4">
                Flexible payment plans and low-interest loans available
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 0% interest loans up to €25,000</li>
                <li>• Extended payment terms up to 15 years</li>
                <li>• No down payment required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from satisfied heat pump owners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Maria K.</h4>
                  <p className="text-sm text-gray-600">Helsinki, 150m² home</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Our heating bills dropped by 60% after installing the heat
                pump. The house is more comfortable than ever, and we're doing
                our part for the environment."
              </p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Jukka M.</h4>
                  <p className="text-sm text-gray-600">Tampere, 120m² home</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Installation was smooth and professional. The system works
                perfectly even in -25°C weather. Best investment we've made for
                our home."
              </p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Anna L.</h4>
                  <p className="text-sm text-gray-600">Turku, 180m² home</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The calculator helped us understand the savings potential.
                After one year, we're saving exactly what was predicted!"
              </p>
              <div className="flex text-yellow-400">★★★★★</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300">
              Get answers to common questions about heat pump installations
            </p>
          </div>

          <div className="space-y-8">
            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-3">
                How long does a heat pump installation take?
              </h3>
              <p className="text-gray-300">
                Most installations are completed within 1-2 days. Ground source
                heat pumps may require additional time for ground work,
                typically 3-5 days total.
              </p>
            </div>

            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-3">
                Do heat pumps work in Finnish winters?
              </h3>
              <p className="text-gray-300">
                Yes! Modern heat pumps are designed to work efficiently even at
                -25°C. They're specifically engineered for Nordic climates and
                provide reliable heating year-round.
              </p>
            </div>

            <div className="border-b border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-3">
                What maintenance is required?
              </h3>
              <p className="text-gray-300">
                Heat pumps require minimal maintenance. Annual servicing by a
                qualified technician and regular filter cleaning are typically
                all that's needed to keep your system running efficiently.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">
                How long is the warranty period?
              </h3>
              <p className="text-gray-300">
                Most heat pump systems come with a 5-7 year manufacturer
                warranty on parts, with extended warranty options available.
                Installation work is typically guaranteed for 2 years.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                E1 Energy Solutions
              </h3>
              <p className="text-gray-300 text-sm">
                Leading provider of energy-efficient heating solutions in
                Finland. Helping homeowners save money and reduce their carbon
                footprint.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Heat Pump Installation</li>
                <li>Energy Audits</li>
                <li>System Maintenance</li>
                <li>Financing Solutions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Customer Service</li>
                <li>Technical Support</li>
                <li>Warranty Claims</li>
                <li>Installation Guide</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📞 +358 10 123 4567</li>
                <li>✉️ info@e1energy.fi</li>
                <li>📍 Helsinki, Finland</li>
                <li>🕒 Mon-Fri 8:00-17:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 E1 Energy Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
