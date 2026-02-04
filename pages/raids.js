const fs = require("fs");
const jsd = require("jsdom");
const { JSDOM } = jsd;
const https = require("https");

function get() {
  return new Promise((resolve) => {
    const url = "https://leekduck.com/raid-bosses/";

    JSDOM.fromURL(url)
      .then((dom) => {
        const document = dom.window.document;

        const absUrl = (maybeRelative) => {
          if (!maybeRelative) return "";
          try {
            return new URL(maybeRelative, url).href;
          } catch {
            return maybeRelative;
          }
        };

        const parseCpRange = (text) => {
          // Ej: "CP 433 - 473"
          if (!text) return { min: -1, max: -1 };
          const cleaned = text.replace(/CP/gi, "").trim();
          if (!cleaned.includes("-")) return { min: -1, max: -1 };
          const [a, b] = cleaned.split("-").map((n) => parseInt(n.trim(), 10));
          return {
            min: Number.isFinite(a) ? a : -1,
            max: Number.isFinite(b) ? b : -1,
          };
        };

        const bosses = [];

        function parseContainer(containerSelector, shadow) {
          const container = document.querySelector(containerSelector);
          if (!container) return;

          container.querySelectorAll(".tier").forEach((tierEl) => {
            const tierLabel =
              tierEl.querySelector("h2.header .tier-label")?.textContent?.trim() ||
              tierEl.querySelector("h2.header")?.textContent?.trim() ||
              "";

            // opcional: nota del tier (ej: “Tatsugiri appears in your region's form”)
            const tierNote = tierEl.querySelector("p.note")?.textContent?.trim() || "";

            tierEl.querySelectorAll(".card").forEach((card) => {
              const boss = {
                name: "",
                tier: tierLabel,
                canBeShiny: false,
                types: [],
                combatPower: {
                  normal: { min: -1, max: -1 },
                  boosted: { min: -1, max: -1 },
                },
                boostedWeather: [],
                image: "",
                shadow,
                // si quieres guardar notas por tier:
                note: tierNote || undefined,
              };

              // Imagen
              const imgEl = card.querySelector(".boss-img img");
              if (imgEl) boss.image = absUrl(imgEl.getAttribute("src"));

              // Shiny
              if (card.querySelector("svg.shiny-icon, .shiny-icon")) boss.canBeShiny = true;

              // Nombre
              const nameEl = card.querySelector(".identity .name");
              if (nameEl) boss.name = nameEl.textContent.trim();

              // Tipos
              card.querySelectorAll(".boss-type img").forEach((img) => {
                const typeName =
                  (img.getAttribute("title") || img.getAttribute("alt") || "").trim().toLowerCase();
                boss.types.push({
                  name: typeName,
                  image: absUrl(img.getAttribute("src")),
                });
              });

              // CP normal
              boss.combatPower.normal = parseCpRange(card.querySelector(".cp-range")?.textContent);

              // CP boosted (nuevo selector)
              boss.combatPower.boosted = parseCpRange(
                card.querySelector(".boosted-cp-row .boosted-cp")?.textContent
              );

              // Clima boosted (alt + src relativo)
              card.querySelectorAll(".weather-boosted img").forEach((img) => {
                const weatherName =
                  (img.getAttribute("alt") || img.getAttribute("title") || "")
                    .trim()
                    .toLowerCase();

                boss.boostedWeather.push({
                  name: weatherName,
                  image: absUrl(img.getAttribute("src")),
                });
              });

              // Limpia undefined si no quieres esa key
              if (!boss.note) delete boss.note;

              bosses.push(boss);
            });
          });
        }

        // Regular
        parseContainer(".raid-bosses", false);

        // Shadow
        parseContainer(".shadow-raid-bosses", true);

        fs.writeFileSync("files/raids.json", JSON.stringify(bosses, null, 4));
        fs.writeFileSync("files/raids.min.json", JSON.stringify(bosses));

        resolve();
      })
      .catch((err) => {
        console.log(err);
        https
          .get("https://raw.githubusercontent.com/GaelVM/DataDuck/data/raids.min.json", (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              try {
                const json = JSON.parse(body);
                fs.writeFileSync("files/raids.json", JSON.stringify(json, null, 4));
                fs.writeFileSync("files/raids.min.json", JSON.stringify(json));
              } catch (error) {
                console.error(error.message);
              }
              resolve();
            });
          })
          .on("error", (error) => {
            console.error(error.message);
            resolve();
          });
      });
  });
}

module.exports = { get };
