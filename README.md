# Mendeley To Wos

This repository hosts a lightweight tool designed to facilitate the conversion of Mendeley BibTeX files to Web of Science (WOS) BibTeX format. This conversion process streamlines the integration of academic literature data, making it compatible with a wider range of analysis tools and platforms. By enabling seamless conversion between these formats, researchers can efficiently perform comprehensive literature analyses and visualize results using libraries such as Bibliometrix (you can upload the resulting file to Bilbioshiny).

## Installation

Ensure you have Node.js and npm installed on your system. You can install the required dependencies by running:

```shell
npm install
```

## Usage

To perform the conversion, replace the `mendeley.bib` file with your own `.bib` file. Then, run the following command:

```shell
npm run convert
```

The output file will be `wos_converted.bib`.

## Notes

- The output file follows the WOS BibText format available [here](https://images.webofknowledge.com/images/help/WOS/hs_output_bibtex_fields.html).
- The tool makes API calls to fetch additional fields from the [CrossRef API](https://api.crossref.org/swagger-ui/index.html#/Works/get_works__doi_).. The code is implemented to handle API rate limits.

## Finally 👌🏻

Feel free to adjust and expand upon these suggestions according to your project's specific needs and preferences!
