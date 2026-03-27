import { StyleSheet } from 'react-native';

const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.12)';

export { GLASS_BG, GLASS_BORDER, GREEN, GREEN_BG };

export const styles = StyleSheet.create({
  dataLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataRowTotal: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
  },
  dataValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  imageBadge: {
    backgroundColor: 'rgba(74,222,128,0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  imageBadgeText: {
    color: '#052e16',
    fontSize: 11,
    fontWeight: '700',
  },
  imageContainer: {
    borderRadius: 14,
    height: 175,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageOverlay: {
    backgroundColor: 'rgba(3,15,9,0.3)',
    bottom: 0,
    height: 50,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  infoBody: {
    color: 'rgba(74,222,128,0.6)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  infoBox: {
    alignItems: 'flex-start',
    backgroundColor: GREEN_BG,
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 2,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 10,
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 19,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 14,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  section: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  subSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  subSectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: GREEN,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  totalValue: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '800',
  },
});
