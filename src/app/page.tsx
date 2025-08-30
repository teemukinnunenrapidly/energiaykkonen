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
      <div className="relative bg-green-500 overflow-hidden" style={{ height: '1000px' }}>
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
          <div className="rounded-lg border border-green-300 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
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
