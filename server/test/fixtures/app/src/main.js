import '@domg-wc/components/atom/button';
import '@domg-wc/components/block/alert';
import '@domg-wc/components/block/description-data';
import '@domg-wc/components/block/functional-header';
import '@domg-wc/components/form/datepicker';
import '@domg-wc/components/form/input-field';
import { bevestig } from './aanvraag.js';

// De aanvraag gaat niet naar een backend: de toepassing toont meteen de bevestiging en een samenvatting.
document.querySelector('#aanvraag').addEventListener('submit', (event) => {
    event.preventDefault();
    bevestig(new FormData(event.target));
});
