import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './card-system-styles.css';

// Types for our card system
interface CardData {
  id: string;
  title: string;
  type: 'form' | 'calculation' | 'info';
  fields?: FieldData[];
  config?: any;
  visualObjectId?: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface FieldData {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

interface VisualObject {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  content?: string;
}

interface FormData {
  [key: string]: string | number;
}

// API data fetching functions
const fetchCardData = async (baseUrl: string): Promise<CardData[]> => {
  try {
    // In the widget bundle config, this data comes from the API
    const config = (window as any).E1_WIDGET_CONFIG;
    if (config?.cards) {
      return config.cards.map((card: any, index: number) => ({
        id: card.id || `card-${index}`,
        title: card.title || 'Kortti',
        type: card.type || 'form',
        config: card.config,
        isUnlocked: index === 0, // First card starts unlocked
        isCompleted: false,
        visualObjectId: card.visual_object_id,
        fields: card.fields || [],
      }));
    }
    
    // Fallback to default cards if no config
    return [
      {
        id: 'building-info',
        title: 'Talon tiedot',
        type: 'form' as const,
        isUnlocked: true,
        isCompleted: false,
        visualObjectId: 'building-types',
        fields: [
          {
            id: 'area',
            name: 'livingArea',
            type: 'number',
            label: 'Lämmitettävä pinta-ala (m²)',
            placeholder: '120',
            required: true,
            min: 50,
            max: 500,
          },
          {
            id: 'rooms',
            name: 'roomHeight',
            type: 'number',
            label: 'Huonekorkeus (m)',
            placeholder: '2.5',
            required: true,
            min: 2,
            max: 4,
          },
        ],
      },
      {
        id: 'current-heating',
        title: 'Nykyinen lämmitys',
        type: 'form' as const,
        isUnlocked: false,
        isCompleted: false,
        visualObjectId: 'heating-systems',
        fields: [
          {
            id: 'current-system',
            name: 'currentSystem',
            type: 'radio',
            label: 'Nykyinen lämmitystapa',
            required: true,
            options: [
              { value: 'oil', label: 'Öljylämmitys' },
              { value: 'electric', label: 'Sähkölämmitys' },
              { value: 'wood', label: 'Puulämmitys' },
              { value: 'gas', label: 'Kaasulämmitys' },
            ],
          },
          {
            id: 'annual-cost',
            name: 'annualCost',
            type: 'number',
            label: 'Nykyiset lämmityskustannukset (€/vuosi)',
            placeholder: '2000',
            required: true,
            min: 500,
            max: 10000,
          },
        ],
      },
    ];
  } catch (error) {
    console.warn('Failed to fetch card data:', error);
    return [];
  }
};

const fetchVisualData = async (baseUrl: string): Promise<{ [key: string]: VisualObject }> => {
  try {
    const config = (window as any).E1_WIDGET_CONFIG;
    if (config?.visuals) {
      const visuals: { [key: string]: VisualObject } = {};
      config.visuals.forEach((visual: any) => {
        visuals[visual.id] = {
          id: visual.id,
          title: visual.title || 'Visual',
          description: visual.description,
          content: visual.content,
          imageUrl: visual.image_url,
        };
      });
      return visuals;
    }
    
    // Fallback visuals
    return {
      'building-types': {
        id: 'building-types',
        title: 'Rakennustyypit',
        description: 'Eri rakennustyypit vaikuttavat lämmöntarpeeseen',
        content: 'Tiedot talosi koosta ja rakenteesta auttavat määrittämään optimaalisen lämpöpumpun tehon.',
      },
      'heating-systems': {
        id: 'heating-systems',
        title: 'Lämmitysjärjestelmät',
        description: 'Nykyinen lämmitystapa vaikuttaa säästöihin',
        content: 'Lämpöpumppu voi korvata useimmat perinteiset lämmitystavat ja tuottaa merkittäviä säästöjä.',
      },
    };
  } catch (error) {
    console.warn('Failed to fetch visual data:', error);
    return {};
  }
};

// Apply design tokens from cardstream config
const applyDesignTokens = () => {
  const config = (window as any).E1_WIDGET_CONFIG;
  if (config?.cardStreamConfig) {
    const root = document.documentElement;
    const cardStreamConfig = config.cardStreamConfig;
    
    // Apply container styles
    if (cardStreamConfig.container) {
      root.style.setProperty('--cs-container-width', cardStreamConfig.container.width);
      root.style.setProperty('--cs-container-max-width', cardStreamConfig.container.maxWidth);
      root.style.setProperty('--cs-container-padding', cardStreamConfig.container.padding);
      root.style.setProperty('--cs-container-background', cardStreamConfig.container.background);
      root.style.setProperty('--cs-container-border-radius', cardStreamConfig.container.borderRadius);
      root.style.setProperty('--cs-container-box-shadow', cardStreamConfig.container.boxShadow);
    }
    
    // Apply layout styles
    if (cardStreamConfig.layout) {
      root.style.setProperty('--cs-visual-support-ratio', cardStreamConfig.layout.visualSupportRatio);
      root.style.setProperty('--cs-card-stream-ratio', cardStreamConfig.layout.cardStreamRatio);
      root.style.setProperty('--cs-panels-gap', cardStreamConfig.layout.gapBetweenPanels);
    }
    
    // Apply visual support styles
    if (cardStreamConfig.visualSupport) {
      root.style.setProperty('--cs-visual-support-background', cardStreamConfig.visualSupport.background);
      root.style.setProperty('--cs-visual-support-border-right', cardStreamConfig.visualSupport.borderRight);
    }
    
    // Apply card stream styles
    if (cardStreamConfig.cardStream) {
      root.style.setProperty('--cs-card-stream-background', cardStreamConfig.cardStream.background);
      root.style.setProperty('--cs-card-stream-padding', cardStreamConfig.cardStream.padding);
      root.style.setProperty('--cs-card-spacing', cardStreamConfig.cardStream.cardSpacing);
    }
    
    // Apply card styles
    if (cardStreamConfig.card) {
      if (cardStreamConfig.card.base) {
        root.style.setProperty('--cs-card-background', cardStreamConfig.card.base.background);
        root.style.setProperty('--cs-card-border-radius', cardStreamConfig.card.base.borderRadius);
        root.style.setProperty('--cs-card-padding', cardStreamConfig.card.base.padding);
        root.style.setProperty('--cs-card-margin-bottom', cardStreamConfig.card.base.marginBottom);
        root.style.setProperty('--cs-card-box-shadow', cardStreamConfig.card.base.boxShadow);
        root.style.setProperty('--cs-card-transition', cardStreamConfig.card.base.transition);
      }
      
      // Card states
      if (cardStreamConfig.card.states?.complete?.borderLeft) {
        root.style.setProperty('--cs-card-border-left', cardStreamConfig.card.states.complete.borderLeft);
      }
      
      // Card hover
      if (cardStreamConfig.card.hover) {
        root.style.setProperty('--cs-card-hover-box-shadow', cardStreamConfig.card.hover.boxShadow);
        root.style.setProperty('--cs-card-hover-transform', cardStreamConfig.card.hover.transform);
      }
    }
    
    // Apply color tokens
    if (cardStreamConfig.colors) {
      if (cardStreamConfig.colors.brand) {
        root.style.setProperty('--cs-color-brand-primary', cardStreamConfig.colors.brand.primary);
        root.style.setProperty('--cs-color-brand-primary-hover', cardStreamConfig.colors.brand.primaryHover);
        root.style.setProperty('--cs-color-brand-primary-light', cardStreamConfig.colors.brand.primaryLight);
      }
      
      if (cardStreamConfig.colors.text) {
        root.style.setProperty('--cs-color-text-primary', cardStreamConfig.colors.text.primary);
        root.style.setProperty('--cs-color-text-secondary', cardStreamConfig.colors.text.secondary);
        root.style.setProperty('--cs-color-text-tertiary', cardStreamConfig.colors.text.tertiary);
        root.style.setProperty('--cs-color-text-placeholder', cardStreamConfig.colors.text.placeholder);
      }
      
      if (cardStreamConfig.colors.border) {
        root.style.setProperty('--cs-color-border-default', cardStreamConfig.colors.border.default);
        root.style.setProperty('--cs-color-border-hover', cardStreamConfig.colors.border.hover);
      }
      
      if (cardStreamConfig.colors.background) {
        root.style.setProperty('--cs-color-background-primary', cardStreamConfig.colors.background.primary);
        root.style.setProperty('--cs-color-background-secondary', cardStreamConfig.colors.background.secondary);
        root.style.setProperty('--cs-color-background-tertiary', cardStreamConfig.colors.background.tertiary);
        root.style.setProperty('--cs-color-background-disabled', cardStreamConfig.colors.background.disabled);
      }
    }
    
    // Apply typography
    if (cardStreamConfig.typography) {
      root.style.setProperty('--cs-font-size-base', cardStreamConfig.typography.fontSizeBase);
      root.style.setProperty('--cs-line-height-base', cardStreamConfig.typography.lineHeightBase);
      root.style.setProperty('--cs-font-weight-light', cardStreamConfig.typography.fontWeightLight);
      root.style.setProperty('--cs-font-weight-normal', cardStreamConfig.typography.fontWeightNormal);
      root.style.setProperty('--cs-font-weight-medium', cardStreamConfig.typography.fontWeightMedium);
      root.style.setProperty('--cs-font-weight-semibold', cardStreamConfig.typography.fontWeightSemibold);
    }
  }
};

// Visual Support Panel Component
const VisualSupportPanel: React.FC<{
  activeVisual: VisualObject | null;
  isMobile: boolean;
}> = ({ activeVisual, isMobile }) => {
  if (!activeVisual) return null;

  return (
    <div className={`visual-support-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="visual-content">
        <h3 className="visual-title">{activeVisual.title}</h3>
        {activeVisual.description && (
          <p className="visual-description">{activeVisual.description}</p>
        )}
        {activeVisual.content && (
          <div className="visual-body">
            <p>{activeVisual.content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Progressive Card Component
const ProgressiveCard: React.FC<{
  card: CardData;
  formData: FormData;
  onFieldChange: (name: string, value: string | number) => void;
  onCardComplete: (cardId: string) => void;
}> = ({ card, formData, onFieldChange, onCardComplete }) => {
  const [isExpanded, setIsExpanded] = useState(card.isUnlocked);

  useEffect(() => {
    if (card.isUnlocked && !isExpanded) {
      setIsExpanded(true);
    }
  }, [card.isUnlocked]);

  const isCardComplete = () => {
    if (card.type === 'calculation') {
      // Calculation cards are complete when they have a result
      return formData[`calc_${card.id}`] !== undefined;
    }
    if (card.type === 'info') {
      // Info cards are complete when viewed/acknowledged
      return formData[`viewed_${card.id}`] === true;
    }
    // Form cards are complete when required fields are filled
    return (card.fields || []).every(field => {
      if (!field.required) return true;
      const value = formData[field.name];
      return value !== undefined && value !== '' && value !== null;
    });
  };

  const cardComplete = isCardComplete();

  useEffect(() => {
    if (cardComplete && !card.isCompleted) {
      onCardComplete(card.id);
    }
  }, [cardComplete, card.isCompleted, card.id, onCardComplete]);

  // Render form fields
  const renderFormContent = () => (
    <>
      {(card.fields || []).map(field => (
        <div key={field.id} className="field-group">
          <label className="field-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          
          {field.type === 'text' && (
            <input
              type="text"
              className="field-input"
              value={formData[field.name] || ''}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}
          
          {field.type === 'number' && (
            <input
              type="number"
              className="field-input"
              value={formData[field.name] || ''}
              onChange={(e) => onFieldChange(field.name, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              required={field.required}
            />
          )}
          
          {field.type === 'select' && (
            <select
              className="field-input"
              value={formData[field.name] || ''}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">Valitse...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {field.type === 'radio' && (
            <div className="radio-group">
              {field.options?.map(option => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={formData[field.name] === option.value}
                    onChange={(e) => onFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                  <span className="radio-label">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );

  // Render calculation card content
  const renderCalculationContent = () => {
    const result = formData[`calc_${card.id}`];
    const canCalculate = checkCalculationRequirements();
    
    return (
      <div className="calculation-card-content">
        {card.config?.display_template && (
          <p className="calculation-description">
            {processTemplate(card.config.display_template)}
          </p>
        )}
        
        {!result && canCalculate && (
          <button 
            className="calculate-button"
            onClick={performCalculation}
          >
            Laske tulos
          </button>
        )}
        
        {result && (
          <div className="calculation-result">
            <div className="result-value">{result}</div>
            {card.config?.enable_edit_mode && (
              <button 
                className="edit-button"
                onClick={() => setEditing(true)}
              >
                {card.config.edit_prompt || 'Muokkaa'}
              </button>
            )}
          </div>
        )}
        
        {!canCalculate && (
          <div className="calculation-waiting">
            <p>Täytä edelliset kortit saadaksesi tuloksen</p>
          </div>
        )}
      </div>
    );
  };

  // Render info card content
  const renderInfoContent = () => (
    <div className="info-card-content">
      {card.config?.content && (
        <div className="info-content">
          <p>{card.config.content}</p>
        </div>
      )}
      
      {!formData[`viewed_${card.id}`] && (
        <button 
          className="acknowledge-button"
          onClick={() => onFieldChange(`viewed_${card.id}`, true)}
        >
          Ymmärsin
        </button>
      )}
    </div>
  );

  // Helper functions for calculations
  const checkCalculationRequirements = () => {
    // Simple check - ensure previous cards are complete
    return true; // For now, allow all calculations
  };

  const processTemplate = (template: string) => {
    // Simple template processing - can be enhanced
    return template.replace(/\[calc:([^\]]+)\]/g, (match, calcName) => {
      const result = formData[`calc_${calcName}`];
      return result ? result : match;
    });
  };

  const performCalculation = () => {
    // Simple calculation based on form data
    // This should ideally call your calculation API
    const result = "Laskettu tulos"; // Placeholder
    onFieldChange(`calc_${card.id}`, result);
  };

  const [editing, setEditing] = useState(false);

  if (!card.isUnlocked) {
    return (
      <div className="card locked-card">
        <div className="card-header locked">
          <div className="lock-icon">🔒</div>
          <h3 className="card-title">{card.title}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${card.isCompleted ? 'completed-card' : 'active-card'}`}>
      <div className="card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="completion-icon">
          {card.isCompleted ? '✅' : '⏳'}
        </div>
        <h3 className="card-title">{card.title}</h3>
        <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-content">
          {card.type === 'form' && renderFormContent()}
          {card.type === 'calculation' && renderCalculationContent()}
          {card.type === 'info' && renderInfoContent()}
        </div>
      )}
    </div>
  );
};

