export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'select' | 'radio' | 'checkbox' | 'display';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled: boolean;
  imageUrl?: string;
  options?: string[];
  // Display field specific properties
  displayContent?: string; // Content with shortcodes like "Your savings: [calc:annual-savings]"
  displayStyle?: {
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    fontWeight?: string;
  };
  validation: {
    required: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  collapsible?: boolean;
  imageUrl?: string;
  fields: FormField[];
}

export interface FormPage {
  id: string;
  title: string;
  sections: FormSection[];
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  pages: FormPage[];
}
