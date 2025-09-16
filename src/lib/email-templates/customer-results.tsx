// Text-only customer email template
export function generateCustomerEmailText(): string {
  return (
    'Hei,\n\n' +
    'Kiitos kiinnostuksestasi Energiaykkösen säästölaskuriin. ' +
    'Sähköpostin liitteenä säästölaskelma antamiesi tietojen perusteella.\n\n' +
    'Ystävällisin terveisin,\n' +
    'Energiaykkönen Oy\n\n' +
    '(sähköpostin liite)'
  );
}
