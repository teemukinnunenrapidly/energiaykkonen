/**
 * Email configuration validator
 * Helps diagnose email setup issues
 */

interface EmailConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export function validateEmailConfiguration(): EmailConfigValidation {
  const result: EmailConfigValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // Check Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    result.isValid = false;
    result.errors.push('RESEND_API_KEY environment variable is missing');
    result.suggestions.push('Add RESEND_API_KEY to your .env.local file');
  } else if (!resendApiKey.startsWith('re_')) {
    result.isValid = false;
    result.errors.push(
      'RESEND_API_KEY appears to be invalid (should start with "re_")'
    );
    result.suggestions.push(
      'Check your Resend dashboard for the correct API key'
    );
  } else {
    // API key looks valid
    if (resendApiKey.length < 20) {
      result.warnings.push('RESEND_API_KEY seems unusually short');
    }
  }

  // Note: We can't validate the actual email config here since it's not in env vars
  // This would be done at runtime in the email service

  // Environment-specific checks
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    result.suggestions.push(
      'Ensure your domain is verified in Resend for production'
    );
    result.suggestions.push('Set up proper SPF, DKIM, and DMARC records');
  } else {
    result.suggestions.push('For testing, you can use resend.dev domain');
  }

  // Check if Supabase is configured (emails depend on successful lead insertion)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    result.warnings.push(
      'Supabase not configured - emails depend on successful lead storage'
    );
  }

  return result;
}

export function printEmailConfigStatus(): void {
  const validation = validateEmailConfiguration();

  console.log('\n📧 Email Configuration Status:');
  console.log('================================');

  if (validation.isValid) {
    console.log('✅ Email configuration appears valid');
  } else {
    console.log('❌ Email configuration has issues');
  }

  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (validation.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    validation.suggestions.forEach(suggestion =>
      console.log(`  - ${suggestion}`)
    );
  }

  console.log('\n📖 For setup help, see: EMAIL_SETUP_GUIDE.md');
  console.log('🧪 Test emails: http://localhost:3000/api/test-email\n');
}
