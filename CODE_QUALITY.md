# Code Quality Tools Setup

This project uses several tools to maintain high code quality and consistency.

## 🛠️ **Tools Installed**

### **ESLint**

- **Configuration**: `eslint.config.mjs` (ESLint 9 flat config)
- **Rules**: Next.js recommended + custom quality rules
- **Integration**: Works with Prettier for formatting

### **Prettier**

- **Configuration**: `.prettierrc`
- **Ignore**: `.prettierignore`
- **Format**: Consistent code style across the project

### **Husky**

- **Git Hooks**: Pre-commit checks
- **Version**: v9+ (modern format)
- **Integration**: Runs linting and formatting before commits

### **Lint-Staged**

- **Configuration**: `.lintstagedrc.json`
- **Purpose**: Run tools only on staged files
- **Integration**: Works with Husky for efficient commits

## 📝 **Available Scripts**

```bash
# Linting
npm run lint          # Check for linting issues
npm run lint:fix      # Fix auto-fixable linting issues

# Formatting
npm run format        # Format all files with Prettier
npm run format:check  # Check if files are properly formatted

# Type Checking
npm run type-check    # Run TypeScript compiler check

# Git Hooks
npm run prepare       # Set up Husky (runs automatically)
```

## 🔍 **Pre-commit Checks**

Every commit automatically runs:

1. **ESLint** - Code quality and style rules
2. **Prettier** - Code formatting verification

## 📋 **Code Quality Rules**

### **ESLint Rules**

- `prettier/prettier`: Enforce Prettier formatting
- `@typescript-eslint/no-unused-vars`: No unused variables
- `@typescript-eslint/no-explicit-any`: Warn about `any` usage
- `prefer-const`: Use `const` when possible
- `no-var`: No `var` declarations
- `no-console`: Warn about console statements
- `eqeqeq`: Always use `===` and `!==`
- `curly`: Always use curly braces
- `no-duplicate-imports`: No duplicate imports
- `no-unreachable`: No unreachable code
- `no-unused-expressions`: No unused expressions

### **Prettier Configuration**

- **Semicolons**: Always
- **Quotes**: Single quotes
- **Trailing commas**: ES5 compatible
- **Print width**: 80 characters
- **Tab width**: 2 spaces
- **Bracket spacing**: Yes
- **Arrow function parentheses**: Avoid when possible

## 🚀 **Getting Started**

1. **Install dependencies**: `npm install`
2. **Set up Husky**: `npm run prepare` (automatic)
3. **Start development**: `npm run dev`

## 🔧 **IDE Integration**

### **VS Code / Cursor**

- Install ESLint and Prettier extensions
- Enable "Format on Save" with Prettier
- Enable "Fix on Save" with ESLint

### **Other Editors**

- Configure to use project's ESLint and Prettier configs
- Set up format on save

## 📚 **Best Practices**

1. **Always run `npm run lint` before committing**
2. **Use `npm run format` to fix formatting issues**
3. **Fix linting errors before committing**
4. **Let Husky handle pre-commit checks automatically**

## 🐛 **Troubleshooting**

### **Linting Issues**

```bash
npm run lint:fix    # Auto-fix issues
npm run format      # Fix formatting
```

### **Husky Issues**

```bash
npm run prepare     # Reinstall Husky
```

### **TypeScript Issues**

```bash
npm run type-check  # Check for type errors
```

## 📖 **Documentation**

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Next.js ESLint Configuration](https://nextjs.org/docs/basic-features/eslint)
