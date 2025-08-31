# CardStream Design System

A complete implementation of the CardStream design system based on the `cardstream-design-system.json` specification. This system provides a token-based approach to building consistent, accessible, and beautiful form interfaces with a minimal design philosophy.

## ✨ Design Philosophy

### Minimal Design Principles
- **4px Green Left Border**: Signature brand element on all cards (`#10b981`)
- **Borderless Inputs**: Clean inputs with bottom borders only (2px solid)
- **Uppercase Labels**: Small, spaced labels for sophistication
- **Token-Based**: Every style references design tokens - zero hardcoded values
- **Progressive Disclosure**: Cards unlock in sequence for guided user experience

### Visual Hierarchy
- **Light Weight Typography**: 300 weight for elegant headings
- **Generous Whitespace**: Spacious layout for breathing room
- **Consistent Colors**: Monochromatic palette with green accent
- **Subtle Interactions**: Gentle hover states and smooth transitions

## 🎨 Design Tokens

All styling is driven by design tokens from `cardstream-design-system.json`:

### Color System
```css
--cs-color-brand-primary: #10b981        /* Primary green */
--cs-color-text-primary: #1f2937         /* Dark gray headings */
--cs-color-text-secondary: #6b7280       /* Medium gray body text */
--cs-color-text-tertiary: #9ca3af        /* Light gray labels */
--cs-color-border-default: #e5e7eb       /* Default borders */
--cs-color-border-focus: #10b981         /* Focus state borders */
```

### Typography Scale
```css
--cs-font-size-xs: 11px     /* Labels */
--cs-font-size-sm: 12px     /* Step indicators */  
--cs-font-size-base: 14px   /* Body text, inputs */
--cs-font-size-2xl: 24px    /* Card titles */
--cs-font-size-4xl: 48px    /* Large metrics */
```

### Spacing System
```css
--cs-spacing-1: 4px    /* Tight spacing */
--cs-spacing-2: 8px    /* Small gaps */
--cs-spacing-4: 16px   /* Medium gaps */
--cs-spacing-6: 24px   /* Large gaps */
--cs-spacing-8: 32px   /* Card padding */
```

## 🏗️ Component Architecture

### Container Structure
```tsx
<CardStreamContainer>
  <VisualPanel>
    {/* Contextual help, progress, images */}
  </VisualPanel>
  <CardStream>
    {/* Sequence of cards */}
  </CardStream>
</CardStreamContainer>
```

### Card Types & Variants

#### 1. Form Cards
```tsx
<FormCard
  stepIndicator="Step 1 of 3"
  title="Property Information"
  description="Tell us about your property"
  onSubmit={handleSubmit}
>
  <Field label="Property Type" type="select" options={propertyTypes} />
  <FieldRow>
    <Field label="Floor Area" type="number" />
    <Field label="Construction Year" type="number" />
  </FieldRow>
</FormCard>
```

#### 2. Calculation Cards
```tsx
<CalculationCard
  title="Your Energy Savings"
  badge={{ text: "Excellent", variant: "success" }}
  metrics={[
    { label: "Annual Savings", value: "€1,247" },
    { label: "CO₂ Reduction", value: "2.3", unit: "tonnes/year" }
  ]}
/>
```

#### 3. Info Cards  
```tsx
<InfoCard
  title="Next Steps"
  content="Here's what you can do to start saving energy..."
  icon="💡"
  action={{ text: "Learn More", onClick: handleLearnMore }}
/>
```

#### 4. Action Cards
```tsx
<ActionCard
  title="Complete Your Assessment"
  description="Ready to get your personalized report?"
  primaryAction={{ text: "Get Report", onClick: handleGetReport }}
  secondaryAction={{ text: "Save for Later", onClick: handleSave }}
/>
```

#### 5. Progress Cards
```tsx
<ProgressCard
  title="Assessment Progress"
  steps={[
    { label: "Property Details", complete: true },
    { label: "Energy Analysis", complete: false }
  ]}
  currentStep={1}
  progress={50}
/>
```

## 🚀 Quick Start

### 1. Import Styles
```tsx
// In your main CSS or component
import '/src/styles/cardstream-tokens.css';
```

### 2. Basic Usage
```tsx
import { 
  CardStreamContainer, 
  CardStream, 
  VisualPanel,
  FormCard,
  Field 
} from '@/components/cardstream';

function MyApp() {
  return (
    <CardStreamContainer>
      <VisualPanel>
        <h1>Energy Calculator</h1>
        <p>Calculate your potential savings</p>
      </VisualPanel>
      
      <CardStream>
        <FormCard
          title="Get Started"
          description="Enter your details below"
        >
          <Field 
            label="Email Address" 
            type="email" 
            placeholder="your@email.com" 
          />
        </FormCard>
      </CardStream>
    </CardStreamContainer>
  );
}
```

### 3. Complete Examples
```tsx
import { EnergyCalculatorExample, MinimalFormExample } from '@/components/cardstream';

// Full energy calculator with multi-step flow
<EnergyCalculatorExample />

// Simple contact form demonstrating minimal design
<MinimalFormExample />
```

## 📋 Components Reference

### Form Components

#### Field Component
```tsx
<Field
  label="Property Type"           // Uppercase label with letter spacing
  type="select"                   // text, email, number, select, textarea
  placeholder="Select type"       // Placeholder text
  value={value}                   // Controlled value
  onChange={setValue}             // Change handler
  options={[{value, label}]}      // For select fields
  required={true}                 // Required field indicator
  error={hasError}                // Error state styling
/>
```

