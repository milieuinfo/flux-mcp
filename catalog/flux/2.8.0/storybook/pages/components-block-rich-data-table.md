# Rich Data Table

## Doel

Een tabel op basis van een dynamische lijst van data die uitgebreid kan worden met functionaliteiten om het consumeren
van data door de gebruiker te verbeteren.

De code voorbeelden bij elke story is dezelfde code die gebruikt wordt om de stories te laten werken.
- combineert de functionaliteiten van het [rich-data](/?path=/docs/components-block-rich-data--rich-data-default)-component en [data-table](/?path=/docs/elements-data-table--data-table-default)-component.
- om de velden te configureren kan je gebruik maken van `rich-data-field`

## Voorbeeld

```js
import { RichDataTableComponent } from '@domg-wc/components/block';
```

```html
<vl-rich-data-table>
    <vl-rich-data-field name="id" label="ID" selector="id"></vl-rich-data-field>
    <vl-rich-data-field name="name" label="Naam" selector="name"></vl-rich-data-field>
</vl-rich-data-table>
```

## Default

> Story: [vl-rich-data-table - default](/?path=/story/components-block-rich-data-table--rich-data-table-default)

## Data instellen

Om table `data` in te stellen / bij te werken:

Werk je met statische data (die client side niet gaan wijzigen), dan kan je de data meegeven als string attribuut:
- als je data wil meegeven als attribuut doe je dit in stringified JSON formaat, bv.:

```js
'{"data": [{ "id" : 0, "name" : "Project #1" }, { "id" : 1, "name" : "Project #2"}]}';
```

Wil je client-side mogelijkheden aanbieden om te filteren / pagineren, is het belangrijk dat de data dynamisch zelf update:
- voor filtering & paginatie (zie ook code voorbeelden verder) moet je `.data` dynamisch bijwerken
- refereer `rich-data-table` en stel in: `richDataTable.data = ...`
- geef data door als JavaScript object, bv.:

```json
{
    "data": [
        { "id": 0, "name": "Water", "owner": "Kevin Jansens" },
        { "id": 1, "name": "Vuur", "owner": "Anton Vanherrewege" },
        { "id": 2, "name": "Aarde", "owner": "Hedwig Jansens" }
    ]
}
```

## Sorting

Om sorting te laten werken moet je zelf een sorting algoritme implementeren:

**Code voorbeeld hoe sorting toe te passen**

```ts
export const sortingRichTableImplementation = () => {
    const tableSorter = (table: any) => {
        const originalTableData = [...table.data.data];
        return (event: any) => {
            const { sorting } = event.detail;
            const table = event.target;
            if (sorting) {
                table.data = {
                    data: [...originalTableData].sort((firstEl, secondEl) => {
                        for (let i = 0; i < sorting.length; i++) {
                            const criteria = sorting[i];
                            const firstValue = firstEl[criteria.name];
                            const secondValue = secondEl[criteria.name];
                            const isAscending = criteria.direction === 'asc';
                            if (firstValue < secondValue) {
                                return isAscending ? -1 : 1;
                            } else if (firstValue > secondValue) {
                                return isAscending ? 1 : -1;
                            }
                        }
                        return 0;
                    }),
                    sorting,
                };
            } else {
                table.data = originalTableData;
            }
        };
    };
    customElements.whenDefined('vl-rich-data-table').then(() => {
        const table = document.querySelector('#rich-data-table-sorting');
        if (table) table.addEventListener('change', tableSorter(table));
    });
};

export default sortingRichTableImplementation;
```

Een template voorbeeld vind je hieronder. Klik op `Show code` om de html te zien.

Belangrijk:
- `sortable` toevoegen op de `vl-rich-data-field`-velden waarop gesorteerd moet worden
- om de data te sorteren kan je gebruik maken van `rich-data-sorter`

> Story: [vl-rich-data-table - sorting](/?path=/story/components-block-rich-data-table--rich-data-table-sorting)

## Filter

Om filtering te laten werken, adviseren we `vl-search-filter` te implementeren.
Meer info over `vl-search-filter` [hier](/?path=/docs/elements-search-filter--search-filter-default).

Daarnaast moet je ook de filtering & change detection zelf implementeren.

**Gebruikte mock data in onderstaande voorbeeld**

