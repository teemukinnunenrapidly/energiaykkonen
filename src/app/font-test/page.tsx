import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Font Test - E1 Calculator',
  description: 'Test page for Inter font integration',
};

export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Inter Font Test
          </h1>
          <p className="text-xl text-gray-600">
            This page demonstrates the Inter font integration
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Font Weights
            </h2>
            <div className="space-y-2">
              <p className="font-light text-lg">Light weight text</p>
              <p className="font-normal text-lg">Normal weight text</p>
              <p className="font-medium text-lg">Medium weight text</p>
              <p className="font-semibold text-lg">Semibold weight text</p>
              <p className="font-bold text-lg">Bold weight text</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Font Sizes
            </h2>
            <div className="space-y-2">
              <p className="text-sm">Small text (text-sm)</p>
              <p className="text-base">Base text (text-base)</p>
              <p className="text-lg">Large text (text-lg)</p>
              <p className="text-xl">Extra large text (text-xl)</p>
              <p className="text-2xl">2XL text (text-2xl)</p>
              <p className="text-3xl">3XL text (text-3xl)</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              CSS Variables
            </h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm font-mono">
                --font-inter:{' '}
                {typeof window !== 'undefined' ? 'Loaded' : 'Server-side'}
              </p>
              <p className="text-sm font-mono">
                font-family: var(--font-inter), system-ui, sans-serif
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
