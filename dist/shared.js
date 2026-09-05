import {STATUSES,escapeHtml as e} from './model.js';

const paths={book:'<path d="M4 3h12a4 4 0 0 1 4 4v14H7a3 3 0 0 1-3-3V3Z"/><path d="M4 17h16M8 7h8M8 10h6"/>',arrow:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m12 5-7 7 7 7M5 12h15"/>',link:'<path d="M14 3h7v7M21 3l-9 9M10 4H4v16h16v-6"/>'};
export const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.book}</svg>`;
export const status=campaign=>`<span class="status ${e(campaign.status)}">${STATUSES[campaign.status]}</span>`;
