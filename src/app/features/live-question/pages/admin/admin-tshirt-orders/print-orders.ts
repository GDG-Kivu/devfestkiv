import { TshirtOrderData } from '../../../../event/services/tshirt-order.service';

const printStyles = `
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #202a23; font: 13px Arial, sans-serif; }
  .toolbar { padding: 14px 24px; background: #f3f6fa; }
  button { padding: 10px 18px; border: 0; background: #e8c270; color: #202a23; font: inherit; font-weight: bold; cursor: pointer; }
  button:focus-visible { outline: 3px solid #00458f; outline-offset: 2px; }
  main { padding: 28px 24px; }
  h1 { margin: 0 0 8px; font-size: 24px; }
  p { margin: 0 0 20px; color: #49534d; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; }
  th, td { padding: 8px 6px; border-bottom: 1px solid #ccc; vertical-align: top; overflow-wrap: anywhere; }
  thead { display: table-header-group; }
  thead th { border-bottom: 2px solid #202a23; }
  tr { break-inside: avoid; }
  .table-container { overflow-x: auto; }
  @media screen { table { min-width: 760px; } }
  @media print { .toolbar { display: none; } main { padding: 0; } .table-container { overflow: visible; } }
`;

export function renderOrdersPrintPreview(
  doc: Document,
  edition: string,
  orders: TshirtOrderData[],
  scope: 'selection' | 'filtered',
  print: () => void,
): void {
  doc.title = `Commandes T-shirts - ${edition}`;
  doc.documentElement.lang = 'fr';
  const style = doc.createElement('style');
  style.textContent = printStyles;
  doc.head.appendChild(style);

  const toolbar = doc.createElement('div');
  toolbar.className = 'toolbar';
  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = 'Imprimer / Enregistrer en PDF';
  button.addEventListener('click', print);
  toolbar.appendChild(button);

  const main = doc.createElement('main');
  const heading = doc.createElement('h1');
  heading.textContent = 'Commandes T-shirts';
  const summary = doc.createElement('p');
  summary.textContent = `Édition ${edition} · ${orders.length} commande(s) · ${scope === 'selection' ? 'Sélection' : 'Liste filtrée'}`;
  const container = doc.createElement('div');
  container.className = 'table-container';
  const table = doc.createElement('table');
  const header = table.createTHead().insertRow();
  for (const label of ['Participant', 'Téléphone', 'Tailles', 'Total', 'Retrait', 'Attribuée à', 'Remise', 'Contact WhatsApp']) {
    const th = doc.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    header.appendChild(th);
  }
  const tbody = table.createTBody();
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'] as const;
  for (const order of orders) {
    const quantities = sizes.map(size => Number(order.sizes?.[size]) || 0);
    const cells = [
      `${order.name}\n${order.email}`,
      order.phone,
      sizes.map((size, index) => `${size}: ${quantities[index]}`).join(' · '),
      String(quantities.reduce((total, quantity) => total + quantity, 0)),
      [order.location, order.commune, order.place].filter(Boolean).join(' · '),
      order.assignedToName || order.assignedToEmail || 'Non attribuée',
      order.delivered ? 'Livrée' : 'En attente',
      order.contacted ? 'Contacté' : 'Non contacté',
    ];
    const row = tbody.insertRow();
    for (const value of cells) {
      const cell = row.insertCell();
      cell.textContent = value;
      cell.style.whiteSpace = 'pre-line';
    }
  }
  container.appendChild(table);
  main.append(heading, summary, container);
  doc.body.replaceChildren(toolbar, main);
}
