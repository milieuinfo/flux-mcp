# 1.1 Tekstalternatieven (alt-tekst)

Geef alle inhoud die niet uit tekst bestaat, ook in de vorm van tekst weer.

**Referenties:**

- [1.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#text-alternatives)
- [1.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#text-alternatives)

## Brons[basis]

### 1.1.1 Niet-tekstuele Content

Niet-tekstuele content is **inhoud die niet uit tekst bestaat**, zoals afbeeldingen, grafieken,
pictogrammen en infographics.

Geef de informatie uit die inhoud ook weer als tekst. Een andere naam daarvoor is **alt-tekst**.

**Referenties:**

- [1.1.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#non-text-content)
- [1.1.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111#non-text-content)

**Voorbeelden:**

vb. 1: [Voeg een aria-label toe waar nodig.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA6)

    ```html
    <div role="region" aria-label="weather portlet">
        ...
    </div>
    ```

vb. 2: [Voeg een aria-labelledby toe waar nodig.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA10)

    ```html
    <div role="img" aria-labelledby="star-id">
        <img src="fullstar.png" alt="">
        <img src="fullstar.png" alt="">
        <img src="fullstar.png" alt="">
        <img src="fullstar.png" alt="">
        <img src="emptystar.png" alt="">
    </div>
    <div id="star-id">4 of 5</div>
    ```

vb. 3: [Voeg een tekst alternatief toe op 1 item in een groep.](https://www.w3.org/WAI/WCAG22/Techniques/general/G196)

    ```html
    <p>Rating:
        <img src="star-filled" alt="3 out of 5 stars">
        <img src="star-filled" alt="">
        <img src="star-filled" alt="">
        <img src="star-empty" alt="">
        <img src="star-empty" alt="">
    </p>
    ```

vb. 4: [Combineer een image met tekst.](https://www.w3.org/WAI/WCAG22/Techniques/html/H2)

    ```html
    <a href="products.html">
        <img src="icon.gif" alt="">Products page
    </a>
    ```

vb. 5: [Voeg een alt-attribuut toe aan een image.](https://www.w3.org/WAI/WCAG22/Techniques/html/H37)

    ```html
    <img src="newsletter.gif" alt="Free newsletter. Get free recipes, news, and more. Learn more.">
    ```

vb. 6: [Gebruik de inhoud van de object tag.](https://www.w3.org/WAI/WCAG22/Techniques/html/H53)

    ```html
    <object classid="https://www.example.com/analogclock.py">
        <p>Here is some text that describes the object and its operation.</p>
    </object>
    ```

vb. 7: [Bied tekst alternatieven voor emoji's, emoticons, ASCII-art en leetspeak.](https://www.w3.org/WAI/WCAG22/Techniques/html/H53)

    ```html
    <p>I smiled at my friend and gestured
        <span aria-label="you" role="img">👉🏾</span>
        <span aria-label="rock" role="img">🤘🏾</span>!
    </p>
    ```
