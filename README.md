# Portfolio Sebastiana Paszka

Responsywne portfolio w języku angielskim i polskim. Motyw jasny i ciemny, opisy projektów, powiększanie podglądów, kontakt e-mail oraz CV. Zdjęcie jest kolorowe i ma delikatny efekt po najechaniu.

## Uruchomienie

Otwórz `index.html` w przeglądarce. Cała strona jest statyczna — nie wymaga Node.js, instalowania pakietów ani kluczy API. Kopiowanie adresu e-mail działa na hostingu HTTPS; lokalnie można użyć linku e-mail.

## GitHub Pages

Gotowe pliki strony znajdują się bezpośrednio w katalogu głównym repozytorium.

1. Wgraj zawartość tej paczki do repozytorium `Sebecznik/portfolio`, zachowując strukturę katalogów. Wgrywaj rozpakowane pliki, nie sam ZIP.
2. Jeśli aktualizacja jest dostarczona jako pull request, scal go do `main`.
3. W repozytorium otwórz **Settings → Pages**.
4. Ustaw **Source: Deploy from a branch**, gałąź **main** i katalog **/(root)**, a następnie **Save**. Jeśli taki wariant jest już ustawiony, nie trzeba zmieniać konfiguracji.
5. Status publikacji jest dostępny na karcie **Actions**. Standardowy adres dla tego repozytorium to `https://sebecznik.github.io/portfolio/`.

Metadane i mapa witryny są już ustawione na ten adres. Plik `.nojekyll` oznacza gotową stronę statyczną.

Oficjalna instrukcja: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Edycja

- `src/content.json` — wszystkie tłumaczenia EN/PL.
- `src/index.html` — szablon strony.
- `src/styles.css` — wygląd, układ mobilny i efekty.
- `src/app.js` — interakcje.
- `src/boot.js` — przywracanie motywu.
- `assets/images/` — zdjęcie, podglądy projektów, favicon i grafika udostępniania.
- `assets/CV-Sebastian-Paszek.pdf` — dostarczony wcześniej plik CV.

Po zmianach w `src/` uruchom:

```sh
python3 scripts/build.py
```

Na Windows możesz użyć `py scripts/build.py`. Następnie dodaj do commita zarówno zmienione pliki źródłowe, jak i wygenerowany `index.html` oraz pliki w `assets/`. Python korzysta wyłącznie z biblioteki standardowej.

Przy zmianie domeny zaktualizuj adres w `src/index.html`, `robots.txt` i `sitemap.xml`, po czym ponownie zbuduj stronę.

## Sprawdzenie

Zweryfikowano składnię JavaScript, kompletność tłumaczeń, lokalne odnośniki i strukturę HTML. Test wizualny w przeglądarce nie był dostępny w środowisku przygotowania. CV jest oryginalnym plikiem przekazanym razem z poprzednią stroną.
