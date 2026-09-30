# Textarea Rich

## Doel

Gebruik de `textarea-rich` component om een rich textarea veld toe te voegen aan een pagina.

## Voorbeeld

```js
import { VlTextareaRichComponent } from '@domg-wc/components/form';
```

```html
<vl-textarea-rich></vl-textarea-rich>
```

> Story: [vl-textarea-rich - default](/?path=/story/components-form-textarea-rich--textarea-rich-default)

## Configuratie

> API: vl-textarea-rich

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Content Security Policy (CSP)

TinyMCE maakt bij bepaalde tools en plugins gebruik van inline styles.

Hierdoor is het niet mogelijk om deze functionaliteit te gebruiken in een toepassing met een strikte Content Security Policy die `unsafe-inline` blokkeert.

We raden af om `unsafe-inline` toe te laten in de Content Security Policy aangezien dit kan leiden tot security leaks.

[TinyMCE - CSP](https://www.tiny.cloud/docs/tinymce/6/tinymce-and-csp/)

## Varianten

### Toolbar

De TinyMCE toolbar kan geconfigureerd worden door het `toolbar` attribuut te gebruiken.

Bepaalde tools maken gebruik van inline styles, hierdoor werken deze niet in een toepassing met een strikte Content Security Policy (zie sectie [Content Security Policy](#content-security-policy-csp) op deze pagina).

> [!WARNING]
> **Opgelet**
> Sommige tools kan je enkel gebruiken als je de bijhorende plugin hebt geactiveerd.

[TinyMCE - Toolbar buttons](https://www.tiny.cloud/docs/tinymce/6/available-toolbar-buttons/): een overzicht van de tools en de eventueel bijhorende plugins

[TinyMCE - Toolbar configuration](https://www.tiny.cloud/docs/tinymce/6/basic-setup/#toolbar-configuration): meer informatie over toolbar configuratie

Hier vind je specifieke voorbeelden om de tools en bijhorende plugins activeren in onze component voor [links](#link-plugin) en [lists](#lists-plugin).

> Story: [vl-textarea-rich - toolbar](/?path=/story/components-form-textarea-rich--textarea-rich-toolbar)

### Plugins

TinyMCE open source plugins kunnen geconfigureerd worden door het `plugins` attribuut en de `customConfig` property te gebruiken.

Aan het `plugins` attribuut kan je een lijst van plugins meegeven die je wil gebruiken. Je moet deze instellen om bepaalde tools te kunnen gebruiken (voorbeelden vind je hier: [link](#link-plugin) en [lists](#lists-plugin)).

Aan de `customConfig` property kan je een object meegeven met de configuratie van de plugins.

Aangezien we de open source versie van TinyMCE gebruiken, kan je geen gebruik maken van de premium plugins.

Bepaalde plugins maken gebruik van inline styles, hierdoor werken deze niet in een toepassing met een strikte Content Security Policy (zie sectie Content Security Policy op deze pagina).

[TinyMCE - Plugin configuration](https://www.tiny.cloud/docs/tinymce/6/basic-setup/#plugin-configuration)

[TinyMCE - Open source plugins](https://www.tiny.cloud/docs/tinymce/6/plugins/#open-source-plugins)

> Story: [vl-textarea-rich - plugins](/?path=/story/components-form-textarea-rich--textarea-rich-plugins)

#### lists plugin

Om de `numlist` en `bullist` tools te gebruiken in de toolbar, moet je de `lists` plugin instellen (referentie: [TinyMCE - Lists toolbar buttons](https://www.tiny.cloud/docs/tinymce/6/available-toolbar-buttons/#lists-plugin)).

```html
<vl-textarea-rich
  toolbar="numlist bullist"
  plugins="lists"
></vl-textarea-rich>
```

#### link plugin
Om de `link` tool in de toolbar te gebruiken, moet je de `link` plugin instellen (referentie: [TinyMCE - Link toolbar buttons](https://www.tiny.cloud/docs/tinymce/6/available-toolbar-buttons/#link-plugin)).

```html
<vl-textarea-rich
  toolbar="link"
  plugins="link"
></vl-textarea-rich>
```

## Validatie

Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

## Referenties

### TinyMCE

[Documentatie TinyMCE - 6](https://www.tiny.cloud/docs/tinymce/6/)
