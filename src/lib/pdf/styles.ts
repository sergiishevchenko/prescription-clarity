export const PRINT_SCHEDULE_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

* {
  box-sizing: border-box;
}

:root {
  font-family: "Inter", Arial, sans-serif;
  color: #111;
  background-color: #fff;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: #f7f7f7;
}

/* Hide print button and no-print elements */
.no-print {
  display: none !important;
  visibility: hidden !important;
}

.print-container {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 12mm 10mm 14mm;
  display: flex;
  flex-direction: column;
  gap: 8mm;
  background-color: #fff;
  color: #000;
}

.print-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10mm;
}

.print-header-left h1 {
  margin: 1mm 0 2mm;
  font-size: 18pt;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.print-header-left p {
  margin: 0;
  font-size: 10pt;
}

.print-week-info {
  margin-top: 2mm;
  font-size: 11pt;
  font-weight: 600;
}

.print-date {
  display: block;
  font-size: 9pt;
  color: #555;
}

.print-qr-wrapper {
  border: 2px solid #000;
  padding: 3mm;
  border-radius: 4mm;
  width: 24mm;
  height: 24mm;
}

.print-table-wrapper {
  border: 1px solid #111;
  border-radius: 3mm;
  overflow: hidden;
  margin-bottom: 8mm;
}

.print-table-wrapper:last-of-type {
  margin-bottom: 0;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 10pt;
}

.print-table th,
.print-table td {
  border: 1px solid #111;
  padding: 2.5mm;
  vertical-align: top;
  break-inside: avoid;
}

.print-table th {
  background: #efefef;
  font-weight: 700;
  text-align: center;
}

.print-table th.time-col,
.print-table td.time-col {
  width: 16mm;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  background: #f7f7f7;
}

.print-table th.meal-col,
.print-table td.meal-col {
  width: 10mm;
  text-align: center;
  vertical-align: middle;
  background: #f7f7f7;
  padding: 2.5mm;
}

.print-table th.meal-col {
  line-height: 1.2;
}

.print-table th.meal-col svg {
  display: inline-block;
  vertical-align: middle;
  width: 14px;
  height: 14px;
}

.print-table td.meal-col {
  line-height: 1;
  position: relative;
  height: auto;
}

.meal-symbol {
  display: block;
  width: 8mm;
  height: 8mm;
  min-width: 8mm;
  min-height: 8mm;
  border-radius: 50%;
  border: 2px solid #000;
  margin: 0 auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.meal-symbol.before {
  background: #fff !important;
  border: 2px solid #000;
}

.meal-symbol.with {
  background: linear-gradient(90deg, #000 0%, #000 50%, #fff 50%, #fff 100%) !important;
  border: 2px solid #000;
}

.meal-symbol.after {
  background: #000 !important;
  border: 2px solid #000;
}

.meal-symbol.anytime {
  background: #fff;
  border: 2px solid #000;
}

.med-item {
  border-bottom: 1px dashed #bbb;
  padding-bottom: 1.4mm;
  margin-bottom: 1.4mm;
  break-inside: avoid;
}

.med-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.med-name {
  font-weight: 600;
  font-size: 10pt;
  display: block;
}

.med-dose {
  font-size: 9pt;
  color: #333;
  display: block;
  margin-top: 0.5mm;
}

.med-quantity {
  font-size: 9pt;
  color: #333;
  display: block;
  margin-top: 0.5mm;
}

.med-instruction {
  margin-top: 1mm;
  font-size: 8.5pt;
  display: flex;
  justify-content: space-between;
}

.med-checkbox-row {
  margin-top: 1mm;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2mm;
}

.med-checkbox-row input[type="checkbox"] {
  width: 4mm;
  height: 4mm;
  border: 1px solid #111;
}

.checkbox-label {
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-cell {
  text-align: center;
  color: #aaa;
  font-style: italic;
}

.print-legend {
  border: 1px solid #111;
  border-radius: 3mm;
  padding: 3mm;
  background: #fafafa;
  font-size: 10pt;
  text-align: center;
  line-height: 1.6;
}

.print-legend strong {
  font-weight: 700;
}

.print-footer {
  border-top: 1.5px solid #111;
  padding-top: 3mm;
  font-size: 8pt;
  text-align: center;
  color: #555;
}

.legend-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5mm;
  height: 5mm;
  border-radius: 50%;
  border: 2px solid #000;
  background: white;
  vertical-align: middle;
  margin: 0 1mm;
}

.legend-symbol.before {
  background: white;
}

.legend-symbol.with {
  background: linear-gradient(90deg, #000 0%, #000 50%, white 50%, white 100%);
}

.legend-symbol.after {
  background: #000;
}

.legend-symbol.anytime {
  border-radius: 0;
  background: #000;
  height: 2px;
  width: 5mm;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  body {
    background: #fff;
  }

  .print-container {
    padding: 4mm;
  }

  .print-table th,
  .print-table td {
    page-break-inside: avoid;
  }
}
`;
