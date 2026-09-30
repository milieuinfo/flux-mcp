# Proza Directive (`vlProza`)

## Doel

Gebruik de `vlProza` directive om een Proza bericht te gebruiken als **attribuut waarde** op eender welke Lit-based
component. Dit is handig wanneer je een Proza bericht wilt gebruiken op plaatsen waar enkel strings geaccepteerd worden,
zoals het `title` attribuut van `vl-alert`.

De directive haalt het bericht asynchroon op via `VlProzaMessage.getMessage()`, strip HTML-tags (retourneert plain
text), en toont een fallback waarde tijdens het laden.

## Import

```ts
import { vlProza } from '@domg-wc/components/block';
```

## Setup

Stel eenmalig het default Proza domein in via `FluxConfig` bij het bootstrappen van je applicatie.
Dit domein wordt gedeeld met `vl-proza-message` en `vl-proza-message-preloader`:

```ts
import { FluxConfig } from '@domg-wc/common';

FluxConfig.setPreferences({ prozaDomain: 'mijn-domein' });
```

Zie ook het [Configuratie](/?path=/docs/recepten-configuratie--documentatie) recept.

## Gebruik

### Basis

Gebruik `vlProza` in een Lit template expressie om een Proza bericht als attribuut waarde te binden:

```html
<vl-alert icon="warning" title=${vlProza('alert.titel')} type="warning"></vl-alert>
```

> Story: [vlProza - default](/?path=/story/components-block-proza-message-proza-directive--proza-directive-default)

### Met parameters

Geef template parameters mee om placeholders (`${parameter.key}`) in het Proza bericht te vervangen:

```ts
vlProza('welkom.titel', { parameters: { naam: 'Jan' } })
```

> Story: [vlProza - met parameters](/?path=/story/components-block-proza-message-proza-directive--proza-directive-met-parameters)

### Met domain override

Gebruik de `domain` optie om het default domein te overschrijven voor een specifieke aanroep:

```ts
vlProza('alert.titel', { domain: 'ander-domein' })
```

> Story: [vlProza - domain override](/?path=/story/components-block-proza-message-proza-directive--proza-directive-domain-override)

## API

### `vlProza(code, options?)`

| Parameter | Type | Verplicht | Beschrijving |
| --- | --- | --- | --- |
| `code` | `string` | ja | De code die het Proza bericht identificeert. |
| `options.domain` | `string` | nee | Override van het default domein. |
| `options.parameters` | `Record<string, string&gt;` | nee | Key/value parameters voor template vervanging. |
| `options.fallback` | `string` | nee | Tekst die getoond wordt tijdens het laden. Default: `code`. |
| `options.baseUrl` | `string` | nee | Optionele base URL voor de Proza API. |

### Default domein via `FluxConfig`

Het default domein wordt geconfigureerd via `FluxConfig.setPreferences({ prozaDomain: '...' })`.
Dit domein wordt gedeeld met `vl-proza-message` en `vl-proza-message-preloader`.
Wanneer een expliciet `domain` in de opties wordt meegegeven, heeft dit voorrang op het `FluxConfig` domein.

## Verschil met `vl-proza-message`

|  | `vl-proza-message` | `vlProza` directive |
| --- | --- | --- |
| **Gebruik** | Als child element | Als attribuut waarde |
| **Output** | HTML (in shadow DOM) | Plain text (HTML-tags gestript) |
| **Editeerbaar** | Ja (edit/refresh knoppen) | Nee |
| **Voorbeeld** | `<vl-proza-message domain="d" code="c"&gt;` | `title=$&#123;vlProza('c')&#125;` |

## Referenties

- [proza-message](/?path=/docs/components-block-proza-message-proza-message--proza-message-default) component
- [proza-message-preloader](/?path=/docs/components-block-proza-message-proza-message-preloader--proza-message-preloader-default) component
