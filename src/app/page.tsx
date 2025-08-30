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

      {/* Calculator Preview Section */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Try the Calculator
            </h2>
            <p className="text-lg text-gray-600">
              Experience our interactive calculator below or{' '}
              <Link
                href="/calculator"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                open it in full-screen mode
              </Link>
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            <CardSystemContainer
              maxWidth={1200}
              showVisualSupport={true}
              visualWidth="40%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
