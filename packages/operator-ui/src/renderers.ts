import type { CommandPaletteModel, MobileOperatorCard, OperatorDashboardModel } from "./index.js";
import type { TruthConsoleRow } from "@mgr/legacy-core";

function esc(value:unknown):string{
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function number(value:number|string):string{
  return typeof value==="number"
    ? new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(value)
    : esc(value);
}

export function renderTruthConsole(rows:TruthConsoleRow[]):string{
  const body=rows.map(row=>`
    <tr data-receipt-id="${esc(row.receiptId)}">
      <td>${esc(row.at)}</td>
      <td>${esc(row.actorId)}</td>
      <td>${esc(row.action)}</td>
      <td>${esc(row.executionMode)}</td>
      <td>${esc(row.status)}</td>
      <td>${esc(row.policyDecision)}</td>
      <td>${number(row.approvalCount)}</td>
      <td>${row.providerKey?esc(row.providerKey):""}</td>
      <td>${row.cost===undefined?"":number(row.cost)}</td>
      <td>${row.error?esc(row.error):""}</td>
    </tr>`).join("");

  return `<section class="mgr-truth-console">
    <header><h2>Truth Console</h2></header>
    <div class="mgr-table-scroll">
      <table>
        <thead><tr>
          <th>Time</th><th>Actor</th><th>Action</th><th>Mode</th><th>Status</th>
          <th>Policy</th><th>Approvals</th><th>Provider</th><th>Cost</th><th>Error</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </section>`;
}

export function renderOperatorDashboard(model:OperatorDashboardModel):string{
  const kpis=model.kpis.map(kpi=>`
    <article class="mgr-kpi" data-kpi="${esc(kpi.key)}">
      <span>${esc(kpi.label)}</span>
      <strong>${number(kpi.value)}</strong>
      ${kpi.unit?`<small>${esc(kpi.unit)}</small>`:""}
    </article>`).join("");

  const alerts=model.alerts.map(alert=>`
    <article class="mgr-alert" data-severity="${esc(alert.severity)}">
      <strong>${esc(alert.title)}</strong>
      <p>${esc(alert.description)}</p>
    </article>`).join("");

  return `<main class="mgr-operator-dashboard" data-tenant-id="${esc(model.tenantId)}">
    <header>
      <h1>MGR Operator</h1>
      <time datetime="${esc(model.generatedAt)}">${esc(model.generatedAt)}</time>
    </header>
    <section class="mgr-kpis">${kpis}</section>
    <section class="mgr-alerts">${alerts}</section>
    ${renderTruthConsole(model.truthRows)}
  </main>`;
}

export function renderCommandPalette(model:CommandPaletteModel):string{
  const rows=model.commands.map(command=>`
    <button class="mgr-command" data-command-id="${esc(command.id)}" data-action="${esc(command.action)}">
      <strong>${esc(command.label)}</strong>
      <span>${esc(command.description)}</span>
      <small>${esc(command.risk)}</small>
    </button>`).join("");

  return `<section class="mgr-command-palette">
    <label>
      <span>Command</span>
      <input type="search" value="${esc(model.query)}" autocomplete="off" />
    </label>
    <div class="mgr-command-results">${rows}</div>
  </section>`;
}

export function renderMobileOperator(cards:MobileOperatorCard[]):string{
  const body=cards.map(card=>`
    <article class="mgr-mobile-card" data-type="${esc(card.type)}" data-severity="${esc(card.severity)}">
      <h3>${esc(card.title)}</h3>
      <p>${esc(card.summary)}</p>
      <div class="mgr-mobile-actions">
        ${card.actions.map(action=>`<button data-command="${esc(action.command)}" data-action-id="${esc(action.id)}">${esc(action.label)}</button>`).join("")}
      </div>
    </article>`).join("");

  return `<main class="mgr-mobile-operator">${body}</main>`;
}
