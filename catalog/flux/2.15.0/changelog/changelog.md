# [2.15.0](https://github.com/milieuinfo/flux-web-components/compare/v2.14.0...v2.15.0) (2026-06-10)


### Bug Fixes

* FLUX-134 - data-prefix hersteld op native HTML-elementen ([05113c7](https://github.com/milieuinfo/flux-web-components/commit/05113c7a3ac15db54b60ebd701216b2c3ac31f88))
* FLUX-134 - dode code zonder effect verwijderd (vl-alert, vl-autocomplete) ([b5c8f83](https://github.com/milieuinfo/flux-web-components/commit/b5c8f83222d1c3c43d28346bb180c4b0f89cca3c))
* FLUX-244 - vl-loader - tekst wordt correct getoond onafhankelijk van de code formattering ([10df2d4](https://github.com/milieuinfo/flux-web-components/commit/10df2d47f2ca12ac371deaaf495f97862fe1eee5))
* FLUX-595 - vl-modal - transform centering vervangen door margin: auto ([d5d7c1e](https://github.com/milieuinfo/flux-web-components/commit/d5d7c1e7f98e2ddc3b9b32bc5c8e58b6a6931839))
* FLUX-623 - vl-search-filter - h2-spacing en geneste-section ([797b4ee](https://github.com/milieuinfo/flux-web-components/commit/797b4ee7b0c25d32431e65dfa000f7f374f2a587))
* FLUX-634 - agents - settings.local.json mergen i.p.v. symlinken ([6880e95](https://github.com/milieuinfo/flux-web-components/commit/6880e95d77cdc37271d4beb1fdd99ac3118ad036))
* FLUX-650 - vl-side-navigation-next - custom TOC scrollt naar headings in shadow DOM ([eb340ba](https://github.com/milieuinfo/flux-web-components/commit/eb340ba0ea7bf3f6eec908e5cc8a7b1c7849e8f0))
* FLUX-663 - vl-select-rich - setSelectedValues() dispatcht nu vl-change-event ([7e1a004](https://github.com/milieuinfo/flux-web-components/commit/7e1a0049b0386ad6bdc6b900f4812231bd687d7e))
* FLUX-674 - vl-link - external icon rechtgezet ([21ce087](https://github.com/milieuinfo/flux-web-components/commit/21ce08795392504f5ad89a8152cd1858c5ac5233))
* FLUX-697 - vl-map-select-actions - actief zolang één layer zichtbaar ([63eef49](https://github.com/milieuinfo/flux-web-components/commit/63eef490e0872a05bb2fc35f8b06aafaa5b9892a))
* FLUX-703 - web-types - hernoeming van de template package.json's ([7179279](https://github.com/milieuinfo/flux-web-components/commit/71792793f50dc5d648c004da03badb5fd2b2580b))
* FLUX-720 - vl-select - reset value bij slot-mutatie zonder selectie ([fd09613](https://github.com/milieuinfo/flux-web-components/commit/fd0961311830b99ae2159f4d0757382b74b515f5))
* vl-tabs - type-only exports zodat Storybook/Vite de barrel kan laden ([1e9f348](https://github.com/milieuinfo/flux-web-components/commit/1e9f348503589d9479cb74538eba99569f7948ff))


### Features

* cypress - experimentele WebKit-ondersteuning in Cypress component-tests ([ba5e875](https://github.com/milieuinfo/flux-web-components/commit/ba5e87571cd4a92cb1842e763a70040dcddfb260))
* FLUX-172 - iconen via glyph-naam i.p.v. hard-coded codepoints ([efe406e](https://github.com/milieuinfo/flux-web-components/commit/efe406e3176b4ec1c48526309eb9a9aab9a975d8))
* FLUX-223 - vl-form-message - success- en annotation-variant ([9da0864](https://github.com/milieuinfo/flux-web-components/commit/9da08645b99aadd01e43f08595e8c1177136d4a8))
* FLUX-235 - vl-http-error-message - uniforme richtlijn standalone gebruik in Storybook ([79dc204](https://github.com/milieuinfo/flux-web-components/commit/79dc2047c5d60517726c38f5acd7973927874396))
* FLUX-463 - vl-popover - max-height met interne scrolling ([e38e135](https://github.com/milieuinfo/flux-web-components/commit/e38e135f2eb4db99ad8598237aa3eaddaf8d2108))
* FLUX-595 - vl-datepicker - anchor-positioning attribuut toegevoegd via Popover API + CSS Anchor Positioning ([69fc071](https://github.com/milieuinfo/flux-web-components/commit/69fc0718ced67105e226241fe5b15d5163e4b549))
* FLUX-620 - vl-functional-header - title-label-attribuut, geen native tooltip meer ([d7586ea](https://github.com/milieuinfo/flux-web-components/commit/d7586eaee2843f6a6431de5ea88345f7cef14466))
* FLUX-645 - form controls - blur-validation attribuut ([af13b22](https://github.com/milieuinfo/flux-web-components/commit/af13b22c1982dc2c77237961f731dcfbd494c623))
* FLUX-672 - vl-input-field-masked - ontbrekende Cleave numeral-opties toegevoegd aan MaskOptions ([61eefcd](https://github.com/milieuinfo/flux-web-components/commit/61eefcdaeb98c575724f7b2f022cd721a755d8bc))
* FLUX-673 - vl-map-wfs-layer - cql-filter met hybride geometry-name ([a2811d4](https://github.com/milieuinfo/flux-web-components/commit/a2811d44b01d8f03399469e316058bf468ae5917))
* FLUX-727 - storybook - Web Universum referenties & links aangepast naar VDS ([8b55e1e](https://github.com/milieuinfo/flux-web-components/commit/8b55e1e1111b148c1c4d0636344cd4709b54b2b5))
