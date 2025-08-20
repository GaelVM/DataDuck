const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get() {
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/boss/")
            .then((dom) => {
                const document = dom.window.document;
                let bosses = [];

                // Función para procesar una sección (normal o shadow)
                function parseSection(sectionSelector, isShadow = false) {
                    const sections = document.querySelectorAll(sectionSelector);

                    sections.forEach(section => {
                        const tierTitle = section.querySelector("h2.header");
                        let currentTier = tierTitle ? tierTitle.textContent.trim() : "";

                        section.querySelectorAll(".card").forEach(card => {
                            const boss = {
                                name: "",
                                tier: currentTier,
                                canBeShiny: false,
                                types: [],
                                combatPower: {
                                    normal: { min: -1, max: -1 },
                                    boosted: { min: -1, max: -1 }
                                },
                                boostedWeather: [],
                                image: "",
                                shadow: isShadow
                            };

                            // Imagen y shiny
                            const imgEl = card.querySelector(".boss-img img");
                            if (imgEl) boss.image = imgEl.src;
                            if (card.querySelector(".shiny-icon")) boss.canBeShiny = true;

                            // Nombre
                            const nameEl = card.querySelector(".identity .name");
                            if (nameEl) boss.name = nameEl.textContent.trim();

                            // Tipos
                            card.querySelectorAll(".boss-type img").forEach(img => {
                                boss.types.push({ name: img.title.toLowerCase(), image: img.src });
                            });

                            // CP normal
                            const cpText = card.querySelector(".cp-range")?.textContent.replace("CP", "").trim();
                            if (cpText && cpText.includes("-")) {
                                const [min, max] = cpText.split("-").map(n => parseInt(n.trim()));
                                boss.combatPower.normal.min = min;
                                boss.combatPower.normal.max = max;
                            }

                            // CP potenciado + clima
                            const boostBlock = card.querySelector(".weather-boosted");
                            if (boostBlock) {
                                boostBlock.querySelectorAll(".boss-weather img").forEach(img => {
                                    boss.boostedWeather.push({ name: img.title.toLowerCase(), image: img.src });
                                });

                                const cpBoostText = boostBlock.querySelector(".boosted-cp")?.textContent.replace("CP", "").trim();
                                if (cpBoostText && cpBoostText.includes("-")) {
                                    const [min, max] = cpBoostText.split("-").map(n => parseInt(n.trim()));
                                    boss.combatPower.boosted.min = min;
                                    boss.combatPower.boosted.max = max;
                                }
                            }

                            bosses.push(boss);
                        });
                    });
                }

                // Parsear raids normales
                parseSection(".raid-bosses .tier", false);

                // Parsear shadow raids
                parseSection(".shadow-raid-bosses .tier", true);

                // Guardar archivos
                fs.writeFile('files/raids.json', JSON.stringify(bosses, null, 4), err => {
                    if (err) console.error(err);
                });
                fs.writeFile('files/raids.min.json', JSON.stringify(bosses), err => {
                    if (err) console.error(err);
                });

                resolve();
            })
            .catch(_err => {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/GaelVM/DataDuck/data/raids.min.json", (res) => {
                    let body = "";
                    res.on("data", chunk => { body += chunk; });
                    res.on("end", () => {
                        try {
                            let json = JSON.parse(body);
                            fs.writeFile('files/raids.json', JSON.stringify(json, null, 4), err => {
                                if (err) console.error(err);
                            });
                            fs.writeFile('files/raids.min.json', JSON.stringify(json), err => {
                                if (err) console.error(err);
                            });
                        } catch (error) {
                            console.error(error.message);
                        }
                    });
                }).on("error", error => {
                    console.error(error.message);
                });
            });
    });
}

module.exports = { get };
