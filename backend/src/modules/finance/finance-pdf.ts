// Small dependency-free PDF writer for tabular finance exports. Values are
// rendered as text, never interpreted as PDF commands.
function ascii(value: unknown): string {
  return String(value == null ? '' : value).normalize('NFKD').replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&');
}

export function financePdf(title: string, generatedAt: string, filters: Record<string, unknown>, summary: { grossRevenue: number; refundedAmount: number; netRevenue: number }, rows: Record<string, unknown>[], columns: string[]): Buffer {
  const pages: string[] = [];
  const perPage = 43;
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  for (let page = 0; page < pageCount; page++) {
    const lines = [
      'EventFlow | Financial Report',
      title,
      `Generated: ${generatedAt} | Page ${page + 1} of ${pageCount}`,
      `Filters: ${Object.entries(filters).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`,
      `Matching records: ${rows.length}`,
      `Currency: INR | Gross: ${summary.grossRevenue} | Refunded: ${summary.refundedAmount} | Net: ${summary.netRevenue}`,
      '',
      columns.map(column => column.slice(0, 14).padEnd(15)).join(' ').slice(0, 105),
      '-'.repeat(100),
      ...rows.slice(page * perPage, (page + 1) * perPage).map(row => columns.map(column => ascii(row[column]).slice(0, 14).padEnd(15)).join(' ').slice(0, 105)),
    ];
    const content = lines.map((line, index) => `BT /F1 ${index < 2 ? 14 : 8} Tf 38 ${770 - index * 16} Td (${ascii(line)}) Tj ET`).join('\n');
    pages.push(content);
  }
  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };
  const catalog = add('');
  const tree = add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const pageIds: number[] = [];
  for (const content of pages) {
    const contentId = add(`<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${tree} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${tree} 0 R >>`;
  objects[tree - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let output = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(Buffer.byteLength(output, 'ascii'));
    output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output, 'ascii');
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'ascii');
}
