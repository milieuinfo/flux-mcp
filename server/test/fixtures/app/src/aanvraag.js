// Toont de bevestiging en de samenvatting van een aanvraag.
export function bevestig(data) {
    document.querySelector('#samenvatting-naam').setAttribute('value', data.get('naam') ?? '');
    document.querySelector('#samenvatting-datum').setAttribute('value', data.get('datum') ?? '');
    document.querySelector('#bevestiging').hidden = false;
    document.querySelector('#samenvatting').hidden = false;
}

// Een ophaaldatum is niet verplicht; is ze er, dan valt ze na de leverdatum. De datums zijn JJJJ-MM-DD.
export function ophaaldatumKlopt(data) {
    const ophaaldatum = data.get('ophaaldatum');
    return !ophaaldatum || ophaaldatum > (data.get('datum') ?? '');
}

// Zoekt een aanvraag op haar nummer. Zonder backend is er nooit een aanvraag.
export function zoek(nummer) {
    return `Geen aanvraag gevonden voor ${nummer}.`;
}
