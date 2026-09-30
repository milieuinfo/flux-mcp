# Rich Data

Gebruik de `rich-data` component om een lijst van data te tonen.

## Voorbeeld

```js
import { VlRichData } from '@domg-wc/components/block';
```

```html
<vl-rich-data></vl-rich-data>
```

> Story: [vl-rich-data - default](/?path=/story/components-block-rich-data--rich-data-default)

## Configuratie

> API: vl-rich-data

## Varianten

Een uitgewerkt voorbeeld vind je hier:

> Story: [vl-rich-data - pager](/?path=/story/components-block-rich-data--rich-data-pager)

**klik hier om een voorbeeld implementatie te zien**

```ts
import { Pagination } from '../../pager';
import { RichData, VlRichData } from '../vl-rich-data.component';
import { richDataMockData } from './vl-rich-data.stories-mock';

export const richDataPaginationImplementation = () => {
    customElements.whenDefined('vl-rich-data').then(() => {
        const richDataComponent = document.querySelector('#rich-data') as VlRichData | null;
        const content = richDataComponent?.querySelector('[slot="content"]');
        const sorter = richDataComponent?.querySelector('[slot="sorter"]');
        const pager = richDataComponent?.querySelector('vl-pager');

        const data = richDataMockData;

        let newData: unknown[] | undefined = undefined;

        const setContentData = (data: any[] | undefined, from: number, to: number) => {
            newData = data;
            content.innerHTML = ``;
            data?.slice(from, to).forEach((project) => {
                const now = new Date().toLocaleString();
                const manager = project.manager;
                const medewerker = project.medewerkers[0];
                const html = `
                        <vl-search-result-title>
                            <a href="#">${project.name}</a>
                        </vl-search-result-title>
                        <vl-search-result-text>
                            <time>Gestart op ${now}</time>
                        </vl-search-result-text>
                        <vl-search-result-properties>
                            <label>ID</label>
                            <data>${project.id}</data>
                            <label>Naam manager</label>
                            <data>${manager.lastName}</data>
                            <label>Eerste medewerker</label>
                            <data>${medewerker.lastName}</data>
                            <label>
                                <span>Project o.l.v. <strong>manager</strong></span>
                            </label>
                            <data>
                                <span>${project.name} o.l.v. <strong>${manager.firstName} ${manager.lastName}</strong></span>
                            </data>
                        </vl-search-result-properties>
                  `;
                content.insertAdjacentHTML('beforeend', `<vl-search-result>${html}</vl-search-result>`);
            });
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

        richDataComponent?.addEventListener('change', (event: CustomEvent) => {
            let newData = data.data;
            let totalItems = data.data.length;

            let filterEntries = undefined;
            if (event.detail.formData) {
                filterEntries = [];
                for (const entry of event.detail.formData.entries()) {
                    newData = filter(newData, entry[0], entry[1]);
                    totalItems = newData.length;
                    filterEntries.push({
                        name: entry[0],
                        value: entry[1],
                    });
                }
            }
            const pagination: Pagination = event.detail.paging;
            if (pagination) {
                const from = (pagination.currentPage - 1) * 10;
                setContentData(newData, from, from + 10);
            }
            if (richDataComponent) {
                richDataComponent.data = <RichData>{
                    paging: <Pagination>{
                        currentPage: event.detail.paging.currentPage,
                        totalItems: totalItems,
                    },
                    filter: filterEntries,
                };
            }
        });

        sorter?.addEventListener('vl-change', (event: CustomEvent) => {
            const data = newData;
            event.stopPropagation();
            if (!data) return;
            data.sort((firstElement, secondElement) => {
                const keys = (event.target as HTMLSelectElement)?.value?.split('.');

                if (!keys) {
                    return 0;
                }

                const getValue = (element: unknown) =>
                    keys.reduce((value: any, key) => value[key], element)?.toString() || '';

                const firstValue = getValue(firstElement);
                const secondValue = getValue(secondElement);

                return firstValue.localeCompare(secondValue);
            });
            if (richDataComponent) {
                richDataComponent.data = <RichData>{
                    paging: <Pagination>{
                        currentPage: 1,
                        totalItems: data.length,
                    },
                };
            }
            setContentData(data, 0, 10);
        });

        if (richDataComponent) {
            richDataComponent.data = <any>{
                paging: <Pagination>{
                    currentPage: 1,
                    totalItems: 25,
                },
            };
        }

        setContentData(data.data, 0, pager.getAttribute('items-per-page'));
    });
};
```

**mock data voor voorbeeld kan je hier vinden**

```ts
export const richDataMockData = {
    data: [
        {
            id: 0,
            name: 'Project #1',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Sander', lastName: 'Kleykens' }],
        },
        {
            id: 1,
            name: 'Project #2',
            manager: { firstName: 'Tom', lastName: 'Coemans' },
            medewerkers: [{ firstName: 'Guy', lastName: 'Wauters' }],
        },
        {
            id: 2,
            name: 'Project #3',
            manager: { firstName: 'Tom', lastName: 'Coemans' },
            medewerkers: [{ firstName: 'Guy', lastName: 'Wauters' }],
        },
        {
            id: 3,
            name: 'Project #4',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 4,
            name: 'Project #5',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 5,
            name: 'Project #6',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 6,
            name: 'Project #7',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 7,
            name: 'Project #8',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 8,
            name: 'Project #9',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 9,
            name: 'Project #10',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 10,
            name: 'Project #11',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 11,
            name: 'Project #12',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 12,
            name: 'Project #13',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 13,
            name: 'Project #14',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 14,
            name: 'Project #15',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 15,
            name: 'Project #16',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 16,
            name: 'Project #17',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 17,
            name: 'Project #18',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 18,
            name: 'Project #19',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 19,
            name: 'Project #20',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 20,
            name: 'Project #21',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 21,
            name: 'Project #22',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 22,
            name: 'Project #23',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 23,
            name: 'Project #24',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
        {
            id: 24,
            name: 'Project #25',
            manager: { firstName: 'Pascal', lastName: 'Riquier' },
            medewerkers: [{ firstName: 'Pieter', lastName: 'Beckers' }],
        },
    ],
};
```

## Referenties

### Legacy Documentatie

[Legacy Storybook - Rich Data](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/story/legacy-vl-rich-data--default)

[Legacy Documentatie - Rich Data](https://webcomponenten.omgeving.vlaanderen.be/doc/VlRichData.html)

[Legacy Demo - Rich Data](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-rich-data.html)
