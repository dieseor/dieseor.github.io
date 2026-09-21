# dieseor.github.io

Personal academic website of Diego Serrano Ortega — PhD candidate in Statistics for Data
Science, Universidad Carlos III de Madrid. Live at <https://dieseor.github.io>.

Plain HTML and CSS, no build step. Push a file and GitHub Pages serves it a minute later.

```
index.html          About
publications.html   Publications and preprints
talks.html          Talks and posters
teaching.html       Teaching
contact.html        Contact
404.html            Not-found page
assets/style.css    All the styling: colours, type, layout, dark mode
assets/photo.jpg    Portrait, 512x512
docs/               PDFs served by the site
```

The sidebar is repeated verbatim in every page, between the `<!-- sidebar -->` comments;
change a link there and change it in all of them. Colours and typefaces live in the `:root`
block at the top of `assets/style.css`, with the dark palette right below it.
