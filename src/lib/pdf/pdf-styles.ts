// src/lib/pdf/pdf-styles.ts
import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: '20mm',
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },

  // HEADER SECTION
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    borderBottomStyle: 'solid',
    marginBottom: 30,
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
    fontSize: 20,
    color: '#1f2937',
    fontWeight: 'bold',
    marginBottom: 5,
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
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  customerSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 8,
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
    marginBottom: 8,
  },
  customerLabel: {
    fontSize: 9,
    color: '#6b7280',
    width: 90,
  },
  customerValue: {
    fontSize: 9,
    color: '#1f2937',
    fontWeight: 500,
    flex: 1,
  },

  // COMPARISON SECTION
  comparisonSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  systemBox: {
    backgroundColor: '#ffffff',
    padding: 15,
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
    textAlign: 'center',
  },
  systemSubtitle: {
    fontSize: 9,
    fontWeight: 'normal',
    marginBottom: 15,
    textAlign: 'center',
  },
  costSummary: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
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
    paddingVertical: 6,
    fontSize: 10,
  },
  costRowWithSavings: {
    flexDirection: 'row',
    paddingVertical: 6,
    fontSize: 10,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    paddingVertical: 4,
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
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 9,
  },
  listIcon: {
    color: '#10b981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    color: '#4b5563',
    lineHeight: 1.4,
    fontSize: 9,
  },

  // INFO BOX
  infoBox: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
    borderLeftStyle: 'solid',
    padding: 12,
    marginBottom: 20,
  },
  infoBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  infoBoxContent: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },

  // FOOTER
  footer: {
    position: 'absolute',
    bottom: '15mm',
    left: '20mm',
    right: '20mm',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
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
