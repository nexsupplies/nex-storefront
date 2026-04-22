import type { CustomerProfile } from './customer-account'
import type { QuoteHubQuote } from './order-hub'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatPrice(amount?: number | null, currencyCode = 'CAD') {
  if (amount == null) {
    return 'TBD'
  }

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getRecordTitle(record: QuoteHubQuote) {
  return record.source === 'order' ? record.reference : record.quote_number || record.reference
}

function getCustomerName(customer: CustomerProfile) {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim()
  return name || customer.email
}

function buildBaseDocument(title: string, content: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        :root {
          color-scheme: light;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 36px;
          font-family: Geist, Arial, sans-serif;
          color: #111111;
          background: #ffffff;
        }
        .sheet {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
        }
        .doc-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: end;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.3);
        }
        .eyebrow {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.6);
        }
        .doc-title {
          margin: 10px 0 0;
          font-size: 32px;
          line-height: 1.05;
          font-weight: 500;
        }
        .doc-ref {
          text-align: right;
        }
        .doc-ref strong {
          display: block;
          margin-top: 10px;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 500;
        }
        .section {
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.18);
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 10px 20px;
        }
        .meta-grid dt {
          color: rgba(0, 0, 0, 0.58);
          font-size: 12px;
          line-height: 1.5;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .meta-grid dd {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
        }
        .section-title {
          margin: 0 0 14px;
          font-size: 14px;
          line-height: 1.4;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(0, 0, 0, 0.62);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          padding: 11px 0;
          text-align: left;
          vertical-align: top;
          border-bottom: 1px solid rgba(0, 0, 0, 0.14);
          font-size: 14px;
          line-height: 1.5;
        }
        th {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.58);
        }
        .amount {
          text-align: right;
          white-space: nowrap;
        }
        .record {
          page-break-inside: avoid;
        }
        .record + .record {
          margin-top: 28px;
        }
        .summary {
          margin-left: auto;
          width: min(360px, 100%);
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.14);
        }
        .summary-row strong {
          font-weight: 500;
        }
        @media print {
          body {
            padding: 0;
          }
          .sheet {
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">${content}</div>
      <script>window.onload = () => { window.focus(); window.print(); };</script>
    </body>
  </html>`
}

export function openPrintDocument(title: string, html: string) {
  if (typeof window === 'undefined') {
    return
  }

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1120,height=920')

  if (!popup) {
    return
  }

  popup.document.write(html)
  popup.document.close()
}

export function buildOrdersPdfDocument(records: QuoteHubQuote[], customer: CustomerProfile) {
  const content = `
    <header class="doc-header">
      <div>
        <p class="eyebrow">NEX Supplies</p>
        <h1 class="doc-title">Orders Export</h1>
      </div>
      <div class="doc-ref">
        <p class="eyebrow">Account</p>
        <strong>${escapeHtml(getCustomerName(customer))}</strong>
      </div>
    </header>

    <section class="section">
      <dl class="meta-grid">
        <dt>Email</dt>
        <dd>${escapeHtml(customer.email)}</dd>
        <dt>Exported</dt>
        <dd>${escapeHtml(formatDate(new Date().toISOString()))}</dd>
        <dt>Orders</dt>
        <dd>${String(records.length)}</dd>
      </dl>
    </section>

    ${records
      .map(
        (record) => `
          <section class="section record">
            <header class="doc-header" style="padding-bottom: 18px;">
              <div>
                <p class="eyebrow">Order</p>
                <h2 class="doc-title" style="font-size: 24px;">${escapeHtml(getRecordTitle(record))}</h2>
              </div>
              <div class="doc-ref">
                <p class="eyebrow">Status</p>
                <strong style="font-size: 18px;">${escapeHtml(record.status_label)}</strong>
              </div>
            </header>

            <div class="section" style="margin-top: 0; border-top: none; padding-top: 16px;">
              <dl class="meta-grid">
                <dt>Submitted</dt>
                <dd>${escapeHtml(formatDate(record.created_at))}</dd>
                <dt>Fulfillment</dt>
                <dd>${escapeHtml(record.fulfillment_label)}</dd>
                <dt>Payment</dt>
                <dd>${escapeHtml(record.payment_method ? record.payment_method.replace(/_/g, ' ') : 'TBD')}</dd>
                <dt>Destination</dt>
                <dd>${escapeHtml(record.address_summary || record.pickup_location || 'Pending')}</dd>
              </dl>
            </div>

            <div class="section">
              <h3 class="section-title">Materials</h3>
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Variant</th>
                    <th class="amount">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${record.items
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(item.title)}</td>
                          <td>${escapeHtml(item.variant_title || 'Default variant')}</td>
                          <td class="amount">${String(item.quantity)}</td>
                        </tr>
                      `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="summary">
                <div class="summary-row"><span>Subtotal</span><span>${escapeHtml(formatPrice(record.subtotal, record.currency_code || 'CAD'))}</span></div>
                <div class="summary-row"><span>Shipping</span><span>${escapeHtml(formatPrice(record.shipping_total, record.currency_code || 'CAD'))}</span></div>
                <div class="summary-row"><span>Tax</span><span>${escapeHtml(formatPrice(record.tax_total, record.currency_code || 'CAD'))}</span></div>
                <div class="summary-row"><strong>Total</strong><strong>${escapeHtml(formatPrice(record.total, record.currency_code || 'CAD'))}</strong></div>
              </div>
            </div>
          </section>
        `
      )
      .join('')}
  `

  return buildBaseDocument('Orders Export', content)
}

export function buildPickupSlipDocument(record: QuoteHubQuote, customer: CustomerProfile) {
  const content = `
    <header class="doc-header">
      <div>
        <p class="eyebrow">NEX Supplies</p>
        <h1 class="doc-title">Pickup Slip</h1>
      </div>
      <div class="doc-ref">
        <p class="eyebrow">Order</p>
        <strong>${escapeHtml(getRecordTitle(record))}</strong>
      </div>
    </header>

    <section class="section">
      <dl class="meta-grid">
        <dt>Customer</dt>
        <dd>${escapeHtml(getCustomerName(customer))}</dd>
        <dt>Email</dt>
        <dd>${escapeHtml(customer.email)}</dd>
        <dt>Submitted</dt>
        <dd>${escapeHtml(formatDate(record.created_at))}</dd>
        <dt>Status</dt>
        <dd>${escapeHtml(record.status_label)}</dd>
        <dt>Pickup Location</dt>
        <dd>${escapeHtml(record.pickup_location || record.address_summary || 'Pending confirmation')}</dd>
      </dl>
    </section>

    <section class="section">
      <h2 class="section-title">Materials</h2>
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Variant</th>
            <th class="amount">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${record.items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.title)}</td>
                  <td>${escapeHtml(item.variant_title || 'Default variant')}</td>
                  <td class="amount">${String(item.quantity)}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section class="section">
      <div class="summary">
        <div class="summary-row"><span>Total</span><strong>${escapeHtml(formatPrice(record.total, record.currency_code || 'CAD'))}</strong></div>
        <div class="summary-row"><span>Notes</span><span>${escapeHtml(record.response_note || 'No additional notes.')}</span></div>
      </div>
    </section>
  `

  return buildBaseDocument(`${getRecordTitle(record)} Pickup Slip`, content)
}
