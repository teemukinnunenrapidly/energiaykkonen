'use client';

import { useState, useCallback } from 'react';
import { MultiStepForm } from '@/components/calculator/MultiStepForm';

export default function CalculatorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              E1 Calculator
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Laske energiansäästösi ja takaisinmaksuaika lämpöpumpun asennukselle
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Tesla-Style Split Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Side - Visualization Panel (70% on desktop, full width on mobile) */}
        <div className="w-full lg:w-[70%] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-6 xl:p-8">
          <div className="h-full flex flex-col">
            {/* Visualization Content */}
            <div className="flex-1 bg-white rounded-xl shadow-lg p-4 lg:p-6 xl:p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-3">
                  Kiinteistösi visualisointi
                </h2>
                <p className="text-gray-600 text-sm lg:text-base">
                  Interaktiivinen esitys kiinteistöstäsi ja energiatehokkuudesta
                </p>
              </div>
              
              {/* Placeholder for Dynamic Visualization Content */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-64 lg:h-80 xl:h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium text-sm lg:text-base">3D Kiinteistömalli</p>
                  <p className="text-gray-500 text-xs lg:text-sm mt-1">Interaktiivinen visualisointi</p>
                </div>
              </div>

              {/* Progress Indicator for Mobile */}
              <div className="lg:hidden mt-6">
                <div className="flex justify-center">
                  <div className="flex space-x-2">
                    {Array.from({ length: totalSteps }, (_, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                            index + 1 <= currentStep
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-300 text-gray-500'
                          }`}
                        >
                          {index + 1 < currentStep ? '✓' : index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Panel (30% on desktop, full width on mobile) */}
        <div className="w-full lg:w-[30%] bg-white border-l border-gray-200">
          <div className="sticky top-20 lg:top-24 h-full overflow-y-auto">
            <MultiStepForm 
              onComplete={(results) => {
                console.log('Form completed:', results);
                // You can add additional logic here like redirecting to results page
                // or showing a success message
              }}
              onStepChange={handleStepChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
