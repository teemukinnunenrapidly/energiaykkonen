export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'select' | 'radio' | 'checkbox';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled: boolean;
  imageUrl?: string;
  options?: string[];
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
