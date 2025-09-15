// Type declarations for CSS files imported as raw strings
declare module '*.css?raw' {
  const content: string;
  export default content;
}
