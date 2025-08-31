/**
 * CardStream Widget for WordPress Integration
 * ALL CSS classes prefixed with 'cardstream-' to avoid theme conflicts
 * Standalone JavaScript widget that creates the global CardStream object
 * Includes all card system logic, form handling, and calculations
 */

(function() {
  'use strict';
  
  // Global CardStream object with required interface
  window.CardStream = {
    version: '1.0.0',
    instances: {},
    
    // Main initialization function - REQUIRED for WordPress integration
    init: function(config) {
      console.log('CardStream.init called with:', config);
      
      const container = document.getElementById(config.container);
      if (!container) {
        console.error('CardStream: Container not found:', config.container);
        return;
      }
      
      // Store instance (for multiple calculators on same page)
      this.instances[config.container] = {
        config: config,
        state: {
          currentStep: 0,
          formData: {},
          isCompleted: false,
          calculationResults: null,
          isLoading: false
        },
        container: container
      };
      
      // Render the app
      this.render(container, config);
    },
    
    // Main render function
    render: function(container, config) {
      const theme = config.config?.cardStreamConfig || {};
      const instance = this.instances[config.container];
      
      // Clear existing content
      container.innerHTML = '';
      
      // Create main wrapper with data attribute for CSS isolation
      const wrapper = document.createElement('div');
      wrapper.className = 'cardstream-container';
      wrapper.setAttribute('data-cardstream', config.container);
      
      // Apply theme colors if provided
      if (theme.colors?.brand?.primary) {
        wrapper.style.setProperty('--cardstream-color-brand-primary', theme.colors.brand.primary);
      }
      
      // Build main layout
      wrapper.innerHTML = `
        <div class="cardstream-layout">
          <div class="cardstream-visual-panel">
            <div class="cardstream-visual-content">
              <div class="cardstream-visual-header">
                <h1 class="cardstream-visual-title">Energy Savings Calculator</h1>
                <p class="cardstream-visual-subtitle">Calculate your potential energy savings and environmental impact</p>
              </div>
              <div class="cardstream-visual-info" id="${config.container}-visual-info">
                <div class="cardstream-info-step">
                  <div class="cardstream-info-icon">🏠</div>
                  <div class="cardstream-info-content">
                    <h3>Property Assessment</h3>
                    <p>Tell us about your property to get accurate recommendations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="cardstream-card-stream" id="${config.container}-stream">
            <div class="cardstream-loading">
              <div class="cardstream-spinner"></div>
              <p>Initializing calculator...</p>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(wrapper);
      
      // Initialize the card stream
      this.initializeCards(container, config, instance);
      
      // Track analytics if enabled
      if (config.analytics && window.gtag) {
        window.gtag('event', 'calculator_rendered', {
          event_category: 'CardStream',
          event_label: config.container
        });
      }
    },
    
    // Initialize card logic
    initializeCards: function(container, config, instance) {
      const streamContainer = container.querySelector(`#${config.container}-stream`);
      const visualInfo = container.querySelector(`#${config.container}-visual-info`);
      
      // Replace loading state with initial form
      setTimeout(() => {
        this.renderStep(streamContainer, visualInfo, instance, 0);
      }, 500);
    },
    
    // Render specific step
    renderStep: function(streamContainer, visualInfo, instance, stepNumber) {
      const { config, state } = instance;
      const theme = config.config?.cardStreamConfig || {};
      
      state.currentStep = stepNumber;
      
      switch (stepNumber) {
        case 0:
          this.renderPropertyForm(streamContainer, visualInfo, instance);
          break;
        case 1:
          this.renderCalculationResults(streamContainer, visualInfo, instance);
          break;
        case 2:
          this.renderEmailForm(streamContainer, visualInfo, instance);
          break;
        case 3:
          this.renderCompletion(streamContainer, visualInfo, instance);
          break;
      }
    },
    
    // Render property information form
    renderPropertyForm: function(streamContainer, visualInfo, instance) {
      const { config } = instance;
      
      // Update visual panel
      visualInfo.innerHTML = `
        <div class="cardstream-info-step">
          <div class="cardstream-info-icon">🏠</div>
          <div class="cardstream-info-content">
            <h3>Property Assessment</h3>
            <p>We'll analyze your property details to provide accurate energy efficiency recommendations.</p>
          </div>
        </div>
      `;
      
      // Render form card
      streamContainer.innerHTML = `
        <div class="cardstream-card cardstream-form-card" data-step="1">
          <div class="cardstream-card-header">
            <span class="cardstream-step-indicator">Step 1 of 3</span>
            <div class="cardstream-card-badge">Property Info</div>
          </div>
          <h2 class="cardstream-card-title">Tell us about your property</h2>
          <p class="cardstream-card-description">We need some basic information to calculate your potential energy savings and provide accurate recommendations.</p>
          
          <form class="cardstream-form" id="${config.container}-property-form">
            <div class="cardstream-form-group">
              <label class="cardstream-label">Property Type</label>
              <select class="cardstream-input cardstream-select" name="propertyType" required>
                <option value="">Select your property type</option>
                <option value="detached">Detached House</option>
                <option value="semi">Semi-detached House</option>
                <option value="terraced">Terraced House</option>
                <option value="apartment">Apartment</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="cardstream-field-row">
              <div class="cardstream-form-group">
                <label class="cardstream-label">Floor Area (m²)</label>
                <input type="number" class="cardstream-input" name="floorArea" placeholder="e.g. 120" required />
              </div>
              <div class="cardstream-form-group">
                <label class="cardstream-label">Construction Year</label>
                <input type="number" class="cardstream-input" name="constructionYear" placeholder="e.g. 1985" />
              </div>
            </div>
            
            <div class="cardstream-form-group">
              <label class="cardstream-label">Current Heating System</label>
              <select class="cardstream-input cardstream-select" name="heatingSystem" required>
                <option value="">Select heating system</option>
                <option value="gas">Gas Boiler</option>
                <option value="oil">Oil Boiler</option>
                <option value="electric">Electric Heating</option>
                <option value="heat-pump">Heat Pump</option>
                <option value="wood">Wood/Biomass</option>
              </select>
            </div>
            
            <div class="cardstream-form-actions">
              <button type="submit" class="cardstream-button cardstream-button-primary" disabled>
                Calculate Savings
              </button>
            </div>
          </form>
        </div>
      `;
      
      // Add form validation and handling
      this.setupFormValidation(streamContainer, instance);
    },
    
    // Render calculation results
    renderCalculationResults: function(streamContainer, visualInfo, instance) {
      const { state, config } = instance;
      const results = state.calculationResults;
      
      // Update visual panel
      visualInfo.innerHTML = `
        <div class="cardstream-info-step">
          <div class="cardstream-info-icon">⚡</div>
          <div class="cardstream-info-content">
            <h3>Energy Analysis</h3>
            <p>Based on your property, here are your potential savings and environmental impact.</p>
          </div>
        </div>
      `;
      
      streamContainer.innerHTML = `
        <div class="cardstream-card cardstream-calculation-card" data-step="2">
          <div class="cardstream-card-header">
            <span class="cardstream-step-indicator">Results</span>
            <div class="cardstream-card-badge cardstream-badge-success">Excellent Potential</div>
          </div>
          <h2 class="cardstream-card-title">Your Energy Savings Potential</h2>
          <p class="cardstream-card-description">Based on your property details, here's what you could save:</p>
          
          <div class="cardstream-metrics">
            <div class="cardstream-metric cardstream-metric-primary">
              <div class="cardstream-metric-label">Annual Savings</div>
              <div class="cardstream-metric-value">€${results.potentialSavings.toLocaleString()}</div>
            </div>
            
            <div class="cardstream-metrics-grid">
              <div class="cardstream-metric">
                <div class="cardstream-metric-label">Current Annual Cost</div>
                <div class="cardstream-metric-value">€${results.currentCost.toLocaleString()}</div>
              </div>
              <div class="cardstream-metric">
                <div class="cardstream-metric-label">CO₂ Reduction</div>
                <div class="cardstream-metric-value">${results.co2Reduction} <span class="cardstream-metric-unit">tonnes/year</span></div>
              </div>
              <div class="cardstream-metric">
                <div class="cardstream-metric-label">Payback Period</div>
                <div class="cardstream-metric-value">${results.paybackPeriod} <span class="cardstream-metric-unit">years</span></div>
              </div>
              <div class="cardstream-metric">
                <div class="cardstream-metric-label">Monthly Savings</div>
                <div class="cardstream-metric-value">€${Math.round(results.potentialSavings / 12)}</div>
              </div>
            </div>
          </div>
          
          <div class="cardstream-form-actions">
            <button type="button" class="cardstream-button cardstream-button-primary" onclick="window.CardStream.nextStep('${config.container}')">
              Get Detailed Report
            </button>
          </div>
        </div>
      `;
    },
    
    // Render email form
    renderEmailForm: function(streamContainer, visualInfo, instance) {
      const { config } = instance;
      
      // Update visual panel
      visualInfo.innerHTML = `
        <div class="cardstream-info-step">
          <div class="cardstream-info-icon">📧</div>
          <div class="cardstream-info-content">
            <h3>Get Your Report</h3>
            <p>Enter your email to receive a comprehensive energy efficiency report with specific recommendations.</p>
          </div>
        </div>
      `;
      
      streamContainer.innerHTML = `
        <div class="cardstream-card cardstream-form-card" data-step="3">
          <div class="cardstream-card-header">
            <span class="cardstream-step-indicator">Step 2 of 3</span>
            <div class="cardstream-card-badge">Contact Info</div>
          </div>
          <h2 class="cardstream-card-title">Get your detailed report</h2>
          <p class="cardstream-card-description">Enter your email to receive a comprehensive energy efficiency report with specific recommendations and next steps.</p>
          
          <form class="cardstream-form" id="${config.container}-email-form">
            <div class="cardstream-form-group">
              <label class="cardstream-label">Email Address</label>
              <input type="email" class="cardstream-input" name="email" placeholder="your@email.com" required />
            </div>
            
            <div class="cardstream-form-group">
              <label class="cardstream-checkbox-wrapper">
                <input type="checkbox" name="newsletter" class="cardstream-checkbox" />
                <span class="cardstream-checkbox-label">I'd like to receive energy efficiency tips and updates</span>
              </label>
            </div>
            
            <div class="cardstream-form-actions">
              <button type="submit" class="cardstream-button cardstream-button-primary" disabled>
                Send My Report
              </button>
            </div>
          </form>
        </div>
      `;
      
      // Setup email form handling
      this.setupEmailForm(streamContainer, instance);
    },
    
    // Render completion state
    renderCompletion: function(streamContainer, visualInfo, instance) {
      const { config } = instance;
      
      // Update visual panel
      visualInfo.innerHTML = `
        <div class="cardstream-info-step">
          <div class="cardstream-info-icon">✅</div>
          <div class="cardstream-info-content">
            <h3>Report Sent!</h3>
            <p>Check your inbox for your personalized energy efficiency recommendations.</p>
          </div>
        </div>
      `;
      
      streamContainer.innerHTML = `
        <div class="cardstream-card cardstream-success-card" data-step="4">
          <div class="cardstream-card-header">
            <div class="cardstream-card-badge cardstream-badge-success">Complete</div>
          </div>
          <h2 class="cardstream-card-title">Report Sent Successfully! 🎉</h2>
          <p class="cardstream-card-description">We've sent your detailed energy efficiency report to your email. Check your inbox for personalized recommendations and next steps.</p>
          
          <div class="cardstream-info-list">
            <div class="cardstream-info-item">
              <div class="cardstream-info-icon">📋</div>
              <div class="cardstream-info-text">Review recommendations in your email</div>
            </div>
            <div class="cardstream-info-item">
              <div class="cardstream-info-icon">🔍</div>
              <div class="cardstream-info-text">Contact certified installers for quotes</div>
            </div>
            <div class="cardstream-info-item">
              <div class="cardstream-info-icon">💰</div>
              <div class="cardstream-info-text">Check available government incentives</div>
            </div>
          </div>
          
          <div class="cardstream-form-actions cardstream-actions-multi">
            <button type="button" class="cardstream-button cardstream-button-primary" onclick="window.CardStream.restart('${config.container}')">
              Start New Assessment
            </button>
            <button type="button" class="cardstream-button cardstream-button-secondary" onclick="window.open('https://example.com/installers', '_blank')">
              Find Installers
            </button>
          </div>
        </div>
      `;
      
      // Track completion
      if (config.analytics && window.gtag) {
        window.gtag('event', 'calculator_completed', {
          event_category: 'CardStream',
          event_label: config.container
        });
      }
    },
    
    // Setup form validation for property form
    setupFormValidation: function(container, instance) {
      const form = container.querySelector(`#${instance.config.container}-property-form`);
      const submitBtn = form.querySelector('button[type="submit"]');
      
      // Real-time validation
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          this.validatePropertyForm(form, submitBtn);
        });
        input.addEventListener('change', () => {
          this.validatePropertyForm(form, submitBtn);
        });
      });
      
      // Form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePropertySubmit(form, instance);
      });
    },
    
    // Validate property form
    validatePropertyForm: function(form, submitBtn) {
      const formData = new FormData(form);
      const propertyType = formData.get('propertyType');
      const floorArea = formData.get('floorArea');
      const heatingSystem = formData.get('heatingSystem');
      
      const isValid = propertyType && floorArea && heatingSystem && 
                     parseFloat(floorArea) > 0;
      
      submitBtn.disabled = !isValid;
    },
    
    // Handle property form submission
    handlePropertySubmit: function(form, instance) {
      const formData = new FormData(form);
      
      // Store form data
      instance.state.formData = {
        propertyType: formData.get('propertyType'),
        floorArea: parseFloat(formData.get('floorArea')),
        constructionYear: formData.get('constructionYear'),
        heatingSystem: formData.get('heatingSystem')
      };
      
      // Show loading state
      form.innerHTML = '<div class="cardstream-loading"><div class="cardstream-spinner"></div><p>Calculating your savings...</p></div>';
      
      // Simulate calculation delay
      setTimeout(() => {
        instance.state.calculationResults = this.calculateSavings(instance.state.formData);
        this.renderStep(
          instance.container.querySelector(`#${instance.config.container}-stream`),
          instance.container.querySelector(`#${instance.config.container}-visual-info`),
          instance,
          1
        );
      }, 2000);
    },
    
    // Setup email form
    setupEmailForm: function(container, instance) {
      const form = container.querySelector(`#${instance.config.container}-email-form`);
      const submitBtn = form.querySelector('button[type="submit"]');
      const emailInput = form.querySelector('input[name="email"]');
      
      // Email validation
      emailInput.addEventListener('input', () => {
        const isValid = this.validateEmail(emailInput.value);
        submitBtn.disabled = !isValid;
      });
      
      // Form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEmailSubmit(form, instance);
      });
    },
    
    // Handle email form submission
    handleEmailSubmit: function(form, instance) {
      const formData = new FormData(form);
      
      // Store email data
      instance.state.formData.email = formData.get('email');
      instance.state.formData.newsletter = formData.get('newsletter') === 'on';
      
      // Show loading state
      form.innerHTML = '<div class="cardstream-loading"><div class="cardstream-spinner"></div><p>Sending your report...</p></div>';
      
      // Simulate email sending
      setTimeout(() => {
        instance.state.isCompleted = true;
        this.renderStep(
          instance.container.querySelector(`#${instance.config.container}-stream`),
          instance.container.querySelector(`#${instance.config.container}-visual-info`),
          instance,
          3
        );
        
        // Here you would normally send the data to your API
        console.log('Form data:', instance.state.formData);
      }, 1500);
    },
    
    // Calculate energy savings (simplified algorithm)
    calculateSavings: function(propertyData) {
      const { floorArea, heatingSystem, constructionYear } = propertyData;
      
      // Base calculations (simplified for demo)
      const baseEnergyUsage = floorArea * 150; // kWh per year
      let costPerKWh = 0.25; // euros
      
      // Heating system multipliers
      const heatingMultipliers = {
        'gas': 0.7,
        'oil': 1.2,
        'electric': 1.5,
        'heat-pump': 0.4,
        'wood': 0.6
      };
      
      // Age factor
      const currentYear = new Date().getFullYear();
      const age = constructionYear ? currentYear - parseInt(constructionYear) : 30;
      const ageFactor = Math.min(1.5, 1 + (age * 0.01));
      
      const currentUsage = baseEnergyUsage * (heatingMultipliers[heatingSystem] || 1) * ageFactor;
      const currentCost = Math.round(currentUsage * costPerKWh);
      
      // Potential improvements
      const potentialSavingsPercentage = 0.4; // 40% potential savings
      const potentialSavings = Math.round(currentCost * potentialSavingsPercentage);
      
      // CO2 calculations (simplified)
      const co2PerKWh = 0.4; // kg CO2 per kWh
      const co2Reduction = Math.round((currentUsage * potentialSavingsPercentage * co2PerKWh) / 1000 * 10) / 10;
      
      // Payback period (simplified)
      const improvementCost = floorArea * 150; // euros
      const paybackPeriod = Math.round((improvementCost / potentialSavings) * 10) / 10;
      
      return {
        currentCost,
        potentialSavings,
        co2Reduction,
        paybackPeriod
      };
    },
    
    // Email validation
    validateEmail: function(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // Navigate to next step
    nextStep: function(containerId) {
      const instance = this.instances[containerId];
      if (instance) {
        const nextStepNumber = instance.state.currentStep + 1;
        this.renderStep(
          instance.container.querySelector(`#${containerId}-stream`),
          instance.container.querySelector(`#${containerId}-visual-info`),
          instance,
          nextStepNumber
        );
      }
    },
    
    // Restart calculator
    restart: function(containerId) {
      const instance = this.instances[containerId];
      if (instance) {
        // Reset state
        instance.state = {
          currentStep: 0,
          formData: {},
          isCompleted: false,
          calculationResults: null,
          isLoading: false
        };
        
        // Re-render from beginning
        this.renderStep(
          instance.container.querySelector(`#${containerId}-stream`),
          instance.container.querySelector(`#${containerId}-visual-info`),
          instance,
          0
        );
      }
    },
    
    // Get instance data (for debugging)
    getInstance: function(containerId) {
      return this.instances[containerId];
    }
  };
  
  // Expose utility functions for debugging
  window._cardStreamDebug = {
    version: window.CardStream.version,
    instances: window.CardStream.instances,
    restart: window.CardStream.restart,
    nextStep: window.CardStream.nextStep
  };
  
  console.log('CardStream widget loaded successfully', window.CardStream.version);
})();