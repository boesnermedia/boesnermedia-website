// Eleventy-Konfiguration für boesnermedia.de
export default function (eleventyConfig) {
  // Bilder, Skripte, Stile, CMS und Uploads unverändert übernehmen
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  // Schrift Montserrat lokal ausliefern (keine Verbindung zu Google)
  for (const w of [400, 500, 700, 800]) {
    eleventyConfig.addPassthroughCopy({
      [`node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`]: `assets/fonts/montserrat-${w}.woff2`
    });
  }

  // CMS-Programm lokal ausliefern statt von einem fremden Server
  eleventyConfig.addPassthroughCopy({ "node_modules/@sveltia/cms/dist": "admin/cms" });

  eleventyConfig.addFilter("jahr", () => new Date().getFullYear());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