// Results Card Component
const ResultsCard: React.FC<{
  formData: FormData;
  onReset: () => void;
}> = ({ formData, onReset }) => {
  // Calculate savings based on form data
  const livingArea = Number(formData.livingArea) || 120;
  const annualCost = Number(formData.annualCost) || 2000;
  
  // Simple calculation: assume heat pump reduces costs by 60-70%
  const efficiencyGain = 0.65;
  const annualSavings = Math.round(annualCost * efficiencyGain);
  const fiveYearSavings = annualSavings * 5;
  const paybackYears = Math.round(12000 / annualSavings * 10) / 10; // Assume 12k investment

  return (
    <div className="card results-card completed-card">
      <div className="card-header">
        <div className="completion-icon">🎉</div>
        <h3 className="card-title">Säästölaskelma valmis</h3>
      </div>
      
      <div className="card-content">
        <div className="results-summary">
          <div className="result-item">
            <span className="result-label">Vuosisäästö:</span>
            <span className="result-value primary">{annualSavings} €</span>
          </div>
          
          <div className="result-item">
            <span className="result-label">5 vuoden säästö:</span>
            <span className="result-value">{fiveYearSavings} €</span>
          </div>
          
          <div className="result-item">
            <span className="result-label">Takaisinmaksuaika:</span>
            <span className="result-value">{paybackYears} vuotta</span>
          </div>
        </div>
        
        <div className="result-actions">
          <button className="reset-button" onClick={onReset}>
            Laske uudelleen
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Hybrid Card System Component
const HybridCardSystem: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [visuals, setVisuals] = useState<{ [key: string]: VisualObject }>({});
  const [formData, setFormData] = useState<FormData>({});
  const [activeVisualId, setActiveVisualId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data and design tokens
  useEffect(() => {
    const initializeWidget = async () => {
      try {
        // Apply design tokens first
        applyDesignTokens();
        
        // Fetch card and visual data
        const [cardData, visualData] = await Promise.all([
          fetchCardData(window.location.origin),
          fetchVisualData(window.location.origin)
        ]);
        
        setCards(cardData);
        setVisuals(visualData);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize widget:', error);
        setIsLoading(false);
      }
    };
    
    initializeWidget();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFieldChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardComplete = (cardId: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return { ...card, isCompleted: true };
      }
      return card;
    }));

    // Unlock next card
    const currentIndex = cards.findIndex(card => card.id === cardId);
    if (currentIndex >= 0 && currentIndex < cards.length - 1) {
      setCards(prev => prev.map((card, index) => {
        if (index === currentIndex + 1) {
          return { ...card, isUnlocked: true };
        }
        return card;
      }));
    } else if (currentIndex === cards.length - 1) {
      // All cards completed, show results
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setFormData({});
    setShowResults(false);
    setCards(prev => prev.map((card, index) => ({
      ...card,
      isUnlocked: index === 0,
      isCompleted: false,
    })));
    setActiveVisualId(null);
  };

  // Set active visual based on current card
  useEffect(() => {
    const activeCard = cards.find(card => card.isUnlocked && !card.isCompleted);
    if (activeCard?.visualObjectId) {
      setActiveVisualId(activeCard.visualObjectId);
    }
  }, [cards]);

  const activeVisual = activeVisualId ? visuals[activeVisualId] : null;

  if (isLoading) {
    return (
      <div className="hybrid-card-system loading">
        <div className="system-header">
          <h2 className="system-title">Ladataan laskuria...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="hybrid-card-system">
      <div className="system-header">
        <h2 className="system-title">Lämpöpumpun säästölaskuri</h2>
        <p className="system-subtitle">
          Täytä tiedot vaihe vaiheelta saadaksesi tarkan säästölaskelman
        </p>
      </div>

      <div className={`system-layout ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
        {/* Visual Support Panel (Desktop) */}
        {!isMobile && activeVisual && (
          <div className="visual-panel-container">
            <VisualSupportPanel activeVisual={activeVisual} isMobile={false} />
          </div>
        )}

        {/* Main Content */}
        <div className="cards-container">
          {/* Visual Support Panel (Mobile) */}
          {isMobile && activeVisual && (
            <VisualSupportPanel activeVisual={activeVisual} isMobile={true} />
          )}

          {/* Progress Cards */}
          <div className="cards-list">
            {cards.map(card => (
              <ProgressiveCard
                key={card.id}
                card={card}
                formData={formData}
                onFieldChange={handleFieldChange}
                onCardComplete={handleCardComplete}
              />
            ))}

            {/* Results Card */}
            {showResults && (
              <ResultsCard formData={formData} onReset={handleReset} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Widget initialization function
function initE1Widget(elementId: string, config?: any) {
  const container = document.getElementById(elementId);

  if (!container) {
    console.error(`E1 Widget: Container with id "${elementId}" not found`);
    return null;
  }

  // Store config globally
  if (config) {
    (window as any).E1_WIDGET_CONFIG = config;
  }

  // Create React root and render widget
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <HybridCardSystem />
    </React.StrictMode>
  );

  return root;
}

// Auto-initialize if default container exists
if (typeof window !== 'undefined') {
  // Expose widget API globally
  (window as any).E1Widget = {
    init: initE1Widget,
    version: '2.2.0',
    config: (window as any).E1_WIDGET_CONFIG || {},
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const defaultContainer = document.getElementById('e1-calculator-widget');
      if (defaultContainer) {
        initE1Widget('e1-calculator-widget');
      }
    });
  } else {
    const defaultContainer = document.getElementById('e1-calculator-widget');
    if (defaultContainer) {
      initE1Widget('e1-calculator-widget');
    }
  }
}

// Export for webpack UMD
export default {
  init: initE1Widget,
  version: '2.2.0',
};

export { initE1Widget };