```ts
export const richDataFilterData = {
    data: [
        {
            id: 0,
            name: 'Wegen',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Sander',
                    lastName: 'Kleykens',
                },
            ],
        },
        {
            id: 1,
            name: 'Water',
            manager: {
                firstName: 'Siegfried',
                lastName: 'Brusselmans',
            },
            medewerkers: [
                {
                    firstName: 'Guy',
                    lastName: 'Wauters',
                },
            ],
        },
        {
            id: 2,
            name: 'Diversiteit',
            manager: {
                firstName: 'Hendrik',
                lastName: 'Vangenechten',
            },
            medewerkers: [
                {
                    firstName: 'Gunther',
                    lastName: 'Jaegers',
                },
            ],
        },
        {
            id: 3,
            name: 'Voetafdrukmeting',
            manager: {
                firstName: 'Pascal',
                lastName: 'De Smet',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 4,
            name: 'Grondwater',
            manager: {
                firstName: 'Julie',
                lastName: 'Meert',
            },
            medewerkers: [
                {
                    firstName: 'Hans',
                    lastName: 'Dhondt',
                },
            ],
        },
        {
            id: 5,
            name: 'Grondwatermeting',
            manager: {
                firstName: 'Julie',
                lastName: 'Meert',
            },
            medewerkers: [
                {
                    firstName: 'Thomas',
                    lastName: 'Kristiaens',
                },
            ],
        },
    ],
};

export default richDataFilterData;
```

**Code voorbeeld hoe filtering toe te passen**

```ts
import richDataFilterData from './vl-rich-data-table-filter.stories-mock';

const data = richDataFilterData;

export const filterRichTableImplementation = () => {
    customElements.whenDefined('vl-rich-data-table').then(() => {
        const element: (Element & { data: any }) | null = document.querySelector('#rich-data-table-filter');
        if (element) {
            element.data = data;
            element.addEventListener('change', (e: any) => {
                let filteredData = [...data.data];
                if (e.detail.formData) {
                    for (const entry of e.detail.formData.entries()) {
                        filteredData = filter(filteredData, entry[0], entry[1]);
                    }
                }
                element.data = {
                    data: filteredData,
                    paging: {
                        currentPage: 1,
                        totalItems: filteredData.length,
                    },
                };
            });
            const filter = (data: any[], pathToKey: string, value: string) => {
                if (value === '') {
                    return data;
                } else {
                    return data.filter((element) => {
                        const valueByPath = findValueByPath(element, pathToKey);
                        return valueByPath.includes(value);
                    });
                }
            };
            const findValueByPath = (element: any, pathToKey: string) => {
                const keys = pathToKey.split('.');
                let current = element;
                for (let i = 0; i < keys.length; i++) {
                    if (current[keys[i]] !== undefined) {
                        current = current[keys[i]];
                    } else {
                        return undefined;
                    }
                }
                return current.toString();
            };
        }
    });
};

export default filterRichTableImplementation;
```

Template voorbeeld vind je hieronder. Klik op `Show code` om de html te zien.

> Story: [vl-rich-data-table - filter](/?path=/story/components-block-rich-data-table--rich-data-table-filter)

## Paginatie

Om paginatie te laten werken, moet je `vl-pager` implementeren. Zie HTML code sample.
Meer info over `vl-pager` [hier](/?path=/docs/components-block-pager--pager-default).

Daarnaast moet je specifieke logica schrijven gerelateerd tot de paginatie om `vl-pager` te laten werken.
In onderstaande code kan je zien op welke manier je filtering & paginatie kan combineren.

**Gebruikte mock data in onderstaande voorbeeld**

```ts
export const richDataFilterPagerData = {
    data: [
        {
            id: 0,
            name: 'Wegen',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Sander',
                    lastName: 'Kleykens',
                },
            ],
        },
        {
            id: 1,
            name: 'Water',
            manager: {
                firstName: 'Siegfried',
                lastName: 'Brusselmans',
            },
            medewerkers: [
                {
                    firstName: 'Guy',
                    lastName: 'Wauters',
                },
            ],
        },
        {
            id: 2,
            name: 'Diversiteit',
            manager: {
                firstName: 'Hendrik',
                lastName: 'Vangenechten',
            },
            medewerkers: [
                {
                    firstName: 'Gunther',
                    lastName: 'Jaegers',
                },
            ],
        },
        {
            id: 3,
            name: 'Voetafdrukmeting',
            manager: {
                firstName: 'Pascal',
                lastName: 'De Smet',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 4,
            name: 'Grondwater',
            manager: {
                firstName: 'Julie',
                lastName: 'Meert',
            },
            medewerkers: [
                {
                    firstName: 'Hans',
                    lastName: 'Dhondt',
                },
            ],
        },
        {
            id: 5,
            name: 'Grondwatermeting',
            manager: {
                firstName: 'Julie',
                lastName: 'Meert',
            },
            medewerkers: [
                {
                    firstName: 'Thomas',
                    lastName: 'Kristiaens',
                },
            ],
        },
        {
            id: 6,
            name: 'Project #7',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 7,
            name: 'Project #8',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 8,
            name: 'Project #9',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 9,
            name: 'Project #10',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 10,
            name: 'Project #11',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 11,
            name: 'Project #12',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 12,
            name: 'Project #13',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 13,
            name: 'Project #14',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 14,
            name: 'Project #15',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 15,
            name: 'Project #16',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 16,
            name: 'Project #17',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 17,
            name: 'Project #18',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 18,
            name: 'Project #19',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 19,
            name: 'Project #20',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 20,
            name: 'Project #21',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 21,
            name: 'Project #22',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 22,
            name: 'Project #23',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 23,
            name: 'Project #24',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
        {
            id: 24,
            name: 'Project #25',
            manager: {
                firstName: 'Pascal',
                lastName: 'Riquier',
            },
            medewerkers: [
                {
                    firstName: 'Pieter',
                    lastName: 'Beckers',
                },
            ],
        },
    ],
};

export default richDataFilterPagerData;
```

