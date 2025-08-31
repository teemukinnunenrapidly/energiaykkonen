/**
 * Example card component using the global styling system
 * No theme management - just pure CSS classes
 */

interface GlobalStyledCardProps {
  title: string;
  description?: string;
  stepIndicator?: string;
  children: React.ReactNode;
  className?: string;
}

export function GlobalStyledCard({
  title,
  description,
  stepIndicator,
  children,
  className = '',
}: GlobalStyledCardProps) {
  return (
    <div className={`form-card fade-in ${className}`}>
      {stepIndicator && <div className="step-indicator">{stepIndicator}</div>}

      <h2 className="card-title">{title}</h2>

      {description && <p className="card-description">{description}</p>}

      {children}
    </div>
  );
}

/**
 * Example form field component
 */
interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  error?: string;
  success?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function FormField({
  label,
  type = 'text',
  placeholder,
  required = false,
  options = [],
  error,
  success,
  value = '',
  onChange,
}: FormFieldProps) {
  const groupClasses = `form-group ${error ? 'error' : ''} ${success ? 'success' : ''}`;

  return (
    <div className={groupClasses}>
      <label className="form-label">
        {label} {required && '*'}
      </label>

      {type === 'select' ? (
        <select
          className="form-input form-select"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          required={required}
        >
          <option value="">
            {placeholder || `Select ${label.toLowerCase()}`}
          </option>
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          className="form-input form-textarea"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          required={required}
        />
      ) : (
        <input
          type={type}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          required={required}
        />
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}

/**
 * Example usage of the global styled components
 */
export function ExampleFormCard() {
  return (
    <div className="card-system-container">
      {/* Visual Support Panel */}
      <div className="visual-support">
        <h3>Property Information</h3>
        <p>Help content and images go here</p>
      </div>

      {/* Card Stream Panel */}
      <div className="card-stream">
        <GlobalStyledCard
          stepIndicator="Step 1 of 3"
          title="Tell us about your property"
          description="We need some basic information to calculate your energy savings."
        >
          <FormField
            label="Property Type"
            type="select"
            options={['Detached House', 'Semi-detached', 'Apartment', 'Other']}
            required
          />

          <div className="field-row">
            <FormField
              label="Floor Area"
              type="number"
              placeholder="Enter square meters"
              required
            />
            <FormField
              label="Construction Year"
              type="number"
              placeholder="e.g. 1985"
            />
          </div>

          <FormField
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            required
          />

          <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
            <button className="btn btn-primary">Continue</button>
            <button className="btn btn-secondary">Reset</button>
          </div>
        </GlobalStyledCard>
      </div>
    </div>
  );
}
