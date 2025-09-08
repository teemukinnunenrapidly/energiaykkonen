// src/lib/pdf/pdf-styles.ts
import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: '12mm', // Further reduced to save more space
    paddingBottom: '10mm', // Even less at bottom
    fontFamily: 'Helvetica',
    fontSize: 9, // Further reduced for more space
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },

  // HEADER SECTION
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8, // Further reduced
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    borderBottomStyle: 'solid',
    marginBottom: 15, // Further reduced
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.3,
  },
  documentTitle: {
    fontSize: 16, // Further reduced
    color: '#1f2937',
    fontWeight: 'bold',
    marginBottom: 2, // Minimal margin
  },
  documentSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  documentDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  documentNumber: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 3,
  },

  // CUSTOMER INFO SECTION
  customerSection: {
    backgroundColor: '#f9fafb',
    padding: 10, // Further reduced
    marginBottom: 15, // Further reduced
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  customerSectionTitle: {
    fontSize: 9, // Further reduced
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8, // Further reduced
    paddingBottom: 4, // Further reduced
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  customerColumns: {
    flexDirection: 'row',
    gap: 30,
  },
  customerColumn: {
    flex: 1,
  },
  customerRow: {
    flexDirection: 'row',
    marginBottom: 4, // Further reduced
  },
  customerLabel: {
    fontSize: 8, // Reduced
    color: '#6b7280',
    width: 85, // Slightly narrower
  },
  customerValue: {
    fontSize: 8, // Reduced
    color: '#1f2937',
    fontWeight: 500,
    flex: 1,
  },

  // COMPARISON SECTION
  comparisonSection: {
    marginBottom: 15, // Further reduced
  },
  sectionTitle: {
    fontSize: 10, // Further reduced
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10, // Further reduced
    paddingBottom: 3, // Further reduced
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 15, // Reduced from 20
  },
  column: {
    flex: 1,
  },
  systemBox: {
    backgroundColor: '#ffffff',
    padding: 10, // Further reduced
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  systemBoxCurrent: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  systemBoxNew: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  systemTitle: {
    fontSize: 10, // Reduced from 11
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2, // Reduced from 3
    textAlign: 'center',
  },
  systemSubtitle: {
    fontSize: 8, // Reduced from 9
    fontWeight: 'normal',
    marginBottom: 10, // Reduced from 15
    textAlign: 'center',
  },
  costSummary: {
    backgroundColor: '#ffffff',
    padding: 6, // Further reduced
    borderRadius: 4,
    marginBottom: 8, // Further reduced
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  costHeaderWithSavings: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  costHeaderLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  costHeaderValue: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'right',
  },
  costHeaderCenter: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'center',
  },
  costHeaderRight: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'right',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4, // Reduced from 6
    fontSize: 9, // Reduced from 10
  },
  costRowWithSavings: {
    flexDirection: 'row',
    paddingVertical: 4, // Reduced from 6
    fontSize: 9, // Reduced from 10
  },
  costRowHighlight: {
    backgroundColor: '#fafafa',
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  costLabel: {
    flex: 1,
    color: '#6b7280',
  },
  costValue: {
    color: '#1f2937',
    fontWeight: 'bold',
  },
  costCenter: {
    flex: 1,
    textAlign: 'center',
    color: '#1f2937',
    fontWeight: 'bold',
  },
  savingsColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  negative: {
    color: '#ef4444',
  },
  positive: {
    color: '#10b981',
  },
  elyNote: {
    fontSize: 8,
    color: '#059669',
    fontWeight: 500,
  },
  elyNoteDescription: {
    fontSize: 7,
    color: '#059669',
    lineHeight: 1.3,
    paddingTop: 8,
    marginTop: 4,
  },
  systemDetails: {
    marginTop: 6, // Further reduced
    paddingTop: 6, // Further reduced
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8, // Reduced
    paddingVertical: 3, // Reduced
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 8,
  },
  detailValue: {
    color: '#4b5563',
    fontSize: 8,
  },
  detailNote: {
    fontSize: 7,
    color: '#9ca3af',
    lineHeight: 1.3,
    fontStyle: 'italic',
    paddingVertical: 4,
    marginBottom: 4,
  },

  // LIST ITEMS
  listContainer: {
    marginBottom: 12, // Further reduced
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4, // Reduced from 6
    fontSize: 8, // Reduced from 9
  },
  listIcon: {
    color: '#10b981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    color: '#4b5563',
    lineHeight: 1.3, // Reduced from 1.4
    fontSize: 8, // Reduced from 9
  },

  // INFO BOX
  infoBox: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 3,
    borderLeftColor: '#6b7280',
    borderLeftStyle: 'solid',
    padding: 8, // Further reduced
    marginBottom: 10, // Further reduced
  },
  infoBoxTitle: {
    fontSize: 9, // Reduced from 10
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3, // Reduced from 5
  },
  infoBoxContent: {
    fontSize: 8, // Reduced from 9
    color: '#4b5563',
    lineHeight: 1.3, // Reduced from 1.4
  },

  // FOOTER
  footer: {
    position: 'absolute',
    bottom: '8mm', // Further reduced
    left: '12mm', // Match page padding
    right: '12mm', // Match page padding
    paddingTop: 6, // Further reduced
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
  },
  footerLeft: {
    flex: 1,
  },
  footerCenter: {
    flex: 1,
    textAlign: 'center',
  },
  footerRight: {
    flex: 1,
    textAlign: 'right',
  },

  // Legacy styles kept for compatibility
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  col: {
    flex: 1,
  },
  field: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    width: 100,
  },
  value: {
    fontSize: 9,
    fontWeight: 500,
    flex: 1,
    color: '#111827',
  },
});