**Code voorbeeld hoe paginatie toe te passen**

```ts
import { VlPagerComponent } from '../../pager';
import richDataFilterPagerData from './vl-rich-data-table-pagination.stories-mock';

export const paginationRichTableImplementation = () => {
    customElements.whenDefined('vl-rich-data-table').then(() => {
        const data = richDataFilterPagerData;
        const richTable: (Element & { data: any }) | null = document.querySelector('#rich-data-table-pagination');
        const pager: (Element & VlPagerComponent) | null = document.querySelector('#pager-for-rich-data-table');
        if (richTable && pager) {
            richTable.addEventListener('change', (e: any & { detail: { data: unknown[] } }) => {
                let newData: string | any[] = data.data;
                let totalItems = data.data.length;
                let filterEntries = undefined;
                if (e.detail.formData) {
                    filterEntries = [];
                    for (const entry of e.detail.formData.entries()) {
                        newData = filter(newData, entry[0], entry[1]);
                        totalItems = newData.length;
                        filterEntries.push({
                            name: entry[0],
                            value: entry[1],
                        });
                    }
                }
                if (e.detail.paging) {
                    newData = page(e.detail.paging.currentPage, pager.itemsPerPage, newData);
                }
                richTable.data = {
                    data: newData,
                    paging: {
                        currentPage: e.detail.paging.currentPage,
                        totalItems: totalItems,
                    },
                    filter: filterEntries,
                };
            });
            const page = (page: number, itemsPerPage: number, data: string | any[]) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                return data.slice(start, end);
            };
            richTable.data = {
                data: page(1, 10, data.data),
            };
            const filter = (data: any[], pathToKey: any, value: string) => {
                if (value === '') {
                    return data;
                }
                return data.filter((element) => {
                    const valueByPath = findValueByPath(element, pathToKey);
                    return valueByPath.includes(value);
                });
            };
            const findValueByPath = (element: any, pathToKey: string) => {
                const keys = pathToKey.split('.');
                let current = element;
                for (let i = 0; i < keys.length; i++) {
                    if (current[keys[i]] !== undefined) {
                        current = current[keys[i]];
                    } else {
                        return undefined;
                    }
                }
                return current.toString();
            };
        }
    });
};

export default paginationRichTableImplementation;
```

Template voorbeeld vind je hieronder. Klik op `Show code` om de html te zien.

### Instellen van VlPager component

- op de `vl-pager` component kan je naar keuze:
    - de begin pagina instellen (`current-page`, in vb. hieronder op `1`)
    - het aantal records per pagina instellen (`items-per-page`, in vb. hieronder op `10`)
- het is echter belangrijk dat `total-items` dynamisch update met het aantal records naargelang de huidige staat van je
  data

> Story: [vl-rich-data-table - filter and pagination](/?path=/story/components-block-rich-data-table--rich-data-table-filter-and-pagination)

## Selecteerbare rijen

Hieronder vind je een voorbeeld van hoe je rijen selecteerbaar kan maken, met een custom header voor de selectie acties.

**Code voorbeeld van een implementatie met selecteerbare rijen**