#### Input Variants
```tsx
<Input placeholder="Text input" />
<Select>
  <option>Option 1</option>
</Select>
<Textarea placeholder="Message" />
```

### Layout Components

#### Field Row (Side-by-Side)
```tsx
<FieldRow>
  <Field label="First Name" />
  <Field label="Last Name" />
</FieldRow>
```

#### Form Group
```tsx
<FormGroup>
  <Label>Custom Label</Label>
  <Input />
</FormGroup>
```

### Interactive Components

#### Buttons
```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="minimal">Minimal Style</Button>
<Button variant="ghost">Ghost Style</Button>

<ButtonGroup align="center" gap="md">
  <Button variant="primary">Save</Button>
  <Button variant="ghost">Cancel</Button>
</ButtonGroup>
```

#### Badges & Progress
```tsx
<Badge variant="success">Completed</Badge>
<Badge variant="primary">In Progress</Badge>

<ProgressBar value={75} label="75% Complete" />
```

## 🎯 Card States & Variants

### Card States
```tsx
<Card state="active">    {/* Green border + shadow */}
<Card state="complete">  {/* Success border color */}  
<Card state="locked">    {/* Blurred + disabled */}
```

### Card Variants
```tsx
<Card variant="form">         {/* Green left border */}
<Card variant="calculation">  {/* Gradient background */}
<Card variant="info">         {/* Gray background */}
<Card variant="action">       {/* Center-aligned */}
<Card variant="progress">     {/* Progress styling */}
```

## 🎨 Styling Customization

### CSS Custom Properties
```css
/* Override default token values */
:root {
  --cs-color-brand-primary: #your-color;
  --cs-spacing-8: 40px;
  --cs-border-radius-lg: 16px;
}
```

### Component-Specific Styling
```tsx
<Card className="custom-card-class">
  <div style={{ 
    color: 'var(--cs-color-brand-primary)',
    padding: 'var(--cs-spacing-6)'
  }}>
    Custom content
  </div>
</Card>
```

## 📱 Responsive Behavior

### Mobile Adaptations (≤768px)
- **Stacked Layout**: Visual panel moves below card stream
- **Reduced Padding**: Cards use smaller padding (`--cs-spacing-6`)
- **Single Column**: Field rows stack vertically
- **Smaller Typography**: Titles use smaller font sizes

### Responsive Classes
```css
@media (max-width: 768px) {
  .cs-container { flex-direction: column; }
  .cs-field-row { grid-template-columns: 1fr; }
  .cs-card { padding: var(--cs-spacing-6); }
}
```

## ♿ Accessibility Features

### Built-in Accessibility
- **WCAG AA Compliant**: Color contrast ratios meet standards
- **Focus Indicators**: Green outline on focus (2px solid)
- **Semantic HTML**: Proper heading hierarchy and form labels
- **Screen Reader Support**: ARIA attributes and semantic markup
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Enhanced borders in high contrast mode

### Keyboard Navigation
- Tab order follows visual order
- Enter key submits forms
- Escape key clears focus
- Arrow keys navigate select options

## 🎭 Animation System

### Built-in Animations
```tsx
<Card animate>           {/* Reveal animation on mount */}
</Card>

{/* CSS Classes */}
.cs-animate-reveal      /* Slide up from bottom */
.cs-animate-fade-in     /* Fade in */
.cs-animate-slide-up    /* Slide up */
```

### Custom Animations
```css
@keyframes custom-animation {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.custom-animation {
  animation: custom-animation var(--cs-transition-duration-slow) var(--cs-transition-timing-ease);
}
```

## 🔧 Advanced Usage

### Custom Card Types
```tsx
function CustomCalculatorCard({ results }: { results: any }) {
  return (
    <Card variant="calculation" animate>
      <CardHeader title="Your Results" />
      <div className="custom-metrics">
        {results.map(result => (
          <MetricDisplay key={result.id} value={result.value} unit={result.unit} />
        ))}
      </div>
    </Card>
  );
}
```

### Form Validation
```tsx
const [errors, setErrors] = useState({});

<Field
  label="Email"
  type="email"
  error={!!errors.email}
  value={email}
  onChange={(value) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  }}
/>

{errors.email && (
  <div style={{ color: 'var(--cs-color-semantic-error)' }}>
    {errors.email}
  </div>
)}
```

### Multi-Step Flows
```tsx
const [currentStep, setCurrentStep] = useState(0);

const steps = [
  { component: PropertyForm, title: "Property Details" },
  { component: ContactForm, title: "Contact Information" },
  { component: ResultsDisplay, title: "Your Results" }
];

return (
  <CardStream>
    {steps[currentStep].component}
    <ProgressCard
      steps={steps.map(s => s.title)}
      currentStep={currentStep}
      progress={(currentStep / (steps.length - 1)) * 100}
    />
  </CardStream>
);
```

## 🚀 Performance Considerations

### Optimization Tips
- **CSS Import**: Import styles once at app level
- **Component Lazy Loading**: Use React.lazy for large card sets
- **Animation Control**: Disable animations for reduced motion preference
- **Token Caching**: CSS custom properties are cached by browser

### Bundle Size
- **Core CSS**: ~15KB gzipped
- **React Components**: ~8KB gzipped
- **Total**: ~23KB for complete system

## 🤝 Contributing

### Adding New Components
1. Follow existing component patterns
2. Use design tokens exclusively (no hardcoded values)
3. Include TypeScript interfaces
4. Add accessibility attributes
5. Include examples and documentation

### Design Token Updates
1. Update `cardstream-design-system.json`
2. Regenerate CSS custom properties
3. Test all components
4. Update documentation

## 📄 License

MIT License - feel free to use in your projects!