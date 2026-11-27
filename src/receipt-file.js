import { displayDate } from './data';

const units =
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(
    ' '
  );
const tens =
  'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split(' ');
function words(n) {
  if (n < 20) return units[n];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
  for (const [value, name] of [
    [10000000, 'crore'],
    [100000, 'lakh'],
    [1000, 'thousand'],
    [100, 'hundred'],
  ]) {
    if (n >= value)
      return (
        words(Math.floor(n / value)) +
        ' ' +
        name +
        (n % value ? ' ' + words(n % value) : '')
      );
  }
}
export async function receiptImage(record, method = '') {
  const template = new Image();
  template.src = '/modalrecipt/modalrecipt.png';
  await template.decode();
  const canvas = document.createElement('canvas');
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0);
  ctx.fillStyle = '#1b2431';
  ctx.font = '24px Georgia';
  const paise = Math.round(Number(record.amount) * 100);
  const amountText =
    words(Math.floor(paise / 100)) +
    ' rupees' +
    (paise % 100 ? ' and ' + words(paise % 100) + ' paise' : '') +
    ' only';
  const date = displayDate(record.date);
  for (const [text, x, y, width] of [
    [record.id, 55, 220, 180],
    [date, 790, 220, 215],
    [record.donor_name, 260, 300, 680],
    [amountText, 190, 375, 700],
    [record.purpose, 120, 445, 780],
    [method, 200, 512, 245],
    [date, 470, 512, 270],
    ['₹' + record.amount, 85, 605, 260],
  ]) {
    ctx.fillText(String(text || ''), x, y, width);
  }
  return canvas.toDataURL('image/png');
}
export function downloadImage(source, id) {
  const link = document.createElement('a');
  link.href = source;
  link.download = 'Sasta-Trust-Receipt-' + id + '.png';
  link.click();
}