```ts
import { VlButtonComponent } from "@domg-wc/components/atom";
import { VlCheckboxComponent } from "@domg-wc/components/form";
import { vlAccessibilityStyles } from "@domg-wc/styles";
import { VlRichDataTable } from "../vl-rich-data-table.component";

type MyDataItem = { selected: boolean; name: string; extension: string; filesize: string };
type MyData = MyDataItem[];

type SelectableRichTableImplementation = {
    checkActions: () => void,
    headerTemplate: () => HTMLTableCellElement,
    dataFieldRenderer: (td: HTMLTableCellElement, { selected, name }: MyDataItem) => void,
    applySelectionToAllRows: (selected: boolean) => void,
}

export const selectableRichTableImplementation = (): SelectableRichTableImplementation => {
    const headerCheckbox: VlCheckboxComponent = document.createElement('vl-checkbox');
    headerCheckbox.setAttribute('label', 'Selecteer alles');

    const getHeaderCheckboxInput = (): HTMLInputElement =>
        headerCheckbox.shadowRoot!.querySelector<HTMLInputElement>('input')!;

    const getTable = (): VlRichDataTable | null =>
        document.querySelector<VlRichDataTable>('#rich-data-table-selectable');

    const getTableData = (): MyData => {
        return (getTable()?.data.data || []) as MyData;
    };

    const applySelectionToAllRows = (selected: boolean): void => {
        getHeaderCheckboxInput().indeterminate = false;
        const table = getTable();
        if (!table) return;
        const tableData = getTableData();
        table.data = { ...table.data, data: [...tableData.map((item) => ({ ...item, selected }))] };
    };

    const handleSelectAllToggle = (e: Event): void => {
        const {
            detail: { checked },
        } = e as CustomEvent<{ checked: boolean }>;
        applySelectionToAllRows(checked);
    };

    const getSelection = (): MyData => getTableData().filter((item) => item.selected);

    const checkActions = (): void => {
        const selection = getSelection();
        const selectionCount = selection.length;
        const hasSelection = selectionCount > 0;

        document.querySelector('#default-actions')?.toggleAttribute('hidden', hasSelection);
        document.querySelector('#selection-actions')?.toggleAttribute('hidden', !hasSelection);

        const removeSelectionButton = document.querySelector<VlButtonComponent>('#remove-selection');
        const selectionStatus = document.querySelector<VlButtonComponent>('#selection-status');

        if (removeSelectionButton && selectionStatus) {
            const selectionText = `${selectionCount} item${selectionCount !== 1 ? 's' : ''} geselecteerd`;
            selectionStatus.innerText = selectionText;
            removeSelectionButton.innerText = selectionText;
            return;
        }

        if (!hasSelection && headerCheckbox) {
            getHeaderCheckboxInput()?.focus();
            return;
        }
    };

    const dataFieldRenderer = (td: HTMLTableCellElement, { selected, name: rowName }: MyDataItem): void => {
        const checkbox: VlCheckboxComponent = document.createElement('vl-checkbox');
        checkbox.setAttribute('label', `Selecteer ${rowName}`);
        checkbox.toggleAttribute('checked', selected);
        checkbox.addEventListener('vl-change', (e) => {
            const {
                detail: { checked },
            } = e as CustomEvent<{ checked: boolean }>;

            const tableData = getTableData();
            const rowData = tableData.find(({ name }) => name === rowName);
            if (rowData) rowData.selected = checked;

            if (tableData.every((item) => item.selected)) {
                getHeaderCheckboxInput().checked = true;
                getHeaderCheckboxInput().indeterminate = false;
                return;
            }
            if (tableData.every((item) => !item.selected)) {
                getHeaderCheckboxInput().checked = false;
                getHeaderCheckboxInput().indeterminate = false;
                return;
            }

            getHeaderCheckboxInput().checked = false;
            getHeaderCheckboxInput().indeterminate = true;
        });
        td.appendChild(checkbox);
    };

    const headerTemplate = (): HTMLTableCellElement => {
        const td: HTMLTableCellElement = document.createElement('td');
        const headerLabel = document.createElement('span');
        headerLabel.setAttribute('class', 'vl-visually-hidden');
        headerLabel.innerText = 'Maak selectie';
        td.innerHTML = `<style>${vlAccessibilityStyles}</style>`;
        td.appendChild(headerLabel);
        td.appendChild(headerCheckbox);
        requestAnimationFrame(() => {
            headerCheckbox.addEventListener('vl-change', handleSelectAllToggle);
        });
        return td;
    };

    return {
        checkActions,
        headerTemplate,
        dataFieldRenderer,
        applySelectionToAllRows,
    }
};

export default selectableRichTableImplementation;
```

Template voorbeeld van een implementatie met selecteerbare rijen. Klik op `Show code` om de html te zien.

> Story: [vl-rich-data-table - selectable](/?path=/story/components-block-rich-data-table--rich-data-table-selectable)

## Configuratie

> API: vl-rich-data-field, vl-rich-data-sorter, vl-rich-data-table

## Referenties

### Digitaal Vlaanderen

Digitaal Vlaanderen bied geen component aan voor de Rich Data Table maar wel beperkte functionaliteit voor de Data
table. Die nemen we over, daarnaast volgen we ook de styling van de Data Table.

[Documentatie Digitaal Vlaanderen - Rich Data Table](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-data-table)

### Legacy Documentatie

[Legacy Documentatie - Rich Data Table](https://webcomponenten.omgeving.vlaanderen.be/doc/VlRichDataTable.html)
[Legacy Demo - Rich Data Table](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-rich-data-table.html)
