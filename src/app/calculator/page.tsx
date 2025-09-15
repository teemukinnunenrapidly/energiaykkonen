'use client';

import Link from 'next/link';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';

export default function EmbeddedCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header with Centered Logo */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-center">
          <Link
            href="https://energiaykkonen.fi"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="/EnergiaYkkonen-logo.svg"
              alt="Energiaykkönen"
              className="h-8"
            />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full px-4 py-8">
        <div
          className="border-2 p-12 mb-8 text-center max-w-4xl mx-auto bg-white rounded-lg"
          style={{ borderColor: '#0d9430' }}
        >
          <h1
            className="mb-6"
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              lineHeight: '44px',
              letterSpacing: '-0.38px',
              color: '#0d9430',
            }}
          >
            Testaa kuinka paljon säästäisit ilmavesilämpöpumpulla
          </h1>
          <p className="text-gray-700 text-lg">
            Täytä tietosi ja saat automaattisen säästölaskelman sähköpostiisi.
            Tietojen täyttäminen vie vain muutaman minuutin.
          </p>
        </div>

        {/* Card System */}
        <CardSystemContainer showVisualSupport={true} />
      </main>

      {/* Footer */}
      <footer
        className="text-white py-12"
        style={{ backgroundColor: '#1a171b' }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info & Contact */}
            <div className="md:col-span-1">
              <div className="mb-6">
                <img
                  src="/EnergiaYkkonen-Logo-White.png"
                  alt="Energiaykkönen"
                  className="h-8 mb-4"
                />
              </div>

              <div className="space-y-3 text-sm text-gray-300">
                <p className="font-medium text-white">EnergiaYkkönen Oy</p>
                <p>Y-tunnus: 2635343-7</p>
                <p>Koivupurontie 6 b</p>
                <p>40320 Jyväskylä</p>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center text-green-400">
                  <span className="mr-2">📞</span>
                  <span>029 123 3200</span>
                </div>
                <div className="flex items-center text-green-400">
                  <span className="mr-2">✉️</span>
                  <span>myynti@energiaykkonen.fi</span>
                </div>
              </div>

              <div className="mt-6">
                <img
                  src="/LK_valkoinen_rgb.jpg"
                  alt="Luotettava kumppani"
                  className="w-32 h-auto"
                />
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Palvelut
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a
                    href="https://energiaykkonen.fi/palvelut/energiaremontti"
                    className="hover:text-white transition-colors"
                  >
                    Energiaremontti
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/palvelut/lampoverkköremontti"
                    className="hover:text-white transition-colors"
                  >
                    Lämpöverkköremontti
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/palvelut/kayttovesiremontti"
                    className="hover:text-white transition-colors"
                  >
                    Käyttövesiremontti
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/palvelut/asennus-ja-huolto"
                    className="hover:text-white transition-colors"
                  >
                    Asennus ja huolto
                  </a>
                </li>
              </ul>
            </div>

            {/* Experience & Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Kokemuksia
              </h3>
              <ul className="space-y-2 text-base text-gray-300">
                <li>
                  <a
                    href="https://energiaykkonen.fi/kokemuksia/tietopankki"
                    className="hover:text-white transition-colors font-semibold"
                  >
                    Tietopankki
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/kokemuksia/yritys"
                    className="hover:text-white transition-colors font-semibold"
                  >
                    Yritys
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/kokemuksia/huoltopyynto"
                    className="hover:text-white transition-colors font-semibold"
                  >
                    Huoltopyyntö
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/kokemuksia/tyopaikat"
                    className="hover:text-white transition-colors font-semibold"
                  >
                    Työpaikat
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/kokemuksia/evasteseloste"
                    className="hover:text-white transition-colors font-semibold"
                  >
                    Evästseloste
                  </a>
                </li>
                <li>
                  <a
                    href="https://energiaykkonen.fi/kokemuksia/tietosuojaseloste"
                    className="hover:text-white transition-colors font-semibold"
                  >
                    Tietosuojaseloste
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-600 mt-8 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2025 EnergiaYkkönen Oy. Kaikki oikeudet pidätetään.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
