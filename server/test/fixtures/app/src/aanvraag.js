// Toont de bevestiging en de samenvatting van een aanvraag.
export function bevestig(data) {
    document.querySelector('#samenvatting-naam').setAttribute('value', data.get('naam') ?? '');
    document.querySelector('#samenvatting-datum').setAttribute('value', data.get('datum') ?? '');
    document.querySelector('#bevestiging').hidden = false;
    document.querySelector('#samenvatting').hidden = false;
}
