// Eleventy-Konfiguration für boesnermedia.de
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { readFileSync } from "node:fs";

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

  // Fotos automatisch in passenden Größen und als WebP ausliefern (schneller auf dem Handy)
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    widths: [480, 960, 1600],
    urlPath: "/assets/bild/",
    outputDir: "_site/assets/bild/",
    svgShortCircuit: true,
    htmlOptions: {
      imgAttributes: { decoding: "async", sizes: "(max-width: 720px) 100vw, 50vw" }
    }
  });

  // Stile direkt in die Seite schreiben: eine Anfrage weniger, Seite erscheint schneller
  eleventyConfig.addShortcode("inlineCss", () => readFileSync("src/assets/css/main.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, "\n"));

  eleventyConfig.addFilter("jahr", () => new Date().getFullYear());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
