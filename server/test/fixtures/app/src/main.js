import '@domg-wc/components/atom/button';
import '@domg-wc/components/block/alert';
import '@domg-wc/components/block/description-data';
import '@domg-wc/components/block/functional-header';
import '@domg-wc/components/block/search';
import '@domg-wc/components/form/datepicker';
import '@domg-wc/components/form/input-field';
import { bevestig, ophaaldatumKlopt, zoek } from './aanvraag.js';

const formulier = document.querySelector('#aanvraag');

// De aanvraag gaat niet naar een backend: de toepassing toont meteen de bevestiging en een samenvatting. Een
// ophaaldatum vóór de leverdatum houdt ze tegen.
formulier.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const fout = document.querySelector('#ophaaldatum-fout');
    fout.hidden = ophaaldatumKlopt(data);
    if (fout.hidden) bevestig(data);
});

// Annuleren maakt het formulier leeg, na bevestiging.
document.querySelector('#annuleer').addEventListener('click', () => {
    if (window.confirm('Wil je de aanvraag annuleren?')) formulier.reset();
});

// vl-search stuurt een change-event zodra de zoekterm vastligt.
document.querySelector('#zoek-aanvraag').addEventListener('change', (event) => {
    document.querySelector('#zoekresultaat').textContent = zoek(event.target.value);
});
