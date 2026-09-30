# 1.4 Onderscheidbaar

Zorg ervoor dat gebruikers makkelijk belangrijke informatie kunnen onderscheiden.

Maak het voor gebruikers gemakkelijker om inhoud te horen en te zien en maak het onderscheid tussen
voorgrond en achtergrond duidelijk.

**Referenties:**

- [1.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#distinguishable)
- [1.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#distinguishable)

## Brons[basis]

### 1.4.1 Gebruik van kleur

Gebruik je kleuren om informatie mee te geven of onderdelen te onderscheiden? Maak de info of het
onderscheid dan **ook op een andere manier** duidelijk.

Zo zorg je dat mensen die bepaalde kleuren minder goed zien een andere manier hebben om de informatie te
begrijpen.

**Referenties:**

- [1.4.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#use-of-color)
- [1.4.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#use-of-color)

**Voorbeelden:**

vb. 1: [Zorg dat informatie die zichtbaar is door kleurverschillen ook tekstueel beschikbaar is.](https://www.w3.org/WAI/WCAG22/Techniques/general/G14)

vb. 2: [Voeg tekstueel een hint toe bij gekleurde labels.](https://www.w3.org/WAI/WCAG22/Techniques/general/G205)

    ```html
    <style>
        .required {
        color: #ec0000;
    }
    </style>
    <label for="lastname" class="required">Last name (required):</label>
    <input autocomplete="family-name" id="lastname" type="text" value="">
    ```

## Brons[plus]

### 1.4.2 Geluidsbediening

Heb je inhoud met geluid dat vanzelf afspeelt en langer duurt dan 3 seconden? Zorg ervoor dat je gebruikers
dat kunnen **op pauze zetten, stoppen of stiller zetten**.

Zo kunnen gebruikers je webpagina bezoeken met een schermlezer zonder last te hebben van dat geluid.

**Referenties:**

- [1.4.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#audio-control)
- [1.4.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#audio-control)

## Zilver[basis]

### 1.4.3 Contrast (minimum)

Gebruik genoeg **contrast tussen** de **kleur van de voorgrond en achtergrond** van je tekst en afbeeldingen. Zorg dat iedereen alles goed kan lezen.

- Standaardtekst en afbeeldingen van tekst: contrastverhouding van minstens 4,5:1.
- Grote tekst en afbeeldingen van grote tekst (18 punten of 14 punten in het vet): contrastverhouding
                       van minstens 3:1.

**Referenties:**

- [1.4.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#contrast-minimum)
- [1.4.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#contrast-minimum)

### 1.4.4 Herschalen van tekst

Zorg ervoor dat gebruikers je **tekst tot 200% kunnen groter maken**. Tegelijk moeten ze alle
inhoud nog altijd goed kunnen lezen en de pagina nog altijd goed kunnen gebruiken.

Zo kunnen ook slechtziende gebruikers de inhoud gemakkelijk lezen.

**Referenties:**

- [1.4.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#resize-text)
- [1.4.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#resize-text)

### 1.4.5 Afbeeldingen van tekst

Geef **geen tekst als deel van een afbeelding** weer. Je kan die dan niet in een groter
lettertype weergeven. Als je de afbeelding dan maar vergroot, worden de letters wel groter, maar minder
duidelijk.

**Referenties:**

- [1.4.5 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#images-of-text)
- [1.4.5 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#images-of-text)

### 1.4.10 Reflow

Zorg dat alle inhoud op het scherm past.

De inhoud moet altijd ‘teruglopen’. Dat betekent dat hij **over de hele breedte van je beeldscherm zichtbaar** blijft, welk apparaat je ook gebruikt.

**Referenties:**

- [1.4.10 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#reflow)
- [1.4.10 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#reflow)

### 1.4.11 Contrast van niet-tekstuele content

Alle **onderdelen die niet uit tekst bestaan**, moeten kleuren hebben met **genoeg contrast**, bijvoorbeeld afbeeldingen, knoppen, iconen, grafieken of invoervelden.

Het contrast tussen de kleur van de voorgrond en achtergrond moet ten minste 3:1 zijn.

**Referenties:**

- [1.4.11 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#non-text-contrast)
- [1.4.11 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#non-text-contrast)

### 1.4.12 Tekstafstand

Als gebruikers de **hoogte van tekstregels of de afstand tussen letters of woorden aanpassen**,
mag er geen inhoud verloren gaan. Alles wat de pagina doet, moet ook even goed blijven werken.

Gebruikers kunnen namelijk meer ruimte tussen regels, woorden en letters nodig hebben om tekst beter of
sneller te kunnen lezen.

**Referenties:**

- [1.4.12 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#text-spacing)
- [1.4.12 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#text-spacing)

### 1.4.13 Content bij hover of focus

Je gebruikers moeten de **extra inhoud makkelijk** kunnen **gebruiken, aanzetten of uitschakelen**.

Voorbeelden van extra inhoud:

- Een **pop-up**: een boodschap die over de inhoud van een webpagina verschijnt, vaak
                       via een nieuw venster.
- **Knopinfo**: informatie die je te zien krijgt door met je muis over een bepaald
                       onderdeel te zweven, of met een ander woord, hoveren.

**Referenties:**

- [1.4.13 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#content-on-hover-or-focus)
- [1.4.13 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#content-on-hover-or-focus)
